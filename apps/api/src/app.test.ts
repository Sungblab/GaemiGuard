import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createMockTossReadonlyConnector } from "@gaemiguard/core";
import { afterEach, describe, expect, it } from "vitest";
import { buildApiApp } from "./app";

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

describe("buildApiApp", () => {
  it("returns health checks and persists a commander chat run", async () => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-api-"));
    tempDirs.push(dataDir);

    const app = await buildApiApp({ dataDir });

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json().checks.map((check: { name: string }) => check.name)).toEqual([
      "local_api",
      "sqlite",
      "artifacts",
      "commander",
      "toss_read_only",
      "sidecars",
      "kill_switch"
    ]);

    const chat = await app.inject({
      method: "POST",
      url: "/chat",
      payload: {
        message: "삼성전자 지금 사도 되는지 내 계좌 기준으로 봐줘",
        permissionMode: "manual",
        context: {
          selectedSymbol: "005930"
        }
      }
    });

    expect(chat.statusCode).toBe(200);
    const body = chat.json();
    expect(body.run.status).toBe("completed");
    expect(body.answer).toContain("실주문은 Stage 1에서 차단");

    const loaded = await app.inject({ method: "GET", url: `/agent-runs/${body.run.id}` });
    expect(loaded.statusCode).toBe(200);
    expect(loaded.json().run.id).toBe(body.run.id);

    await app.close();
  });

  it("exposes Toss read-only health without writing mock secrets or tokens to SQLite or artifacts", async () => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-api-"));
    tempDirs.push(dataDir);

    const app = await buildApiApp({
      dataDir,
      tossReadOnlyConnector: createMockTossReadonlyConnector({
        clientId: "mock_client_id",
        clientSecret: "fixture-private-value-alpha",
        accessToken: "fixture-private-value-beta"
      })
    });

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    const tossCheck = health.json().checks.find((check: { name: string }) => check.name === "toss_read_only");
    expect(tossCheck).toMatchObject({
      status: "ok",
      metadata: {
        mode: "mock_replay",
        openApiVersion: "1.0.3"
      }
    });

    const chat = await app.inject({
      method: "POST",
      url: "/chat",
      payload: {
        message: "토스 읽기 연결 상태만 확인해줘",
        permissionMode: "manual"
      }
    });
    expect(chat.statusCode).toBe(200);

    const serializedApiResponses = `${health.body}\n${chat.body}`;
    expect(serializedApiResponses).not.toContain("fixture-private-value-alpha");
    expect(serializedApiResponses).not.toContain("fixture-private-value-beta");

    const diskText = readDiskText(dataDir);
    expect(diskText).not.toContain("fixture-private-value-alpha");
    expect(diskText).not.toContain("fixture-private-value-beta");

    await app.close();
  });

  it("exposes safe Toss mock snapshot freshness in health and Commander metadata", async () => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-api-"));
    tempDirs.push(dataDir);

    const app = await buildApiApp({
      dataDir,
      tossReadOnlyConnector: createMockTossReadonlyConnector({
        clientId: "mock_client_id",
        clientSecret: "fixture-private-value-alpha",
        accessToken: "fixture-private-value-beta"
      }),
      tossReadonlyMockSync: {
        enabled: true,
        symbols: ["005930"]
      },
      clock: () => new Date("2026-06-05T01:03:00.000Z")
    });

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    const tossCheck = health.json().checks.find((check: { name: string }) => check.name === "toss_read_only");
    expect(tossCheck).toMatchObject({
      status: "ok",
      metadata: {
        mode: "mock_replay",
        snapshotFreshness: {
          mode: "mock_replay",
          status: "fresh",
          source: "mock_replay_snapshot",
          lastSuccessfulSyncAt: "2026-06-05T01:03:00.000Z",
          accountCount: 1,
          holdingCount: 1,
          quoteCount: 1
        }
      }
    });
    expect(tossCheck.message).toContain("mock replay");
    expect(tossCheck.message).not.toContain("connected");

    const chat = await app.inject({
      method: "POST",
      url: "/chat",
      payload: {
        message: "토스 스냅샷 freshness만 확인해줘",
        permissionMode: "manual",
        context: {
          selectedSymbol: "005930"
        }
      }
    });
    expect(chat.statusCode).toBe(200);
    const brokerEvent = chat
      .json()
      .timeline.find((event: { agent: string }) => event.agent === "BrokerTossAgent");
    expect(brokerEvent.metadata.snapshotFreshness).toMatchObject({
      mode: "mock_replay",
      status: "fresh",
      accountCount: 1
    });
    expect(chat.body).not.toContain("삼성전자 10주");

    const serializedApiResponses = `${health.body}\n${chat.body}`;
    const diskText = readDiskText(dataDir);
    for (const forbidden of [
      "fixture-private-value-alpha",
      "fixture-private-value-beta",
      "fixture-account-ref-9012",
      "fixture-order-id-should-never-appear"
    ]) {
      expect(serializedApiResponses).not.toContain(forbidden);
      expect(diskText).not.toContain(forbidden);
    }

    await app.close();
  });
});
