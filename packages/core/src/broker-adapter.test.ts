import { describe, expect, it } from "vitest";
import {
  createInMemoryManualPortfolioRepository,
  createManualPortfolioBrokerAdapter,
  createTossBrokerAdapter,
  assertBrokerOrderMutationUnavailable
} from "./broker-adapter";
import { createMockTossReadonlyConnector, createUnavailableTossReadonlyConnector } from "./toss-readonly-connector";

describe("broker adapter foundation", () => {
  it("wraps Toss read-only as a broker adapter without enabling order mutations", async () => {
    const adapter = createTossBrokerAdapter({
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
    });

    const status = await adapter.getStatus();
    expect(status).toMatchObject({
      provider: {
        id: "toss",
        displayName: "Toss Invest"
      },
      status: "mock_replay",
      authorityLevel: "read_only",
      freshness: {
        status: "fresh",
        source: "mock_replay_snapshot",
        lastUpdatedAt: "2026-06-05T01:00:00.000Z"
      }
    });
    expect(status.capabilities.accounts.read).toBe("available");
    expect(status.capabilities.holdings.read).toBe("available");
    expect(status.capabilities.quotes.read).toBe("available");
    expect(status.capabilities.orderbook.read).toBe("available");
    expect(status.capabilities.fx.read).toBe("available");
    expect(status.capabilities.calendar.read).toBe("available");
    expect(status.capabilities.warnings.read).toBe("available");
    expect(status.capabilities.orders.create.availability).toBe("disabled");
    expect(status.capabilities.orders.modify.availability).toBe("disabled");
    expect(status.capabilities.orders.cancel.availability).toBe("disabled");

    const accounts = await adapter.readAccounts();
    expect(accounts.data).toEqual([
      {
        accountRef: "toss:********9012",
        displayLabel: "Toss ********9012",
        providerId: "toss",
        source: "mock_replay",
        accountType: "BROKERAGE"
      }
    ]);

    const serialized = JSON.stringify({ status, accounts });
    expect(serialized).not.toContain("321");
    expect(serialized).not.toContain("fixture-private-value-alpha");
    expect(serialized).not.toContain("fixture-private-value-beta");
  });

  it("reports a configured Toss contract as not_configured instead of connected when credentials are absent", async () => {
    const adapter = createTossBrokerAdapter({
      connector: createUnavailableTossReadonlyConnector()
    });

    const status = await adapter.getStatus();
    expect(status).toMatchObject({
      provider: {
        id: "toss",
        displayName: "Toss Invest"
      },
      status: "not_configured",
      authorityLevel: "metadata_only",
      freshness: {
        status: "unavailable",
        source: "not_configured"
      }
    });
    expect(status.message).not.toContain("connected");
  });

  it("provides no-broker manual portfolio reads with synthetic account references", async () => {
    const repository = createInMemoryManualPortfolioRepository({
      clock: () => new Date("2026-06-06T02:00:00.000Z")
    });
    await repository.upsertWatchlistItem({
      symbol: "005930",
      market: "KR",
      name: "Samsung Electronics",
      note: "Core watchlist item"
    });
    await repository.upsertHolding({
      symbol: "005930",
      market: "KR",
      currency: "KRW",
      name: "Samsung Electronics",
      quantity: "10",
      averageCost: "65000",
      note: "Manual local entry"
    });
    await repository.upsertCashBalance({
      currency: "KRW",
      amount: "1000000"
    });

    const adapter = createManualPortfolioBrokerAdapter({ repository });
    const status = await adapter.getStatus();
    expect(status).toMatchObject({
      provider: {
        id: "manual",
        displayName: "Manual portfolio"
      },
      status: "no_broker",
      authorityLevel: "no_broker",
      freshness: {
        status: "local_manual",
        source: "manual_input",
        lastUpdatedAt: "2026-06-06T02:00:00.000Z"
      }
    });
    expect(status.capabilities.orders.create.availability).toBe("disabled");

    const accounts = await adapter.readAccounts();
    const holdings = await adapter.readHoldings({ accountRef: "manual:default" });
    const cash = await adapter.readCash({ accountRef: "manual:default" });
    const warnings = await adapter.readWarnings({ symbols: ["005930"] });

    expect(accounts.data[0]?.accountRef).toBe("manual:default");
    expect(holdings.data.items[0]).toMatchObject({
      accountRef: "manual:default",
      symbol: "005930",
      source: "manual_input"
    });
    expect(cash.data.balances).toEqual([
      {
        accountRef: "manual:default",
        currency: "KRW",
        amount: "1000000",
        source: "manual_input",
        updatedAt: "2026-06-06T02:00:00.000Z"
      }
    ]);
    expect(warnings.data).toEqual([]);

    const serialized = JSON.stringify({ status, accounts, holdings, cash });
    expect(serialized).not.toContain("fixture-order-id-should-never-appear");
  });

  it("hard-blocks common broker order mutation operations at the contract boundary", () => {
    for (const operation of ["createOrder", "modifyOrder", "cancelOrder"] as const) {
      expect(() => assertBrokerOrderMutationUnavailable(operation)).toThrow(/unavailable in Stage 2/i);
    }
  });
});
