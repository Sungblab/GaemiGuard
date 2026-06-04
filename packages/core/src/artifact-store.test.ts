import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FileArtifactStore } from "./artifact-store";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("FileArtifactStore", () => {
  it("writes files locally but returns a portable relative artifact path", async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-artifacts-"));
    tempDirs.push(dir);

    const store = new FileArtifactStore(path.join(dir, "artifacts"));
    const record = await store.writeArtifact({
      id: "artifact_1",
      runId: "run_1",
      kind: "scenario_markdown",
      title: "Scenario",
      createdAt: "2026-06-04T09:00:00.000Z",
      extension: "md",
      content: "# Scenario"
    });

    expect(record.path).toBe("artifacts/runs/2026-06-04/run_1/scenario_markdown.md");
    expect(path.isAbsolute(record.path)).toBe(false);
    expect(existsSync(path.join(dir, "artifacts", "runs", "2026-06-04", "run_1", "scenario_markdown.md"))).toBe(true);
  });
});

