import { describe, expect, it } from "vitest";
import { createInMemoryManualPortfolioRepository, createManualPortfolioBrokerAdapter, createTossBrokerAdapter } from "./broker-adapter";
import { createCommanderRuntime, InMemoryAgentRunRepository, InMemoryArtifactStore } from "./commander-runtime";
import { createMockTossReadonlyConnector } from "./toss-readonly-connector";

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

  it("advertises only the BrokerTossAgent read-only tool contract without leaking mock secrets", async () => {
    const repository = new InMemoryAgentRunRepository();
    const artifacts = new InMemoryArtifactStore();
    const runtime = createCommanderRuntime({
      repository,
      artifactStore: artifacts,
      tossReadOnlyConnector: createMockTossReadonlyConnector({
        clientId: "mock_client_id",
        clientSecret: "fixture-private-value-alpha",
        accessToken: "fixture-private-value-beta"
      }),
      clock: () => new Date("2026-06-05T01:00:00.000Z"),
      idFactory: (() => {
        let index = 0;
        return (prefix: string) => `${prefix}_${++index}`;
      })()
    });

    const response = await runtime.handleUserMessage({
      message: "토스 계좌 연결 상태와 사용할 수 있는 읽기 도구만 알려줘",
      permissionMode: "manual",
      context: {
        selectedSymbol: "005930"
      }
    });

    const brokerEvent = response.timeline.find((event) => event.agent === "BrokerTossAgent");
    expect(brokerEvent?.metadata?.toolContract).toEqual([
      "toss.listAccounts",
      "toss.getHoldings",
      "toss.getCurrentPrices",
      "toss.getOrderbookSummary",
      "toss.getExchangeRate",
      "toss.getMarketCalendar",
      "toss.getStockWarnings"
    ]);
    expect(brokerEvent?.metadata?.forbiddenOperations).toEqual(["createOrder", "modifyOrder", "cancelOrder"]);
    expect(response.answer).toContain("Toss 읽기 도구");

    const serialized = JSON.stringify({
      response,
      artifactContents: [...artifacts.contents.values()]
    });
    expect(serialized).not.toContain("fixture-private-value-alpha");
    expect(serialized).not.toContain("fixture-private-value-beta");
  });

  it("adds only Toss snapshot availability and freshness to BrokerTossAgent context", async () => {
    const repository = new InMemoryAgentRunRepository();
    const artifacts = new InMemoryArtifactStore();
    const runtime = createCommanderRuntime({
      repository,
      artifactStore: artifacts,
      tossReadOnlyConnector: createMockTossReadonlyConnector({
        clientId: "mock_client_id",
        clientSecret: "fixture-private-value-alpha",
        accessToken: "fixture-private-value-beta"
      }),
      tossSnapshotReader: {
        async getFreshnessStatus() {
          return {
            mode: "mock_replay",
            status: "fresh",
            source: "mock_replay_snapshot",
            lastSuccessfulSyncAt: "2026-06-05T01:00:00.000Z",
            ageSeconds: 180,
            staleAfterSeconds: 300,
            accountCount: 1,
            holdingCount: 1,
            quoteCount: 1,
            orderbookCount: 1,
            exchangeRateCount: 1,
            marketCalendarCount: 2,
            stockWarningCount: 1,
            rateLimitScopes: ["getAccounts", "getHoldings"],
            message: "Mock replay Toss read-only snapshots are fresh."
          };
        }
      },
      clock: () => new Date("2026-06-05T01:03:00.000Z"),
      idFactory: (() => {
        let index = 0;
        return (prefix: string) => `${prefix}_${++index}`;
      })()
    });

    const response = await runtime.handleUserMessage({
      message: "토스 스냅샷 상태만 알려줘",
      permissionMode: "manual",
      context: {
        selectedSymbol: "005930"
      }
    });

    const brokerEvent = response.timeline.find((event) => event.agent === "BrokerTossAgent");
    expect(brokerEvent?.metadata?.snapshotFreshness).toMatchObject({
      mode: "mock_replay",
      status: "fresh",
      lastSuccessfulSyncAt: "2026-06-05T01:00:00.000Z",
      accountCount: 1
    });
    expect(response.answer).toContain("스냅샷 freshness");
    expect(response.answer).not.toContain("삼성전자 10주");
    expect(response.answer).not.toContain("현재 계좌");

    const serialized = JSON.stringify({
      response,
      artifactContents: [...artifacts.contents.values()]
    });
    for (const forbidden of [
      "fixture-private-value-alpha",
      "fixture-private-value-beta",
      "fixture-account-ref-9012",
      "fixture-order-id-should-never-appear"
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("publishes broker-independent BrokerAgent availability before Toss specialist metadata", async () => {
    const repository = new InMemoryAgentRunRepository();
    const artifacts = new InMemoryArtifactStore();
    const manualRepository = createInMemoryManualPortfolioRepository({
      clock: () => new Date("2026-06-06T02:00:00.000Z")
    });
    await manualRepository.upsertWatchlistItem({
      symbol: "005930",
      market: "KR",
      name: "Samsung Electronics",
      note: "Manual watchlist item"
    });

    const runtime = createCommanderRuntime({
      repository,
      artifactStore: artifacts,
      brokerAdapters: [
        createManualPortfolioBrokerAdapter({ repository: manualRepository }),
        createTossBrokerAdapter({
          connector: createMockTossReadonlyConnector({
            clientId: "mock_client_id",
            clientSecret: "fixture-private-value-alpha",
            accessToken: "fixture-private-value-beta"
          }),
          snapshotReader: {
            async getFreshnessStatus() {
              return {
                mode: "mock_replay",
                status: "fresh",
                source: "mock_replay_snapshot",
                lastSuccessfulSyncAt: "2026-06-05T01:00:00.000Z",
                ageSeconds: 180,
                staleAfterSeconds: 300,
                accountCount: 1,
                holdingCount: 1,
                quoteCount: 1,
                orderbookCount: 1,
                exchangeRateCount: 1,
                marketCalendarCount: 2,
                stockWarningCount: 1,
                rateLimitScopes: ["getAccounts", "getHoldings"],
                message: "Mock replay Toss read-only snapshots are fresh."
              };
            }
          }
        })
      ],
      clock: () => new Date("2026-06-06T02:03:00.000Z"),
      idFactory: (() => {
        let index = 0;
        return (prefix: string) => `${prefix}_${++index}`;
      })()
    });

    const response = await runtime.handleUserMessage({
      message: "브로커 공통 상태와 토스 어댑터 상태를 같이 알려줘",
      permissionMode: "manual",
      context: {
        selectedSymbol: "005930"
      }
    });

    const agents = response.timeline.map((event) => event.agent);
    expect(agents.indexOf("BrokerAgent")).toBeLessThan(agents.indexOf("BrokerTossAgent"));

    const brokerEvent = response.timeline.find((event) => event.agent === "BrokerAgent");
    expect(brokerEvent?.metadata?.adapters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: {
            id: "manual",
            displayName: "Manual portfolio"
          },
          status: "no_broker",
          authorityLevel: "no_broker"
        }),
        expect.objectContaining({
          provider: {
            id: "toss",
            displayName: "Toss Invest"
          },
          status: "mock_replay",
          authorityLevel: "read_only"
        })
      ])
    );

    expect(response.answer).toContain("broker adapter availability");
    expect(response.answer).not.toContain("Samsung Electronics 10 shares");
    expect(JSON.stringify(response)).not.toContain("fixture-private-value-alpha");
    expect(JSON.stringify(response)).not.toContain("fixture-private-value-beta");
  });
});
