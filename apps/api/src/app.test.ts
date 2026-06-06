import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  InMemoryTossTokenCache,
  TossInvestReadonlyClient,
  createInMemoryTossCredentialStore,
  createMockTossReadonlyConnector,
  createTossCredentialProviderFromStore
} from "@gaemiguard/core";
import { afterEach, describe, expect, it } from "vitest";
import { buildApiApp } from "./app";

const tempDirs: string[] = [];

const SENTINEL_CLIENT_SECRET = "fixture-private-value-alpha";
const SENTINEL_ACCESS_TOKEN = "fixture-private-value-beta";
const RAW_ACCOUNT_SEQ_SENTINEL = "987654321";

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

function createProductionReplayFetch() {
  const calls: { path: string; body?: string; account?: string }[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const body = typeof init?.body === "string" ? init.body : undefined;
    const account = headers.get("X-Tossinvest-Account") ?? undefined;
    calls.push({
      path: url.pathname,
      ...(body ? { body } : {}),
      ...(account ? { account } : {})
    });

    if (url.pathname === "/oauth2/token") {
      return new Response(
        JSON.stringify({
          access_token: SENTINEL_ACCESS_TOKEN,
          token_type: "Bearer",
          expires_in: 1800
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const resultByPath: Record<string, unknown> = {
      "/api/v1/accounts": [
        {
          accountNo: "fixture-account-ref-1234",
          accountSeq: Number(RAW_ACCOUNT_SEQ_SENTINEL),
          accountType: "BROKERAGE"
        }
      ],
      "/api/v1/holdings": {
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
            marketCountry: "KR",
            currency: "KRW",
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
      },
      "/api/v1/prices": [
        {
          symbol: "005930",
          timestamp: "2026-06-06T03:00:00Z",
          lastPrice: "70000",
          currency: "KRW"
        }
      ],
      "/api/v1/orderbook": {
        timestamp: "2026-06-06T03:00:00Z",
        currency: "KRW",
        asks: [{ price: "70100", volume: "100" }],
        bids: [{ price: "70000", volume: "120" }]
      },
      "/api/v1/exchange-rate": {
        baseCurrency: "USD",
        quoteCurrency: "KRW",
        rate: "1380.10",
        midRate: "1379.80",
        basisPoint: "0.30",
        rateChangeType: "UP",
        validFrom: "2026-06-06T03:00:00Z",
        validUntil: "2026-06-06T04:00:00Z"
      },
      "/api/v1/market-calendar/KR": {
        today: { date: "2026-06-06", integrated: null },
        previousBusinessDay: { date: "2026-06-05", integrated: null },
        nextBusinessDay: { date: "2026-06-08", integrated: null }
      },
      "/api/v1/market-calendar/US": {
        today: { date: "2026-06-06", regularMarket: null },
        previousBusinessDay: { date: "2026-06-05", regularMarket: null },
        nextBusinessDay: { date: "2026-06-08", regularMarket: null }
      },
      "/api/v1/stocks/005930/warnings": []
    };

    return new Response(JSON.stringify({ result: resultByPath[url.pathname] ?? {} }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": "8",
        "X-RateLimit-Reset": "1"
      }
    });
  };

  return { fetchImpl, calls };
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
      "broker_adapters",
      "toss_read_only",
      "sidecars",
      "kill_switch"
    ]);
    const brokerAdaptersCheck = health.json().checks.find((check: { name: string }) => check.name === "broker_adapters");
    expect(brokerAdaptersCheck).toMatchObject({
      status: "not_configured",
      metadata: {
        adapters: [
          {
            provider: {
              id: "manual",
              displayName: "Manual portfolio"
            },
            status: "no_broker"
          },
          {
            provider: {
              id: "toss",
              displayName: "Toss Invest"
            },
            status: "not_configured"
          }
        ]
      }
    });
    expect(brokerAdaptersCheck.message).not.toContain("connected");

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

  it("stores manual portfolio inputs through local API endpoints without broker identifiers", async () => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-api-"));
    tempDirs.push(dataDir);

    const app = await buildApiApp({ dataDir });

    const watchlist = await app.inject({
      method: "PUT",
      url: "/portfolio/manual/watchlist",
      payload: {
        symbol: "005930",
        market: "KR",
        name: "Samsung Electronics",
        note: "Manual watchlist item"
      }
    });
    expect(watchlist.statusCode).toBe(200);

    const holding = await app.inject({
      method: "PUT",
      url: "/portfolio/manual/holdings",
      payload: {
        symbol: "005930",
        market: "KR",
        currency: "KRW",
        name: "Samsung Electronics",
        quantity: "10",
        averageCost: "65000",
        note: "Manual holding"
      }
    });
    expect(holding.statusCode).toBe(200);

    const cash = await app.inject({
      method: "PUT",
      url: "/portfolio/manual/cash",
      payload: {
        currency: "KRW",
        amount: "1000000"
      }
    });
    expect(cash.statusCode).toBe(200);

    const snapshot = await app.inject({ method: "GET", url: "/portfolio/manual" });
    expect(snapshot.statusCode).toBe(200);
    expect(snapshot.json()).toMatchObject({
      account: {
        accountRef: "manual:default",
        providerId: "manual"
      },
      watchlist: [
        {
          symbol: "005930",
          source: "manual_input"
        }
      ],
      holdings: [
        {
          accountRef: "manual:default",
          symbol: "005930",
          source: "manual_input"
        }
      ],
      cashBalances: [
        {
          accountRef: "manual:default",
          currency: "KRW",
          amount: "1000000",
          source: "manual_input"
        }
      ]
    });

    const serializedApiResponses = `${watchlist.body}\n${holding.body}\n${cash.body}\n${snapshot.body}`;
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
      status: "mock_replay",
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
      status: "mock_replay",
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
    const brokerAdaptersCheck = health.json().checks.find((check: { name: string }) => check.name === "broker_adapters");
    expect(brokerAdaptersCheck).toMatchObject({
      status: "mock_replay",
      metadata: {
        adapters: [
          {
            provider: {
              id: "manual"
            },
            status: "no_broker"
          },
          {
            provider: {
              id: "toss"
            },
            status: "mock_replay",
            freshness: {
              status: "fresh",
              source: "mock_replay_snapshot"
            }
          }
        ]
      }
    });
    expect(brokerAdaptersCheck.message).toContain("mock replay");
    expect(brokerAdaptersCheck.message).not.toContain("connected");

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

  it("sets up and disconnects Toss credentials through a credential boundary without returning secrets", async () => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-api-"));
    tempDirs.push(dataDir);
    const credentialStore = createInMemoryTossCredentialStore({
      provider: "fake_os_credential_store",
      clock: () => new Date("2026-06-06T03:00:00.000Z")
    });

    const app = await buildApiApp({
      dataDir,
      tossCredentialStore: credentialStore,
      clock: () => new Date("2026-06-06T03:00:00.000Z")
    });

    const setup = await app.inject({
      method: "PUT",
      url: "/settings/brokers/toss/credentials",
      payload: {
        clientId: "fixture-client-id",
        clientSecret: SENTINEL_CLIENT_SECRET
      }
    });
    expect(setup.statusCode).toBe(200);
    expect(setup.json()).toMatchObject({
      provider: "toss",
      credentialStatus: {
        configured: true,
        provider: "fake_os_credential_store",
        boundary: "production_secret_store"
      }
    });

    const healthAfterSetup = await app.inject({ method: "GET", url: "/health" });
    expect(healthAfterSetup.statusCode).toBe(200);
    const brokerAdaptersCheck = healthAfterSetup
      .json()
      .checks.find((check: { name: string }) => check.name === "broker_adapters");
    expect(brokerAdaptersCheck).toMatchObject({
      status: "credential_configured"
    });
    const tossAdapter = brokerAdaptersCheck.metadata.adapters.find(
      (adapter: { provider: { id: string } }) => adapter.provider.id === "toss"
    );
    expect(tossAdapter).toMatchObject({
      provider: { id: "toss", displayName: "Toss Invest" },
      status: "credential_configured",
      freshness: {
        source: "production_snapshot",
        status: "never_synced"
      }
    });
    expect(healthAfterSetup.body).not.toContain("Toss Invest adapter is connected");
    expect(healthAfterSetup.body).not.toContain("Toss connected");

    const disconnect = await app.inject({
      method: "DELETE",
      url: "/settings/brokers/toss/credentials"
    });
    expect(disconnect.statusCode).toBe(200);
    expect(disconnect.json()).toMatchObject({
      provider: "toss",
      credentialStatus: {
        configured: false,
        provider: "fake_os_credential_store"
      }
    });

    const serializedApiResponses = `${setup.body}\n${healthAfterSetup.body}\n${disconnect.body}`;
    const diskText = readDiskText(dataDir);
    for (const forbidden of [SENTINEL_CLIENT_SECRET, SENTINEL_ACCESS_TOKEN, RAW_ACCOUNT_SEQ_SENTINEL]) {
      expect(serializedApiResponses).not.toContain(forbidden);
      expect(diskText).not.toContain(forbidden);
    }

    await app.close();
  });

  it("runs real Toss read-only sync with production credentials and exposes source/freshness safely", async () => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-api-"));
    tempDirs.push(dataDir);
    const credentialStore = createInMemoryTossCredentialStore({
      provider: "fake_os_credential_store",
      clock: () => new Date("2026-06-06T03:00:00.000Z")
    });
    await credentialStore.write({
      clientId: "fixture-client-id",
      clientSecret: SENTINEL_CLIENT_SECRET
    });
    const { fetchImpl, calls } = createProductionReplayFetch();
    const connector = new TossInvestReadonlyClient({
      fetch: fetchImpl,
      credentials: createTossCredentialProviderFromStore(credentialStore),
      tokenCache: new InMemoryTossTokenCache(),
      clock: () => new Date("2026-06-06T03:00:00.000Z")
    });

    const app = await buildApiApp({
      dataDir,
      tossCredentialStore: credentialStore,
      tossReadOnlyConnector: connector,
      clock: () => new Date("2026-06-06T03:00:00.000Z")
    });

    const sync = await app.inject({
      method: "POST",
      url: "/sync/toss/read-only",
      payload: {
        symbols: ["005930"]
      }
    });
    expect(sync.statusCode).toBe(200);
    expect(sync.json()).toMatchObject({
      status: "succeeded",
      mode: "production_secret_store",
      accountCount: 1,
      holdingCount: 1,
      source: "production_snapshot"
    });

    const health = await app.inject({ method: "GET", url: "/health" });
    const tossCheck = health.json().checks.find((check: { name: string }) => check.name === "toss_read_only");
    expect(tossCheck).toMatchObject({
      status: "readonly_available",
      metadata: {
        mode: "production_secret_store",
        snapshotFreshness: {
          mode: "production_secret_store",
          status: "fresh",
          source: "production_snapshot",
          lastSuccessfulSyncAt: "2026-06-06T03:00:00.000Z"
        }
      }
    });

    const chat = await app.inject({
      method: "POST",
      url: "/chat",
      payload: {
        message: "내 005930 보유 사실을 계좌 기준으로 알려줘",
        permissionMode: "manual",
        context: {
          selectedSymbol: "005930"
        }
      }
    });
    expect(chat.statusCode).toBe(200);
    expect(chat.body).toContain("production_snapshot");
    expect(chat.body).toContain("005930");
    expect(chat.body).toContain("10");

    const disconnect = await app.inject({
      method: "DELETE",
      url: "/settings/brokers/toss/credentials"
    });
    expect(disconnect.statusCode).toBe(200);

    const afterDisconnectChat = await app.inject({
      method: "POST",
      url: "/chat",
      payload: {
        message: "내 005930 보유 사실을 계좌 기준으로 알려줘",
        permissionMode: "manual",
        context: {
          selectedSymbol: "005930"
        }
      }
    });
    expect(afterDisconnectChat.statusCode).toBe(200);
    expect(afterDisconnectChat.body).toContain("source/freshness가 없어서 모릅니다");
    expect(afterDisconnectChat.body).not.toContain("005930 보유 수량은 10");

    expect(calls.find((call) => call.path === "/api/v1/holdings")?.account).toBe(RAW_ACCOUNT_SEQ_SENTINEL);
    const serializedApiResponses = `${sync.body}\n${health.body}\n${chat.body}\n${disconnect.body}\n${afterDisconnectChat.body}`;
    const diskText = readDiskText(dataDir);
    for (const forbidden of [SENTINEL_CLIENT_SECRET, SENTINEL_ACCESS_TOKEN, RAW_ACCOUNT_SEQ_SENTINEL, "fixture-account-ref-1234"]) {
      expect(serializedApiResponses).not.toContain(forbidden);
      expect(diskText).not.toContain(forbidden);
    }

    await app.close();
  });

  it("stores local investment memory and lets Commander use only fresh sourced memory", async () => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), "gaemiguard-api-"));
    tempDirs.push(dataDir);

    const app = await buildApiApp({
      dataDir,
      clock: () => new Date("2026-06-06T04:05:00.000Z")
    });

    const thesis = await app.inject({
      method: "PUT",
      url: "/memory/theses",
      payload: {
        symbol: "005930",
        title: "Samsung cycle recovery",
        body: "This thesis mentions fixture-private-value-alpha and raw account 987654321, which must be redacted.",
        source: {
          kind: "manual_note",
          label: "Local thesis note",
          capturedAt: "2026-06-06T04:00:00.000Z",
          freshness: {
            status: "fresh",
            source: "manual_input",
            message: "User-authored thesis is current."
          }
        }
      }
    });
    expect(thesis.statusCode).toBe(200);

    const rule = await app.inject({
      method: "PUT",
      url: "/memory/rules",
      payload: {
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
      }
    });
    expect(rule.statusCode).toBe(200);

    const staleJournal = await app.inject({
      method: "POST",
      url: "/memory/journal",
      payload: {
        symbol: "005930",
        body: "This stale broker note must not appear in Commander answers.",
        source: {
          kind: "broker_snapshot",
          label: "Old Toss production snapshot",
          capturedAt: "2026-06-01T04:02:00.000Z",
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
    });
    expect(staleJournal.statusCode).toBe(200);

    const recall = await app.inject({ method: "GET", url: "/memory/recall?symbol=005930" });
    expect(recall.statusCode).toBe(200);
    expect(recall.json().items.map((item: { kind: string }) => item.kind)).toEqual(["thesis", "rule"]);
    expect(recall.body).not.toContain("fixture-private-value-alpha");
    expect(recall.body).not.toContain("987654321");

    const chat = await app.inject({
      method: "POST",
      url: "/chat",
      payload: {
        message: "내 005930 투자 논리와 원칙을 기억 기반으로 봐줘",
        permissionMode: "manual",
        context: {
          selectedSymbol: "005930"
        }
      }
    });
    expect(chat.statusCode).toBe(200);
    expect(chat.body).toContain("Stage 3 memory context");
    expect(chat.body).toContain("Samsung cycle recovery");
    expect(chat.body).toContain("No stale account facts");
    expect(chat.body).not.toContain("This stale broker note");

    const serializedApiResponses = `${thesis.body}\n${rule.body}\n${staleJournal.body}\n${recall.body}\n${chat.body}`;
    const diskText = readDiskText(dataDir);
    for (const forbidden of [
      "fixture-private-value-alpha",
      "fixture-private-value-beta",
      "fixture-account-ref-9012",
      "fixture-order-id-should-never-appear",
      "987654321"
    ]) {
      expect(serializedApiResponses).not.toContain(forbidden);
      expect(diskText).not.toContain(forbidden);
    }

    await app.close();
  });
});
