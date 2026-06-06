import type {
  TossConnectorResult,
  TossConnectorMode,
  TossExchangeRate,
  TossMarketCalendar,
  TossReadonlyConnector,
  TossReadonlySnapshotRepository,
  TossReadonlySnapshotWrite,
  TossReadonlyStoredRateLimitMetadata,
  TossReadonlyStoredSyncLog,
  TossReadonlySyncFailureCategory,
  TossReadonlySyncMode,
  TossStage2ReadonlyDataOperationId
} from "@gaemiguard/shared";
import { TossReadonlyConnectorError } from "./toss-readonly-connector";

export type TossReadonlySyncOptions = {
  connector: TossReadonlyConnector;
  repository: TossReadonlySnapshotRepository;
  mode: TossReadonlySyncMode;
  symbols?: string[];
  exchangeRates?: Array<{
    baseCurrency: "KRW" | "USD";
    quoteCurrency: "KRW" | "USD";
  }>;
  markets?: Array<"KR" | "US">;
  stockWarningSymbols?: string[];
  clock?: () => Date;
  idFactory?: (prefix: string) => string;
};

export type TossMockReadonlySyncOptions = Omit<TossReadonlySyncOptions, "mode">;

export type TossReadonlySyncJobResult =
  | {
      status: "succeeded";
      mode: TossReadonlySyncMode;
      source: "mock_replay_snapshot" | "production_snapshot";
      syncLog: TossReadonlyStoredSyncLog;
      accountCount: number;
      holdingCount: number;
      quoteCount: number;
      orderbookCount: number;
      exchangeRateCount: number;
      marketCalendarCount: number;
      stockWarningCount: number;
    }
  | {
      status: "failed";
      mode: TossReadonlySyncMode;
      source: "mock_replay_snapshot" | "production_snapshot";
      syncLog: TossReadonlyStoredSyncLog;
      failureCategory: TossReadonlySyncFailureCategory;
      safeErrorCode?: string;
      safeRequestId?: string;
      retryAfterSeconds?: number;
      nextRetryAt?: string;
    };

function defaultIdFactory(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function rateLimit(
  scope: TossStage2ReadonlyDataOperationId,
  result: TossConnectorResult<unknown>,
  capturedAt: string
): TossReadonlyStoredRateLimitMetadata {
  return {
    scope,
    capturedAt,
    metadata: result.rateLimit
  };
}

function withSyncedAt<T>(value: T, syncedAt: string): T & { syncedAt: string } {
  return {
    ...value,
    syncedAt
  };
}

function sourceFromMode(mode: TossConnectorMode): "mock_replay_snapshot" | "production_snapshot" {
  return mode === "mock_replay" ? "mock_replay_snapshot" : "production_snapshot";
}

function modeLabel(mode: TossReadonlySyncMode): string {
  return mode === "mock_replay" ? "Mock replay" : "Production";
}

export async function syncTossReadonlySnapshots(options: TossReadonlySyncOptions): Promise<TossReadonlySnapshotWrite> {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? defaultIdFactory;
  const startedAt = clock().toISOString();
  const status = await options.connector.getStatus();

  if (status.status !== "ok" || status.metadata.mode !== options.mode) {
    throw new Error(`Toss read-only snapshot sync requires an ok ${options.mode} connector.`);
  }

  const symbols = options.symbols ?? ["005930"];
  const exchangeRates = options.exchangeRates ?? [{ baseCurrency: "USD", quoteCurrency: "KRW" }];
  const markets = options.markets ?? ["KR", "US"];
  const stockWarningSymbols = options.stockWarningSymbols ?? symbols;

  const accountsResult = await options.connector.listAccounts();
  const rateLimits: TossReadonlyStoredRateLimitMetadata[] = [rateLimit("getAccounts", accountsResult, startedAt)];

  const accounts = accountsResult.data.map((account) => ({
    accountRef: account.maskedAccountNo,
    maskedAccountNo: account.maskedAccountNo,
    accountType: account.accountType,
    lastSyncedAt: startedAt
  }));

  const holdings = [];
  for (const account of accountsResult.data) {
    const holdingsResult = await options.connector.getHoldings({ accountSeq: account.accountSeq });
    rateLimits.push(rateLimit("getHoldings", holdingsResult, startedAt));
    holdings.push({
      snapshotId: idFactory("toss_holdings_snapshot"),
      accountRef: account.maskedAccountNo,
      syncedAt: startedAt,
      overview: holdingsResult.data
    });
  }

  const pricesResult = await options.connector.getCurrentPrices({ symbols });
  rateLimits.push(rateLimit("getPrices", pricesResult, startedAt));
  const quotes = pricesResult.data.map((quote) => withSyncedAt(quote, startedAt));

  const orderbooks = [];
  for (const symbol of symbols) {
    const orderbookResult = await options.connector.getOrderbookSummary({ symbol });
    rateLimits.push(rateLimit("getOrderbook", orderbookResult, startedAt));
    orderbooks.push(withSyncedAt(orderbookResult.data, startedAt));
  }

  const exchangeRateSnapshots: Array<TossExchangeRate & { syncedAt: string }> = [];
  for (const request of exchangeRates) {
    const exchangeRateResult = await options.connector.getExchangeRate(request);
    rateLimits.push(rateLimit("getExchangeRate", exchangeRateResult, startedAt));
    exchangeRateSnapshots.push(withSyncedAt(exchangeRateResult.data, startedAt));
  }

  const marketCalendars: Array<TossMarketCalendar & { syncedAt: string }> = [];
  for (const market of markets) {
    const calendarResult = await options.connector.getMarketCalendar({ market });
    rateLimits.push(rateLimit(market === "KR" ? "getKrMarketCalendar" : "getUsMarketCalendar", calendarResult, startedAt));
    marketCalendars.push(withSyncedAt(calendarResult.data, startedAt));
  }

  const stockWarnings = [];
  for (const symbol of stockWarningSymbols) {
    const warningResult = await options.connector.getStockWarnings({ symbol });
    rateLimits.push(rateLimit("getStockWarnings", warningResult, startedAt));
    stockWarnings.push({
      snapshotId: idFactory("toss_stock_warning_snapshot"),
      symbol,
      syncedAt: startedAt,
      warnings: warningResult.data
    });
  }

  const finishedAt = clock().toISOString();
  const snapshot: TossReadonlySnapshotWrite = {
    syncLog: {
      id: idFactory("toss_sync"),
      mode: options.mode,
      status: "succeeded",
      startedAt,
      finishedAt,
      message: `${modeLabel(options.mode)} Toss read-only snapshot sync completed without storing raw secrets, tokens, or account numbers.`,
      accountCount: accounts.length,
      holdingCount: holdings.length,
      quoteCount: quotes.length,
      orderbookCount: orderbooks.length,
      exchangeRateCount: exchangeRateSnapshots.length,
      marketCalendarCount: marketCalendars.length,
      stockWarningCount: stockWarnings.length
    },
    accounts,
    holdings,
    quotes,
    orderbooks,
    exchangeRates: exchangeRateSnapshots,
    marketCalendars,
    stockWarnings,
    rateLimits
  };

  await options.repository.saveSyncSnapshot(snapshot);
  return snapshot;
}

export async function syncMockTossReadonlySnapshots(options: TossMockReadonlySyncOptions): Promise<TossReadonlySnapshotWrite> {
  return syncTossReadonlySnapshots({
    ...options,
    mode: "mock_replay"
  });
}

function parseRetryAfterSeconds(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return Math.floor(parsed);
}

function sanitizeCode(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return /^[a-zA-Z0-9_.-]{1,80}$/.test(value) ? value : "unknown";
}

function classifyFailure(error: unknown): {
  failureCategory: TossReadonlySyncFailureCategory;
  safeErrorCode?: string;
  safeRequestId?: string;
  retryAfterSeconds?: number;
} {
  if (error instanceof TossReadonlyConnectorError) {
    const safeErrorCode = sanitizeCode(error.code);
    const safeRequestId = sanitizeCode(error.requestId);
    const retryAfterSeconds = parseRetryAfterSeconds(error.retryAfter);
    const base = {
      ...(safeErrorCode ? { safeErrorCode } : {}),
      ...(safeRequestId ? { safeRequestId } : {}),
      ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {})
    };

    if (error.code === "not_configured") {
      return { failureCategory: "not_configured", ...base };
    }
    if (error.code === "order_mutation_forbidden" || error.code === "operation_not_included") {
      return { failureCategory: "policy_blocked", ...base };
    }
    if (error.status === 401) {
      return { failureCategory: "authentication", ...base };
    }
    if (error.status === 403) {
      return { failureCategory: "authorization", ...base };
    }
    if (error.status === 429) {
      return { failureCategory: "rate_limited", ...base };
    }
    if (error.status >= 500) {
      return { failureCategory: "upstream", ...base };
    }
    return { failureCategory: "unknown", ...base };
  }

  if (error instanceof TypeError) {
    return { failureCategory: "network" };
  }

  return { failureCategory: "unknown" };
}

function defaultRetryAfterSeconds(category: TossReadonlySyncFailureCategory): number | undefined {
  if (category === "not_configured" || category === "authentication" || category === "authorization") {
    return undefined;
  }
  if (category === "rate_limited") {
    return 10;
  }
  return 60;
}

export async function runTossReadonlySyncJob(options: TossReadonlySyncOptions): Promise<TossReadonlySyncJobResult> {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? defaultIdFactory;
  const startedAt = clock().toISOString();

  try {
    const snapshot = await syncTossReadonlySnapshots(options);
    return {
      status: "succeeded",
      mode: options.mode,
      source: sourceFromMode(options.mode),
      syncLog: snapshot.syncLog,
      accountCount: snapshot.syncLog.accountCount,
      holdingCount: snapshot.syncLog.holdingCount,
      quoteCount: snapshot.syncLog.quoteCount,
      orderbookCount: snapshot.syncLog.orderbookCount,
      exchangeRateCount: snapshot.syncLog.exchangeRateCount,
      marketCalendarCount: snapshot.syncLog.marketCalendarCount,
      stockWarningCount: snapshot.syncLog.stockWarningCount
    };
  } catch (error) {
    const finishedAt = clock().toISOString();
    const classified = classifyFailure(error);
    const retryAfterSeconds =
      classified.retryAfterSeconds ?? defaultRetryAfterSeconds(classified.failureCategory);
    const nextRetryAt =
      retryAfterSeconds !== undefined
        ? new Date(clock().getTime() + retryAfterSeconds * 1000).toISOString()
        : undefined;
    const syncLog: TossReadonlyStoredSyncLog = {
      id: idFactory("toss_sync"),
      mode: options.mode,
      status: "failed",
      startedAt,
      finishedAt,
      message: `Toss read-only sync failed with category ${classified.failureCategory}.`,
      failureCategory: classified.failureCategory,
      ...(classified.safeErrorCode ? { safeErrorCode: classified.safeErrorCode } : {}),
      ...(classified.safeRequestId ? { safeRequestId: classified.safeRequestId } : {}),
      ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
      ...(nextRetryAt ? { nextRetryAt } : {}),
      accountCount: 0,
      holdingCount: 0,
      quoteCount: 0,
      orderbookCount: 0,
      exchangeRateCount: 0,
      marketCalendarCount: 0,
      stockWarningCount: 0
    };
    await options.repository.saveSyncFailure(syncLog);
    return {
      status: "failed",
      mode: options.mode,
      source: sourceFromMode(options.mode),
      syncLog,
      failureCategory: classified.failureCategory,
      ...(classified.safeErrorCode ? { safeErrorCode: classified.safeErrorCode } : {}),
      ...(classified.safeRequestId ? { safeRequestId: classified.safeRequestId } : {}),
      ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
      ...(nextRetryAt ? { nextRetryAt } : {})
    };
  }
}
