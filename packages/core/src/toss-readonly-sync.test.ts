import type {
  TossConnectorResult,
  TossExchangeRate,
  TossMarketCalendar,
  TossOrderbookSummary,
  TossQuote,
  TossReadonlyConnector,
  TossReadonlyConnectorStatus,
  TossReadonlySnapshotRepository,
  TossReadonlySnapshotWrite,
  TossReadonlyStoredSyncLog,
  TossReadonlySyncFailureMetadata,
  TossReadonlyToolContract,
  TossStockWarning
} from "@gaemiguard/shared";
import { describe, expect, it } from "vitest";
import { TossReadonlyConnectorError } from "./toss-readonly-connector";
import { runTossReadonlySyncJob } from "./toss-readonly-sync";

const RAW_ACCOUNT_SEQ_SENTINEL = 987654321;
const SENTINEL_ACCESS_TOKEN = "fixture-private-value-beta";
const SENTINEL_CLIENT_SECRET = "fixture-private-value-alpha";

function status(mode: "production_secret_store" | "mock_replay" = "production_secret_store"): TossReadonlyConnectorStatus {
  return {
    name: "toss_read_only",
    status: "ok",
    message: "Toss read-only connector is configured.",
    metadata: {
      mode,
      openApiVersion: "1.0.3",
      includedOperations: [
        "getAccounts",
        "getHoldings",
        "getPrices",
        "getOrderbook",
        "getExchangeRate",
        "getKrMarketCalendar",
        "getUsMarketCalendar",
        "getStockWarnings"
      ],
      forbiddenOperations: ["createOrder", "modifyOrder", "cancelOrder"],
      tools: [
        "toss.listAccounts",
        "toss.getHoldings",
        "toss.getCurrentPrices",
        "toss.getOrderbookSummary",
        "toss.getExchangeRate",
        "toss.getMarketCalendar",
        "toss.getStockWarnings"
      ]
    }
  };
}

function toolContract(): TossReadonlyToolContract {
  return {
    mode: "read_only",
    tools: status().metadata.tools,
    includedOperations: status().metadata.includedOperations,
    forbiddenOperations: status().metadata.forbiddenOperations
  };
}

const rateLimit = { limit: "10", remaining: "8", reset: "1" };

function result<T>(data: T): TossConnectorResult<T> {
  return {
    data,
    rateLimit
  };
}

function createProductionConnector(): TossReadonlyConnector {
  return {
    async getStatus() {
      return status();
    },
    getToolContract: toolContract,
    async listAccounts() {
      return result([
        {
          accountSeq: RAW_ACCOUNT_SEQ_SENTINEL,
          maskedAccountNo: "********1234",
          accountType: { value: "BROKERAGE", known: true }
        }
      ]);
    },
    async getHoldings() {
      return result({
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
      });
    },
    async getCurrentPrices(): Promise<TossConnectorResult<TossQuote[]>> {
      return result([
        {
          symbol: "005930",
          timestamp: "2026-06-06T03:00:00Z",
          lastPrice: "70000",
          currency: { value: "KRW", known: true }
        }
      ]);
    },
    async getOrderbookSummary(): Promise<TossConnectorResult<TossOrderbookSummary>> {
      return result({
        symbol: "005930",
        timestamp: "2026-06-06T03:00:00Z",
        currency: { value: "KRW", known: true },
        bestAsk: { price: "70100", volume: "100" },
        bestBid: { price: "70000", volume: "120" },
        asks: [{ price: "70100", volume: "100" }],
        bids: [{ price: "70000", volume: "120" }]
      });
    },
    async getExchangeRate(): Promise<TossConnectorResult<TossExchangeRate>> {
      return result({
        baseCurrency: { value: "USD", known: true },
        quoteCurrency: { value: "KRW", known: true },
        rate: "1380.10",
        midRate: "1379.80",
        basisPoint: "0.30",
        rateChangeType: { value: "UP", known: true },
        validFrom: "2026-06-06T03:00:00Z",
        validUntil: "2026-06-06T04:00:00Z"
      });
    },
    async getMarketCalendar(request): Promise<TossConnectorResult<TossMarketCalendar>> {
      return result({
        market: request.market,
        today: { date: "2026-06-06", sessions: { integrated: null } },
        previousBusinessDay: { date: "2026-06-05", sessions: { integrated: null } },
        nextBusinessDay: { date: "2026-06-08", sessions: { integrated: null } }
      });
    },
    async getStockWarnings(): Promise<TossConnectorResult<TossStockWarning[]>> {
      return result([]);
    }
  };
}

function createMemorySnapshotRepository(): TossReadonlySnapshotRepository {
  let latest: TossReadonlySnapshotWrite | null = null;
  let failures: TossReadonlyStoredSyncLog[] = [];

  function failureMetadata(syncLog: TossReadonlyStoredSyncLog | undefined): TossReadonlySyncFailureMetadata | undefined {
    if (!syncLog?.failureCategory) {
      return undefined;
    }
    return {
      status: "failed",
      failureCategory: syncLog.failureCategory,
      message: syncLog.message,
      ...(syncLog.safeErrorCode ? { safeErrorCode: syncLog.safeErrorCode } : {}),
      ...(syncLog.safeRequestId ? { safeRequestId: syncLog.safeRequestId } : {}),
      ...(syncLog.retryAfterSeconds !== undefined ? { retryAfterSeconds: syncLog.retryAfterSeconds } : {}),
      ...(syncLog.nextRetryAt ? { nextRetryAt: syncLog.nextRetryAt } : {})
    };
  }

  return {
    async saveSyncSnapshot(snapshot) {
      latest = snapshot;
    },
    async saveSyncFailure(syncLog) {
      failures = [syncLog, ...failures];
    },
    async getFreshnessStatus() {
      const latestFailure = failureMetadata(failures[0]);
      if (!latest) {
        return {
          mode: "production_secret_store",
          status: latestFailure ? "failed" : "never_synced",
          source: "production_snapshot",
          staleAfterSeconds: 300,
          accountCount: 0,
          holdingCount: 0,
          quoteCount: 0,
          orderbookCount: 0,
          exchangeRateCount: 0,
          marketCalendarCount: 0,
          stockWarningCount: 0,
          rateLimitScopes: [],
          ...(latestFailure ? { latestFailure } : {}),
          message: latestFailure ? latestFailure.message : "No production Toss read-only snapshot sync has completed."
        };
      }
      return {
        mode: "production_secret_store",
        status: "fresh",
        source: "production_snapshot",
        lastSuccessfulSyncAt: latest.syncLog.finishedAt,
        ageSeconds: 0,
        staleAfterSeconds: 300,
        accountCount: latest.syncLog.accountCount,
        holdingCount: latest.syncLog.holdingCount,
        quoteCount: latest.syncLog.quoteCount,
        orderbookCount: latest.syncLog.orderbookCount,
        exchangeRateCount: latest.syncLog.exchangeRateCount,
        marketCalendarCount: latest.syncLog.marketCalendarCount,
        stockWarningCount: latest.syncLog.stockWarningCount,
        rateLimitScopes: latest.rateLimits.map((item) => item.scope),
        message: "Production Toss read-only snapshots are fresh."
      };
    },
    async readLatest() {
      return {
        accounts: latest?.accounts ?? [],
        holdings: latest?.holdings ?? [],
        quotes: latest?.quotes ?? [],
        orderbooks: latest?.orderbooks ?? [],
        exchangeRates: latest?.exchangeRates ?? [],
        marketCalendars: latest?.marketCalendars ?? [],
        stockWarnings: latest?.stockWarnings ?? [],
        syncLogs: [...(latest ? [latest.syncLog] : []), ...failures],
        rateLimits: latest?.rateLimits ?? []
      };
    }
  };
}

describe("Toss read-only production sync job", () => {
  it("runs only read-only production calls and returns sanitized snapshot metadata", async () => {
    const repository = createMemorySnapshotRepository();

    const result = await runTossReadonlySyncJob({
      connector: createProductionConnector(),
      repository,
      mode: "production_secret_store",
      symbols: ["005930"],
      clock: () => new Date("2026-06-06T03:00:00.000Z"),
      idFactory: (prefix) => `${prefix}_test`
    });

    expect(result.status).toBe("succeeded");
    const snapshots = await repository.readLatest();
    expect(snapshots.accounts).toEqual([
      {
        accountRef: "********1234",
        maskedAccountNo: "********1234",
        accountType: { value: "BROKERAGE", known: true },
        lastSyncedAt: "2026-06-06T03:00:00.000Z"
      }
    ]);
    expect(snapshots.syncLogs[0]).toMatchObject({
      mode: "production_secret_store",
      status: "succeeded",
      accountCount: 1,
      holdingCount: 1
    });

    const freshness = await repository.getFreshnessStatus({ now: "2026-06-06T03:00:00.000Z" });
    expect(freshness).toMatchObject({
      mode: "production_secret_store",
      status: "fresh",
      source: "production_snapshot",
      accountCount: 1,
      holdingCount: 1
    });

    const serialized = JSON.stringify({ result, snapshots, freshness });
    for (const forbidden of [String(RAW_ACCOUNT_SEQ_SENTINEL), SENTINEL_ACCESS_TOKEN, SENTINEL_CLIENT_SECRET]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("classifies 429 failures with retry metadata without storing secret values", async () => {
    const repository = createMemorySnapshotRepository();
    const connector = createProductionConnector();
    connector.listAccounts = async () => {
      throw new TossReadonlyConnectorError({
        status: 429,
        code: "rate-limit",
        message: `Too many requests near ${SENTINEL_ACCESS_TOKEN}.`,
        retryAfter: "7"
      });
    };

    const result = await runTossReadonlySyncJob({
      connector,
      repository,
      mode: "production_secret_store",
      clock: () => new Date("2026-06-06T03:00:00.000Z"),
      idFactory: (prefix) => `${prefix}_failed`
    });

    expect(result).toMatchObject({
      status: "failed",
      failureCategory: "rate_limited",
      retryAfterSeconds: 7,
      nextRetryAt: "2026-06-06T03:00:07.000Z"
    });

    const freshness = await repository.getFreshnessStatus({ now: "2026-06-06T03:00:00.000Z" });
    expect(freshness).toMatchObject({
      mode: "production_secret_store",
      status: "failed",
      source: "production_snapshot",
      latestFailure: {
        status: "failed",
        failureCategory: "rate_limited",
        nextRetryAt: "2026-06-06T03:00:07.000Z"
      }
    });

    const serialized = JSON.stringify({ result, freshness, snapshots: await repository.readLatest() });
    for (const forbidden of [SENTINEL_ACCESS_TOKEN, SENTINEL_CLIENT_SECRET, String(RAW_ACCOUNT_SEQ_SENTINEL)]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
