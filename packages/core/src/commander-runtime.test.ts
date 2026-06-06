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

  it("says account facts are unknown when source and freshness are not production grounded", async () => {
    const repository = new InMemoryAgentRunRepository();
    const artifacts = new InMemoryArtifactStore();
    const runtime = createCommanderRuntime({
      repository,
      artifactStore: artifacts,
      brokerAdapters: [
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
      message: "내 005930 보유 수량 알려줘",
      permissionMode: "manual",
      context: {
        selectedSymbol: "005930"
      }
    });

    expect(response.answer).toContain("source/freshness가 없어서 모릅니다");
    expect(response.answer).not.toContain("005930 10");
    expect(JSON.stringify(response)).not.toContain("fixture-private-value-alpha");
    expect(JSON.stringify(response)).not.toContain("fixture-private-value-beta");
  });

  it("grounds account answers only from production Toss snapshots with freshness metadata", async () => {
    const repository = new InMemoryAgentRunRepository();
    const artifacts = new InMemoryArtifactStore();
    const runtime = createCommanderRuntime({
      repository,
      artifactStore: artifacts,
      tossSnapshotReader: {
        async getFreshnessStatus() {
          return {
            mode: "production_secret_store",
            status: "fresh",
            source: "production_snapshot",
            lastSuccessfulSyncAt: "2026-06-06T03:00:00.000Z",
            ageSeconds: 60,
            staleAfterSeconds: 300,
            accountCount: 1,
            holdingCount: 1,
            quoteCount: 1,
            orderbookCount: 1,
            exchangeRateCount: 1,
            marketCalendarCount: 2,
            stockWarningCount: 0,
            rateLimitScopes: ["getAccounts", "getHoldings"],
            message: "Production Toss read-only snapshots are fresh."
          };
        },
        async readLatest() {
          return {
            accounts: [
              {
                accountRef: "********1234",
                maskedAccountNo: "********1234",
                accountType: { value: "BROKERAGE", known: true },
                lastSyncedAt: "2026-06-06T03:00:00.000Z"
              }
            ],
            holdings: [
              {
                snapshotId: "toss_holdings_snapshot_test",
                accountRef: "********1234",
                syncedAt: "2026-06-06T03:00:00.000Z",
                overview: {
                  totalPurchaseAmount: { krw: "1000000", usd: null },
                  marketValue: {
                    amount: { krw: "1050000", usd: null },
                    amountAfterCost: { krw: "1047000", usd: null }
                  },
                  profitLoss: {
                    amount: { krw: "50000", usd: null },
                    amountAfterCost: { krw: "47000", usd: null },
                    rate: "5.00",
                    rateAfterCost: "4.70"
                  },
                  dailyProfitLoss: {
                    amount: { krw: "-10000", usd: null },
                    rate: "-0.95"
                  },
                  items: [
                    {
                      symbol: "005930",
                      name: "Samsung Electronics",
                      marketCountry: { value: "KR", known: true },
                      currency: { value: "KRW", known: true },
                      quantity: "10",
                      lastPrice: "70000",
                      averagePurchasePrice: "65000",
                      marketValue: {
                        purchaseAmount: "650000",
                        amount: "700000",
                        amountAfterCost: "698000"
                      },
                      profitLoss: {
                        amount: "50000",
                        amountAfterCost: "48000",
                        rate: "7.69",
                        rateAfterCost: "7.38"
                      },
                      dailyProfitLoss: {
                        amount: "-5000",
                        rate: "-0.71"
                      },
                      cost: {
                        commission: "1500",
                        tax: "500"
                      }
                    }
                  ]
                }
              }
            ],
            quotes: [],
            orderbooks: [],
            exchangeRates: [],
            marketCalendars: [],
            stockWarnings: [],
            syncLogs: [],
            rateLimits: []
          };
        }
      },
      clock: () => new Date("2026-06-06T03:01:00.000Z"),
      idFactory: (() => {
        let index = 0;
        return (prefix: string) => `${prefix}_${++index}`;
      })()
    });

    const response = await runtime.handleUserMessage({
      message: "내 005930 보유 수량 알려줘",
      permissionMode: "manual",
      context: {
        selectedSymbol: "005930"
      }
    });

    expect(response.answer).toContain("production_snapshot");
    expect(response.answer).toContain("last sync 2026-06-06T03:00:00.000Z");
    expect(response.answer).toContain("005930 보유 수량은 10");
    expect(response.answer).toContain("********1234");
    expect(JSON.stringify(response)).not.toContain("987654321");
    expect(JSON.stringify(response)).not.toContain("fixture-private-value-alpha");
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

  it("uses local thesis, rule, and journal memory only when source freshness is usable", async () => {
    const repository = new InMemoryAgentRunRepository();
    const artifacts = new InMemoryArtifactStore();
    const runtime = createCommanderRuntime({
      repository,
      artifactStore: artifacts,
      investmentMemory: {
        async recall() {
          return {
            items: [
              {
                id: "memory_thesis_1",
                kind: "thesis",
                symbol: "005930",
                title: "Samsung cycle recovery",
                body: "Buy only if the memory source stays fresh.",
                version: 1,
                createdAt: "2026-06-06T04:00:00.000Z",
                updatedAt: "2026-06-06T04:00:00.000Z",
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
              },
              {
                id: "memory_rule_1",
                kind: "rule",
                title: "No stale account facts",
                body: "Do not use stale broker facts for sizing.",
                version: 1,
                createdAt: "2026-06-06T04:01:00.000Z",
                updatedAt: "2026-06-06T04:01:00.000Z",
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
              },
              {
                id: "memory_journal_1",
                kind: "journal",
                symbol: "005930",
                title: "Journal entry",
                body: "The position still matches the thesis.",
                version: 1,
                createdAt: "2026-06-06T04:02:00.000Z",
                updatedAt: "2026-06-06T04:02:00.000Z",
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
              },
              {
                id: "memory_thesis_stale",
                kind: "thesis",
                symbol: "005930",
                title: "Stale thesis",
                body: "This stale note must not be used.",
                version: 1,
                createdAt: "2026-06-01T04:00:00.000Z",
                updatedAt: "2026-06-01T04:00:00.000Z",
                source: {
                  kind: "broker_snapshot",
                  label: "Old broker snapshot",
                  capturedAt: "2026-06-01T04:00:00.000Z",
                  freshness: {
                    status: "stale",
                    source: "production_snapshot",
                    message: "Production snapshot is stale."
                  },
                  brokerSnapshot: {
                    providerId: "toss",
                    source: "production_snapshot",
                    freshnessStatus: "stale",
                    lastSuccessfulSyncAt: "2026-06-01T03:55:00.000Z"
                  }
                }
              }
            ],
            skipped: [
              {
                id: "memory_thesis_stale",
                reason: "stale_source"
              }
            ]
          };
        }
      },
      clock: () => new Date("2026-06-06T04:05:00.000Z"),
      idFactory: (() => {
        let index = 0;
        return (prefix: string) => `${prefix}_${++index}`;
      })()
    });

    const response = await runtime.handleUserMessage({
      message: "내 005930 투자 논리와 원칙, 지난 매매 기록을 같이 봐줘",
      permissionMode: "manual",
      context: {
        selectedSymbol: "005930"
      }
    });

    const memoryEvent = response.timeline.find((event) => event.agent === "MemoryAgent");
    expect(memoryEvent?.metadata?.usedMemory).toEqual([
      {
        id: "memory_thesis_1",
        kind: "thesis",
        source: "manual_input",
        freshnessStatus: "fresh"
      },
      {
        id: "memory_rule_1",
        kind: "rule",
        source: "manual_input",
        freshnessStatus: "fresh"
      },
      {
        id: "memory_journal_1",
        kind: "journal",
        source: "production_snapshot",
        freshnessStatus: "fresh"
      }
    ]);
    expect(memoryEvent?.metadata?.skippedMemory).toEqual([{ id: "memory_thesis_stale", reason: "stale_source" }]);
    expect(response.answer).toContain("Stage 3 memory context");
    expect(response.answer).toContain("thesis: Samsung cycle recovery");
    expect(response.answer).toContain("rule: No stale account facts");
    expect(response.answer).toContain("journal: Journal entry");
    expect(response.answer).not.toContain("Stale thesis");
  });

  it("uses source-backed research artifacts only when their source freshness is usable", async () => {
    const repository = new InMemoryAgentRunRepository();
    const artifacts = new InMemoryArtifactStore();
    const runtime = createCommanderRuntime({
      repository,
      artifactStore: artifacts,
      investmentMemory: {
        async recall() {
          return {
            items: [
              {
                id: "research_artifact_1",
                kind: "research",
                symbol: "005930",
                title: "Samsung HBM capacity memo",
                body: "Research artifact should be usable only with fresh source metadata.",
                version: 1,
                createdAt: "2026-06-06T05:00:00.000Z",
                updatedAt: "2026-06-06T05:00:00.000Z",
                source: {
                  kind: "research_artifact",
                  label: "Local imported research memo",
                  capturedAt: "2026-06-06T05:00:00.000Z",
                  freshness: {
                    status: "fresh",
                    source: "manual_input",
                    message: "Local research artifact was reviewed by the user."
                  }
                },
                research: {
                  links: {
                    symbols: ["005930"],
                    holdingSymbols: ["005930"],
                    watchlistSymbols: ["000660"],
                    userQuestion: "Does this change my Samsung thesis?"
                  }
                }
              },
              {
                id: "research_artifact_stale",
                kind: "research",
                symbol: "005930",
                title: "Old Samsung rumor note",
                body: "This stale research artifact must not be used.",
                version: 1,
                createdAt: "2026-06-01T05:00:00.000Z",
                updatedAt: "2026-06-01T05:00:00.000Z",
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
                research: {
                  links: {
                    symbols: ["005930"],
                    userQuestion: "Old rumor"
                  }
                }
              }
            ],
            skipped: [{ id: "research_artifact_stale", reason: "stale_source" }]
          };
        }
      },
      clock: () => new Date("2026-06-06T05:05:00.000Z"),
      idFactory: (() => {
        let index = 0;
        return (prefix: string) => `${prefix}_${++index}`;
      })()
    });

    const response = await runtime.handleUserMessage({
      message: "005930 리서치가 내 투자 논리를 바꾸는지 봐줘",
      permissionMode: "manual",
      context: {
        selectedSymbol: "005930"
      }
    });

    const memoryEvent = response.timeline.find((event) => event.agent === "MemoryAgent");
    expect(memoryEvent?.metadata?.usedMemory).toEqual([
      {
        id: "research_artifact_1",
        kind: "research",
        source: "manual_input",
        freshnessStatus: "fresh"
      }
    ]);
    expect(memoryEvent?.metadata?.skippedMemory).toEqual([{ id: "research_artifact_stale", reason: "stale_source" }]);
    expect(response.answer).toContain("research: Samsung HBM capacity memo");
    expect(response.answer).not.toContain("Old Samsung rumor note");
  });
});
