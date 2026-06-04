import { describe, expect, it } from "vitest";
import { createCommanderRuntime, InMemoryAgentRunRepository, InMemoryArtifactStore } from "./commander-runtime";

describe("createCommanderRuntime", () => {
  it("creates a persisted run, specialist timeline, and artifacts for a Stage 1 chat", async () => {
    const repository = new InMemoryAgentRunRepository();
    const artifacts = new InMemoryArtifactStore();
    const runtime = createCommanderRuntime({
      repository,
      artifactStore: artifacts,
      clock: () => new Date("2026-06-04T09:00:00.000Z"),
      idFactory: (() => {
        let index = 0;
        return (prefix: string) => `${prefix}_${++index}`;
      })()
    });

    const response = await runtime.handleUserMessage({
      message: "삼성전자 이 구간 이후 왜 떨어졌고 지금 사도 되는지, 내 계좌 기준으로 봐줘",
      permissionMode: "manual",
      context: {
        selectedSymbol: "005930",
        selectedRange: {
          from: "2026-03-01",
          to: "2026-06-04"
        }
      }
    });

    expect(response.run.status).toBe("completed");
    expect(response.answer).toContain("실주문은 Stage 1에서 차단");
    expect(response.timeline.map((event) => event.agent)).toEqual([
      "CommanderAgent",
      "PortfolioAgent",
      "ResearchAgent",
      "ScenarioAgent",
      "OrderGuardAgent",
      "CommanderAgent"
    ]);
    expect(response.artifacts.map((artifact) => artifact.kind)).toEqual(
      expect.arrayContaining(["scenario_markdown", "order_review_json"])
    );

    const saved = await repository.findById(response.run.id);
    expect(saved?.run.id).toBe(response.run.id);
    expect(artifacts.records).toHaveLength(2);
  });
});
