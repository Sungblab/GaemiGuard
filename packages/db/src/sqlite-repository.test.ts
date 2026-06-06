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

  it("persists manual portfolio inputs with only synthetic account references", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-db-"));
    tempDirs.push(dir);

    const db = createGaemiGuardDatabase({ dataDir: dir });

    await db.manualPortfolio.upsertWatchlistItem({
      symbol: "005930",
      market: "KR",
      name: "Samsung Electronics",
      note: "Manual watchlist item"
    });
    await db.manualPortfolio.upsertHolding({
      symbol: "005930",
      market: "KR",
      currency: "KRW",
      name: "Samsung Electronics",
      quantity: "10",
      averageCost: "65000",
      note: "Manual local holding"
    });
    await db.manualPortfolio.upsertCashBalance({
      currency: "KRW",
      amount: "1000000"
    });

    const snapshot = await db.manualPortfolio.readSnapshot();
    expect(snapshot.account).toEqual({
      accountRef: "manual:default",
      displayLabel: "Manual portfolio",
      providerId: "manual",
      source: "manual_input",
      accountType: "MANUAL"
    });
    expect(snapshot.watchlist[0]).toMatchObject({
      symbol: "005930",
      source: "manual_input",
      updatedAt: expect.any(String)
    });
    expect(snapshot.holdings[0]).toMatchObject({
      accountRef: "manual:default",
      symbol: "005930",
      source: "manual_input"
    });
    expect(snapshot.cashBalances).toEqual([
      {
        accountRef: "manual:default",
        currency: "KRW",
        amount: "1000000",
        source: "manual_input",
        updatedAt: expect.any(String)
      }
    ]);
    expect(snapshot.freshness).toMatchObject({
      status: "local_manual",
      source: "manual_input"
    });

    const serialized = JSON.stringify(snapshot);
    const diskText = readDiskText(dir);
    for (const forbidden of [
      "fixture-private-value-alpha",
      "fixture-private-value-beta",
      "fixture-account-ref-9012",
      "fixture-order-id-should-never-appear"
    ]) {
      expect(serialized).not.toContain(forbidden);
      expect(diskText).not.toContain(forbidden);
    }

    db.close();
  });

  it("persists local thesis, rule, and journal memory with source freshness and redaction", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-db-"));
    tempDirs.push(dir);

    const db = createGaemiGuardDatabase({ dataDir: dir });

    await db.investmentMemory.upsertThesis({
      symbol: "005930",
      title: "Samsung cycle recovery",
      body: "Thesis should not store fixture-private-value-alpha or raw account 987654321.",
      source: {
        kind: "manual_note",
        label: "Local thesis note",
        capturedAt: "2026-06-06T04:00:00.000Z",
        freshness: {
          status: "fresh",
          source: "manual_input",
          message: "User-authored thesis is current."
        },
        brokerSnapshot: {
          providerId: "toss",
          source: "production_snapshot",
          freshnessStatus: "fresh",
          lastSuccessfulSyncAt: "2026-06-06T03:55:00.000Z"
        }
      }
    });
    await db.investmentMemory.upsertRule({
      name: "No stale account facts",
      body: "Do not use stale broker facts for sizing.",
      source: {
        kind: "manual_note",
        label: "Local rule note",
        capturedAt: "2026-06-06T04:01:00.000Z",
        freshness: {
          status: "fresh",
          source: "manual_input",
          message: "User-authored rule is current."
        }
      }
    });
    await db.investmentMemory.addJournalEntry({
      symbol: "005930",
      body: "Reviewed thesis with masked source ********1234.",
      source: {
        kind: "broker_snapshot",
        label: "Toss production snapshot",
        capturedAt: "2026-06-06T04:02:00.000Z",
        freshness: {
          status: "fresh",
          source: "production_snapshot",
          message: "Production snapshot is fresh.",
          lastUpdatedAt: "2026-06-06T03:55:00.000Z",
          ageSeconds: 300,
          staleAfterSeconds: 600
        },
        brokerSnapshot: {
          providerId: "toss",
          source: "production_snapshot",
          freshnessStatus: "fresh",
          lastSuccessfulSyncAt: "2026-06-06T03:55:00.000Z"
        }
      }
    });

    const recall = await db.investmentMemory.recall({
      symbol: "005930",
      now: "2026-06-06T04:05:00.000Z"
    });

    expect(recall.items.map((item) => item.kind)).toEqual(["thesis", "rule", "journal"]);
    expect(recall.items[0]).toMatchObject({
      kind: "thesis",
      symbol: "005930",
      version: 1,
      source: {
        kind: "manual_note",
        freshness: {
          status: "fresh",
          source: "manual_input"
        },
        brokerSnapshot: {
          source: "production_snapshot",
          freshnessStatus: "fresh"
        }
      }
    });

    const serialized = JSON.stringify(recall);
    const diskText = readDiskText(dir);
    for (const forbidden of [
      "fixture-private-value-alpha",
      "fixture-private-value-beta",
      "fixture-account-ref-9012",
      "fixture-order-id-should-never-appear",
      "987654321"
    ]) {
      expect(serialized).not.toContain(forbidden);
      expect(diskText).not.toContain(forbidden);
    }

    db.close();
  });

  it("persists source-backed research artifacts linked to holdings, watchlist, and user questions", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-db-"));
    tempDirs.push(dir);

    const db = createGaemiGuardDatabase({ dataDir: dir });

    await db.investmentMemory.addResearchArtifact({
      title: "Samsung HBM capacity memo",
      body: "Research artifact must redact fixture-private-value-alpha and raw account 987654321.",
      source: {
        kind: "research_artifact",
        label: "Local imported research memo fixture-account-ref-9012",
        capturedAt: "2026-06-06T05:00:00.000Z",
        freshness: {
          status: "fresh",
          source: "manual_input",
          message: "Local research artifact is user-reviewed and current."
        }
      },
      links: {
        symbols: ["005930"],
        holdingSymbols: ["005930"],
        watchlistSymbols: ["000660"],
        userQuestion: "Does fixture-order-id-should-never-appear change my Samsung thesis?"
      }
    });
    await db.investmentMemory.addResearchArtifact({
      title: "Old Samsung rumor note",
      body: "This stale research artifact should not be recalled.",
      source: {
        kind: "research_artifact",
        label: "Old local memo",
        capturedAt: "2026-06-01T05:00:00.000Z",
        freshness: {
          status: "stale",
          source: "manual_input",
          message: "Local research artifact is stale."
        }
      },
      links: {
        symbols: ["005930"],
        userQuestion: "Old rumor"
      }
    });
    await db.investmentMemory.addResearchArtifact({
      title: "Question-only HBM memo",
      body: "This research artifact is connected through the originating user question.",
      source: {
        kind: "research_artifact",
        label: "Question-linked local memo",
        capturedAt: "2026-06-06T05:01:00.000Z",
        freshness: {
          status: "fresh",
          source: "manual_input",
          message: "Question-linked research artifact is current."
        }
      },
      links: {
        userQuestion: "Does HBM capacity change my thesis?"
      }
    });

    const recall = await db.investmentMemory.recall({
      symbol: "005930",
      now: "2026-06-06T05:05:00.000Z"
    });

    expect(recall.items).toHaveLength(1);
    expect(recall.items[0]).toMatchObject({
      kind: "research",
      symbol: "005930",
      title: "Samsung HBM capacity memo",
      source: {
        kind: "research_artifact",
        freshness: {
          status: "fresh",
          source: "manual_input"
        }
      },
      research: {
        links: {
          symbols: ["005930"],
          holdingSymbols: ["005930"],
          watchlistSymbols: ["000660"]
        }
      }
    });
    expect(recall.skipped).toHaveLength(1);
    expect(recall.skipped[0]?.reason).toBe("stale_source");

    const questionRecall = await db.investmentMemory.recall({
      query: "Does HBM capacity change my thesis?",
      now: "2026-06-06T05:05:00.000Z"
    });
    expect(questionRecall.items.map((item) => item.title)).toEqual(["Question-only HBM memo"]);

    const serialized = JSON.stringify(recall);
    const diskText = readDiskText(dir);
    for (const forbidden of [
      "fixture-private-value-alpha",
      "fixture-account-ref-9012",
      "fixture-order-id-should-never-appear",
      "987654321"
    ]) {
      expect(serialized).not.toContain(forbidden);
      expect(diskText).not.toContain(forbidden);
    }

    db.close();
  });
});
