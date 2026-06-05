import { describe, expect, it } from "vitest";
import {
  InMemoryTossTokenCache,
  TossReadonlyConnectorError,
  TOSS_FORBIDDEN_MUTATION_ENDPOINTS,
  TOSS_STAGE2_READONLY_DATA_ENDPOINTS,
  TossInvestReadonlyClient,
  assertTossStage2OperationAvailable,
  createStaticTossCredentialProvider
} from "./toss-readonly-connector";

const SENTINEL_CLIENT_SECRET = "fixture-private-value-alpha";
const SENTINEL_ACCESS_TOKEN = "fixture-private-value-beta";

const replay = {
  token200: {
    access_token: SENTINEL_ACCESS_TOKEN,
    token_type: "Bearer",
    expires_in: 1800
  },
  accounts200: {
    result: [
      {
        accountNo: "fixture-account-ref-9012",
        accountSeq: 321,
        accountType: "BROKERAGE"
      }
    ]
  },
  holdings200: {
    result: {
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
          name: "삼성전자",
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
    }
  },
  prices200: {
    result: [
      {
        symbol: "005930",
        timestamp: "2026-06-05T01:00:00Z",
        lastPrice: "70000",
        currency: "KRW"
      }
    ]
  },
  orderbook200: {
    result: {
      timestamp: "2026-06-05T01:00:00Z",
      currency: "KRW",
      asks: [{ price: "70100", volume: "100" }],
      bids: [{ price: "70000", volume: "120" }]
    }
  },
  exchangeRate200: {
    result: {
      baseCurrency: "USD",
      quoteCurrency: "KRW",
      rate: "1380.10",
      midRate: "1379.80",
      basisPoint: "0.30",
      rateChangeType: "UP",
      validFrom: "2026-06-05T00:00:00Z",
      validUntil: "2026-06-05T01:00:00Z"
    }
  },
  krCalendar200: {
    result: {
      today: { date: "2026-06-05", integrated: null },
      previousBusinessDay: { date: "2026-06-04", integrated: null },
      nextBusinessDay: { date: "2026-06-08", integrated: null }
    }
  },
  usCalendar200: {
    result: {
      today: { date: "2026-06-05", dayMarket: null, preMarket: null, regularMarket: null, afterMarket: null },
      previousBusinessDay: {
        date: "2026-06-04",
        dayMarket: null,
        preMarket: null,
        regularMarket: null,
        afterMarket: null
      },
      nextBusinessDay: { date: "2026-06-08", dayMarket: null, preMarket: null, regularMarket: null, afterMarket: null }
    }
  },
  stockWarningsUnknownEnum200: {
    result: [
      {
        warningType: "NEW_WARNING_KIND",
        exchange: "KRX",
        startDate: "2026-06-01",
        endDate: null
      }
    ]
  },
  api401: {
    error: {
      requestId: "req_401",
      code: "unauthorized",
      message: "Bearer token is invalid."
    }
  },
  api403: {
    error: {
      requestId: "req_403",
      code: "forbidden",
      message: "Scope is not allowed."
    }
  },
  api429: {
    error: {
      requestId: "req_429",
      code: "rate-limit",
      message: "Too many requests."
    }
  }
};

type ReplayRoute = {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
};

function createReplayFetch(routes: Record<string, ReplayRoute>) {
  const calls: { method: string; path: string; search: string; authorization?: string; account?: string; body?: string }[] = [];

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const key = `${method} ${url.pathname}`;
    const route = routes[key];
    const authorization = headers.get("Authorization") ?? undefined;
    const account = headers.get("X-Tossinvest-Account") ?? undefined;
    const body = typeof init?.body === "string" ? init.body : undefined;
    calls.push({
      method,
      path: url.pathname,
      search: url.search,
      ...(authorization !== undefined ? { authorization } : {}),
      ...(account !== undefined ? { account } : {}),
      ...(body !== undefined ? { body } : {})
    });

    if (!route) {
      return new Response(JSON.stringify({ error: { requestId: "missing", code: "missing-fixture", message: key } }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(route.body), {
      status: route.status,
      headers: { "Content-Type": "application/json", ...route.headers }
    });
  };

  return { fetchImpl, calls };
}

function createClient(fetchImpl: typeof fetch) {
  return new TossInvestReadonlyClient({
    fetch: fetchImpl,
    credentials: createStaticTossCredentialProvider({
      clientId: "mock_client_id",
      clientSecret: SENTINEL_CLIENT_SECRET,
      boundary: "mock_replay"
    }),
    tokenCache: new InMemoryTossTokenCache(),
    clock: () => new Date("2026-06-05T01:00:00.000Z")
  });
}

describe("Toss read-only OpenAPI policy", () => {
  it("includes only the Stage 2 first-slice official read-only data operations", () => {
    expect(TOSS_STAGE2_READONLY_DATA_ENDPOINTS.map((endpoint) => endpoint.operationId)).toEqual([
      "getAccounts",
      "getHoldings",
      "getPrices",
      "getOrderbook",
      "getExchangeRate",
      "getKrMarketCalendar",
      "getUsMarketCalendar",
      "getStockWarnings"
    ]);

    expect(TOSS_FORBIDDEN_MUTATION_ENDPOINTS.map((endpoint) => endpoint.operationId)).toEqual([
      "createOrder",
      "modifyOrder",
      "cancelOrder"
    ]);

    for (const endpoint of TOSS_STAGE2_READONLY_DATA_ENDPOINTS) {
      expect(() => assertTossStage2OperationAvailable(endpoint.operationId)).not.toThrow();
    }

    for (const endpoint of TOSS_FORBIDDEN_MUTATION_ENDPOINTS) {
      expect(() => assertTossStage2OperationAvailable(endpoint.operationId)).toThrow(/mutation/i);
    }

    expect(() => assertTossStage2OperationAvailable("getOrders")).toThrow(/not included/i);
    expect(() => assertTossStage2OperationAvailable("getBuyingPower")).toThrow(/not included/i);
  });
});

describe("TossInvestReadonlyClient", () => {
  it("replays 200 responses, masks account numbers, and preserves unknown enum values", async () => {
    const { fetchImpl, calls } = createReplayFetch({
      "POST /oauth2/token": { status: 200, body: replay.token200 },
      "GET /api/v1/accounts": { status: 200, body: replay.accounts200 },
      "GET /api/v1/holdings": { status: 200, body: replay.holdings200 },
      "GET /api/v1/prices": { status: 200, body: replay.prices200 },
      "GET /api/v1/orderbook": { status: 200, body: replay.orderbook200 },
      "GET /api/v1/exchange-rate": { status: 200, body: replay.exchangeRate200 },
      "GET /api/v1/market-calendar/KR": { status: 200, body: replay.krCalendar200 },
      "GET /api/v1/market-calendar/US": { status: 200, body: replay.usCalendar200 },
      "GET /api/v1/stocks/005930/warnings": { status: 200, body: replay.stockWarningsUnknownEnum200 }
    });
    const client = createClient(fetchImpl);

    const accounts = await client.listAccounts();
    const holdings = await client.getHoldings({ accountSeq: 321 });
    const prices = await client.getCurrentPrices({ symbols: ["005930"] });
    const orderbook = await client.getOrderbookSummary({ symbol: "005930" });
    const exchangeRate = await client.getExchangeRate({ baseCurrency: "USD", quoteCurrency: "KRW" });
    const krCalendar = await client.getMarketCalendar({ market: "KR", date: "2026-06-05" });
    const usCalendar = await client.getMarketCalendar({ market: "US", date: "2026-06-05" });
    const warnings = await client.getStockWarnings({ symbol: "005930" });

    expect(accounts.data[0]?.accountSeq).toBe(321);
    expect(accounts.data[0]?.maskedAccountNo).toMatch(/^\*+9012$/);
    expect(accounts.data[0]?.accountType).toEqual({ value: "BROKERAGE", known: true });
    expect(JSON.stringify(accounts.data)).not.toContain("fixture-account-ref-9012");
    expect(holdings.data.items[0]?.quantity).toBe("10");
    expect(prices.data[0]?.currency).toEqual({ value: "KRW", known: true });
    expect(orderbook.data.bestAsk?.price).toBe("70100");
    expect(orderbook.data.bestBid?.price).toBe("70000");
    expect(exchangeRate.data.rateChangeType).toEqual({ value: "UP", known: true });
    expect(krCalendar.data.market).toBe("KR");
    expect(usCalendar.data.market).toBe("US");
    expect(warnings.data[0]?.warningType).toEqual({ value: "NEW_WARNING_KIND", known: false });

    expect(calls.filter((call) => call.path === "/oauth2/token")).toHaveLength(1);
    expect(calls.find((call) => call.path === "/api/v1/holdings")?.account).toBe("321");
    expect(calls.find((call) => call.path === "/api/v1/prices")?.search).toBe("?symbols=005930");
    expect(calls.find((call) => call.path === "/api/v1/accounts")?.authorization).toBe(`Bearer ${SENTINEL_ACCESS_TOKEN}`);
  });

  it.each([
    [401, replay.api401, undefined, "unauthorized"],
    [403, replay.api403, undefined, "forbidden"],
    [429, replay.api429, "3", "rate-limit"]
  ])("normalizes %s official API errors without leaking the bearer token", async (status, body, retryAfter, code) => {
    const { fetchImpl } = createReplayFetch({
      "POST /oauth2/token": { status: 200, body: replay.token200 },
      "GET /api/v1/prices": {
        status,
        body,
        ...(retryAfter ? { headers: { "Retry-After": retryAfter } } : {})
      }
    });
    const client = createClient(fetchImpl);

    await expect(client.getCurrentPrices({ symbols: ["005930"] })).rejects.toMatchObject({
      status,
      code,
      retryAfter
    });

    try {
      await client.getCurrentPrices({ symbols: ["005930"] });
    } catch (error) {
      expect(error).toBeInstanceOf(TossReadonlyConnectorError);
      expect(String(error)).not.toContain(SENTINEL_ACCESS_TOKEN);
    }
  });
});
