import type {
  TossConnectorResult,
  TossExchangeRate,
  TossMarketCalendar,
  TossReadonlyConnector,
  TossReadonlySnapshotRepository,
  TossReadonlySnapshotWrite,
  TossReadonlyStoredRateLimitMetadata,
  TossStage2ReadonlyDataOperationId
} from "@gaemiguard/shared";

export type TossMockReadonlySyncOptions = {
  connector: TossReadonlyConnector;
  repository: TossReadonlySnapshotRepository;
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

export async function syncMockTossReadonlySnapshots(options: TossMockReadonlySyncOptions): Promise<TossReadonlySnapshotWrite> {
  const clock = options.clock ?? (() => new Date());
  const idFactory = options.idFactory ?? defaultIdFactory;
  const startedAt = clock().toISOString();
  const status = await options.connector.getStatus();

  if (status.status !== "ok" || status.metadata.mode !== "mock_replay") {
    throw new Error("Toss read-only mock snapshot sync requires an ok mock_replay connector.");
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
      mode: "mock_replay",
      status: "succeeded",
      startedAt,
      finishedAt,
      message: "Mock replay Toss read-only snapshot sync completed without storing raw secrets, tokens, or account numbers.",
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
