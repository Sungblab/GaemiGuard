import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildApiApp } from "./app";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

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
});

