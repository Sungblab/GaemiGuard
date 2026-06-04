import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createGaemiGuardDatabase } from "./sqlite";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

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
});

