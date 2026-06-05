import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createMockTossReadonlyConnector, syncMockTossReadonlySnapshots } from "@gaemiguard/core";
import { afterEach, describe, expect, it } from "vitest";
import { createGaemiGuardDatabase } from "./sqlite";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function readDiskText(rootDir: string): string {
  let output = "";
  for (const name of readdirSync(rootDir)) {
    const filePath = path.join(rootDir, name);
    const stat = statSync(filePath);
    if (stat.isDirectory()) {
      output += readDiskText(filePath);
    } else {
      output += readFileSync(filePath, "utf8");
    }
  }
  return output;
}

describe("createGaemiGuardDatabase", () => {
  it("migrates and persists agent runs with artifact indexes", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-db-"));
    tempDirs.push(dir);

    const db = createGaemiGuardDatabase({ dataDir: dir });

    await db.runs.save({
      run: {
        id: "run_test",
        status: "completed",
        userMessage: "테스트 질문",
        permissionMode: "manual",
        startedAt: "2026-06-04T09:00:00.000Z",
        finishedAt: "2026-06-04T09:00:01.000Z",
        answer: "테스트 응답"
      },
      timeline: [
        {
          id: "event_1",
          runId: "run_test",
          agent: "CommanderAgent",
          type: "run_started",
          message: "started",
          createdAt: "2026-06-04T09:00:00.000Z"
        }
      ],
      artifacts: [
        {
          id: "artifact_1",
          runId: "run_test",
          kind: "scenario_markdown",
          title: "Scenario",
          path: "artifacts/runs/2026-06-04/run_test/scenario.md",
          createdAt: "2026-06-04T09:00:00.000Z"
        }
      ]
    });

    const loaded = await db.runs.findById("run_test");
    expect(loaded?.run.userMessage).toBe("테스트 질문");
    expect(loaded?.timeline).toHaveLength(1);
    expect(loaded?.artifacts[0]?.kind).toBe("scenario_markdown");

    const listed = await db.runs.listRecent(10);
    expect(listed.map((item) => item.id)).toContain("run_test");

    db.close();
  });

  it("persists Toss mock replay snapshots without raw secrets, tokens, account numbers, or order identifiers", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-db-"));
    tempDirs.push(dir);

    const db = createGaemiGuardDatabase({ dataDir: dir });

    await syncMockTossReadonlySnapshots({
      connector: createMockTossReadonlyConnector({
        clientId: "mock_client_id",
        clientSecret: "fixture-private-value-alpha",
        accessToken: "fixture-private-value-beta"
      }),
      repository: db.tossReadonlySnapshots,
      symbols: ["005930"],
      clock: () => new Date("2026-06-05T01:00:00.000Z"),
      idFactory: (prefix) => `${prefix}_test`
    });

    const snapshots = await db.tossReadonlySnapshots.readLatest();
    expect(snapshots.accounts).toEqual([
      {
        accountRef: "********9012",
        maskedAccountNo: "********9012",
        accountType: { value: "BROKERAGE", known: true },
        lastSyncedAt: "2026-06-05T01:00:00.000Z"
      }
    ]);
    expect(snapshots.holdings).toHaveLength(1);
    expect(snapshots.quotes.map((quote) => quote.symbol)).toEqual(["005930"]);
    expect(snapshots.orderbooks.map((orderbook) => orderbook.symbol)).toEqual(["005930"]);
    expect(snapshots.exchangeRates).toHaveLength(1);
    expect(snapshots.marketCalendars.map((calendar) => calendar.market)).toEqual(["KR", "US"]);
    expect(snapshots.stockWarnings.map((warning) => warning.symbol)).toEqual(["005930"]);
    expect(snapshots.syncLogs[0]).toMatchObject({
      mode: "mock_replay",
      status: "succeeded",
      accountCount: 1,
      holdingCount: 1,
      quoteCount: 1,
      orderbookCount: 1,
      exchangeRateCount: 1,
      marketCalendarCount: 2,
      stockWarningCount: 1
    });
    expect(snapshots.rateLimits.map((item) => item.scope)).toEqual(
      expect.arrayContaining([
        "getAccounts",
        "getHoldings",
        "getPrices",
        "getOrderbook",
        "getExchangeRate",
        "getKrMarketCalendar",
        "getUsMarketCalendar",
        "getStockWarnings"
      ])
    );

    const freshness = await db.tossReadonlySnapshots.getFreshnessStatus({
      now: "2026-06-05T01:03:00.000Z",
      staleAfterSeconds: 300
    });
    expect(freshness).toMatchObject({
      mode: "mock_replay",
      status: "fresh",
      lastSuccessfulSyncAt: "2026-06-05T01:00:00.000Z",
      ageSeconds: 180,
      staleAfterSeconds: 300,
      accountCount: 1,
      quoteCount: 1,
      orderbookCount: 1
    });

    const serializedSnapshots = JSON.stringify(snapshots);
    const diskText = readDiskText(dir);
    for (const forbidden of [
      "fixture-private-value-alpha",
      "fixture-private-value-beta",
      "fixture-account-ref-9012",
      "fixture-order-id-should-never-appear"
    ]) {
      expect(serializedSnapshots).not.toContain(forbidden);
      expect(diskText).not.toContain(forbidden);
    }

    db.close();
  });
});
