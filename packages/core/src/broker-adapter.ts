import type {
  BrokerAccount,
  BrokerAdapter,
  BrokerAdapterStatus,
  BrokerCapabilities,
  BrokerCashSnapshot,
  BrokerDataSource,
  BrokerFreshness,
  BrokerFxRate,
  BrokerHolding,
  BrokerHoldingsSnapshot,
  BrokerMarketCalendar,
  BrokerOperationResult,
  BrokerOrderbookSummary,
  BrokerProviderDescriptor,
  BrokerQuote,
  BrokerWarning,
  ManualPortfolioCashBalance,
  ManualPortfolioCashBalanceInput,
  ManualPortfolioHolding,
  ManualPortfolioHoldingInput,
  ManualPortfolioRepository,
  ManualPortfolioSnapshot,
  ManualPortfolioWatchlistInput,
  ManualPortfolioWatchlistItem,
  TossAccount,
  TossConnectorMode,
  TossCurrency,
  TossExchangeRate,
  TossMarketCalendar,
  TossOrderbookSummary,
  TossQuote,
  TossRateLimitSnapshot,
  TossReadonlyConnector,
  TossReadonlySnapshotFreshness,
  TossReadonlySnapshotRepository,
  TossStockWarning
} from "@gaemiguard/shared";

export type BrokerOrderMutationOperation = "createOrder" | "modifyOrder" | "cancelOrder";

export const MANUAL_PORTFOLIO_ACCOUNT: BrokerAccount = {
  accountRef: "manual:default",
  displayLabel: "Manual portfolio",
  providerId: "manual",
  source: "manual_input",
  accountType: "MANUAL"
};

const MANUAL_PROVIDER: BrokerProviderDescriptor = {
  id: "manual",
  displayName: "Manual portfolio"
};

const TOSS_PROVIDER: BrokerProviderDescriptor = {
  id: "toss",
  displayName: "Toss Invest"
};

const ORDER_MUTATION_DISABLED_REASON =
  "Order create, modify, and cancel operations are unavailable in Stage 2 Broker Connection Foundation.";

function disabledOrderCapability() {
  return {
    availability: "disabled" as const,
    reason: ORDER_MUTATION_DISABLED_REASON,
    stage: "stage_2_broker_connection_foundation" as const
  };
}

function capabilities(input: {
  accounts: boolean;
  holdings: boolean;
  cash: boolean;
  quotes: boolean;
  orderbook: boolean;
  fx: boolean;
  calendar: boolean;
  warnings: boolean;
}): BrokerCapabilities {
  const read = (available: boolean) => (available ? "available" : "unavailable");
  return {
    accounts: { read: read(input.accounts) },
    holdings: { read: read(input.holdings) },
    cash: { read: read(input.cash) },
    quotes: { read: read(input.quotes) },
    orderbook: { read: read(input.orderbook) },
    fx: { read: read(input.fx) },
    calendar: { read: read(input.calendar) },
    warnings: { read: read(input.warnings) },
    orders: {
      create: disabledOrderCapability(),
      modify: disabledOrderCapability(),
      cancel: disabledOrderCapability()
    }
  };
}

const MANUAL_CAPABILITIES = capabilities({
  accounts: true,
  holdings: true,
  cash: true,
  quotes: false,
  orderbook: false,
  fx: false,
  calendar: false,
  warnings: true
});

function tossCapabilities(readAvailable: boolean): BrokerCapabilities {
  return capabilities({
    accounts: readAvailable,
    holdings: readAvailable,
    cash: false,
    quotes: readAvailable,
    orderbook: readAvailable,
    fx: readAvailable,
    calendar: readAvailable,
    warnings: readAvailable
  });
}

function nowIso(clock?: () => Date): string {
  return (clock ?? (() => new Date()))().toISOString();
}

function manualFreshness(lastUpdatedAt?: string): BrokerFreshness {
  return {
    status: "local_manual",
    source: "manual_input",
    message:
      "Manual portfolio mode is active. No broker account is connected, so real holdings, cash, buying power, and order status are unavailable.",
    ...(lastUpdatedAt ? { lastUpdatedAt } : {})
  };
}

function maxIso(values: string[]): string | undefined {
  return values.filter(Boolean).sort().at(-1);
}

function manualSnapshotFrom(
  watchlist: ManualPortfolioWatchlistItem[],
  holdings: ManualPortfolioHolding[],
  cashBalances: ManualPortfolioCashBalance[]
): ManualPortfolioSnapshot {
  const lastUpdatedAt = maxIso([
    ...watchlist.map((item) => item.updatedAt),
    ...holdings.map((item) => item.updatedAt),
    ...cashBalances.map((item) => item.updatedAt)
  ]);

  return {
    account: MANUAL_PORTFOLIO_ACCOUNT,
    watchlist: [...watchlist].sort((left, right) => left.symbol.localeCompare(right.symbol)),
    holdings: [...holdings].sort((left, right) => left.symbol.localeCompare(right.symbol)),
    cashBalances: [...cashBalances].sort((left, right) => left.currency.localeCompare(right.currency)),
    freshness: manualFreshness(lastUpdatedAt)
  };
}

export type InMemoryManualPortfolioRepositoryOptions = {
  clock?: () => Date;
};

export function createInMemoryManualPortfolioRepository(
  options: InMemoryManualPortfolioRepositoryOptions = {}
): ManualPortfolioRepository {
  const watchlist = new Map<string, ManualPortfolioWatchlistItem>();
  const holdings = new Map<string, ManualPortfolioHolding>();
  const cashBalances = new Map<string, ManualPortfolioCashBalance>();

  const readSnapshot = async (): Promise<ManualPortfolioSnapshot> =>
    manualSnapshotFrom([...watchlist.values()], [...holdings.values()], [...cashBalances.values()]);

  return {
    async upsertWatchlistItem(input: ManualPortfolioWatchlistInput): Promise<ManualPortfolioSnapshot> {
      const updatedAt = nowIso(options.clock);
      watchlist.set(input.symbol, {
        symbol: input.symbol,
        market: input.market,
        source: "manual_input",
        updatedAt,
        ...(input.name ? { name: input.name } : {})
      });
      return readSnapshot();
    },

    async upsertHolding(input: ManualPortfolioHoldingInput): Promise<ManualPortfolioSnapshot> {
      const updatedAt = nowIso(options.clock);
      holdings.set(input.symbol, {
        accountRef: "manual:default",
        symbol: input.symbol,
        market: input.market,
        currency: input.currency,
        quantity: input.quantity,
        source: "manual_input",
        updatedAt,
        ...(input.name ? { name: input.name } : {}),
        ...(input.averageCost ? { averageCost: input.averageCost } : {})
      });
      return readSnapshot();
    },

    async upsertCashBalance(input: ManualPortfolioCashBalanceInput): Promise<ManualPortfolioSnapshot> {
      const updatedAt = nowIso(options.clock);
      cashBalances.set(input.currency, {
        accountRef: "manual:default",
        currency: input.currency,
        amount: input.amount,
        source: "manual_input",
        updatedAt
      });
      return readSnapshot();
    },

    readSnapshot
  };
}

function manualOperationResult<T>(data: T, freshness: BrokerFreshness): BrokerOperationResult<T> {
  return {
    data,
    provider: MANUAL_PROVIDER,
    source: "manual_input",
    freshness
  };
}

export type ManualPortfolioBrokerAdapterOptions = {
  repository: ManualPortfolioRepository;
};

export function createManualPortfolioBrokerAdapter(options: ManualPortfolioBrokerAdapterOptions): BrokerAdapter {
  return {
    provider: MANUAL_PROVIDER,

    async getStatus(): Promise<BrokerAdapterStatus> {
      const snapshot = await options.repository.readSnapshot();
      return {
        provider: MANUAL_PROVIDER,
        status: "no_broker",
        authorityLevel: "no_broker",
        capabilities: MANUAL_CAPABILITIES,
        freshness: snapshot.freshness,
        message:
          "No broker account is configured. Manual portfolio, cash, and watchlist inputs are available as local-only context.",
        metadata: {
          watchlistCount: snapshot.watchlist.length,
          holdingCount: snapshot.holdings.length,
          cashBalanceCount: snapshot.cashBalances.length
        }
      };
    },

    async readAccounts(): Promise<BrokerOperationResult<BrokerAccount[]>> {
      const snapshot = await options.repository.readSnapshot();
      return manualOperationResult([snapshot.account], snapshot.freshness);
    },

    async readHoldings(request): Promise<BrokerOperationResult<BrokerHoldingsSnapshot>> {
      const snapshot = await options.repository.readSnapshot();
      const symbols = new Set(request.symbols ?? []);
      const items = snapshot.holdings.filter((item) => symbols.size === 0 || symbols.has(item.symbol));
      return manualOperationResult(
        {
          accountRef: "manual:default",
          items
        },
        snapshot.freshness
      );
    },

    async readCash(_request): Promise<BrokerOperationResult<BrokerCashSnapshot>> {
      const snapshot = await options.repository.readSnapshot();
      return manualOperationResult(
        {
          accountRef: "manual:default",
          balances: snapshot.cashBalances
        },
        snapshot.freshness
      );
    },

    async readQuotes(): Promise<BrokerOperationResult<BrokerQuote[]>> {
      const snapshot = await options.repository.readSnapshot();
      return manualOperationResult([], snapshot.freshness);
    },

    async readOrderbook(): Promise<BrokerOperationResult<BrokerOrderbookSummary | null>> {
      const snapshot = await options.repository.readSnapshot();
      return manualOperationResult(null, snapshot.freshness);
    },

    async readFxRate(): Promise<BrokerOperationResult<BrokerFxRate | null>> {
      const snapshot = await options.repository.readSnapshot();
      return manualOperationResult(null, snapshot.freshness);
    },

    async readMarketCalendar(): Promise<BrokerOperationResult<BrokerMarketCalendar | null>> {
      const snapshot = await options.repository.readSnapshot();
      return manualOperationResult(null, snapshot.freshness);
    },

    async readWarnings(): Promise<BrokerOperationResult<BrokerWarning[]>> {
      const snapshot = await options.repository.readSnapshot();
      return manualOperationResult([], snapshot.freshness);
    }
  };
}

function enumValue(value: { value: string }): string {
  return value.value;
}

function sourceFromMode(mode: TossConnectorMode): BrokerDataSource {
  return mode === "mock_replay" ? "mock_replay" : "production_snapshot";
}

function freshnessFromTossStatus(mode: TossConnectorMode, snapshot?: TossReadonlySnapshotFreshness): BrokerFreshness {
  if (snapshot) {
    return {
      status: snapshot.status,
      source: snapshot.source,
      message: snapshot.message,
      ...(snapshot.lastSuccessfulSyncAt ? { lastUpdatedAt: snapshot.lastSuccessfulSyncAt } : {}),
      ...(snapshot.ageSeconds !== undefined ? { ageSeconds: snapshot.ageSeconds } : {}),
      staleAfterSeconds: snapshot.staleAfterSeconds
    };
  }

  if (mode === "not_configured") {
    return {
      status: "unavailable",
      source: "not_configured",
      message: "Broker credentials are not configured, so no broker snapshot freshness exists."
    };
  }

  return {
    status: "never_synced",
    source: mode === "mock_replay" ? "mock_replay_snapshot" : "production_snapshot",
    message: "No broker snapshot sync has completed."
  };
}

function rateLimitSnapshot(value: TossRateLimitSnapshot): Record<string, string | undefined> {
  return {
    limit: value.limit,
    remaining: value.remaining,
    reset: value.reset,
    retryAfter: value.retryAfter
  };
}

function tossOperationResult<T>(
  data: T,
  status: BrokerAdapterStatus,
  mode: TossConnectorMode,
  rateLimit?: TossRateLimitSnapshot
): BrokerOperationResult<T> {
  return {
    data,
    provider: TOSS_PROVIDER,
    source: sourceFromMode(mode),
    freshness: status.freshness,
    ...(rateLimit ? { rateLimit: rateLimitSnapshot(rateLimit) } : {})
  };
}

function mapTossAccount(account: TossAccount, mode: TossConnectorMode): BrokerAccount {
  return {
    accountRef: `toss:${account.maskedAccountNo}`,
    displayLabel: `Toss ${account.maskedAccountNo}`,
    providerId: "toss",
    source: sourceFromMode(mode),
    accountType: enumValue(account.accountType)
  };
}

function mapTossQuote(quote: TossQuote, source: BrokerDataSource): BrokerQuote {
  return {
    symbol: quote.symbol,
    currency: enumValue(quote.currency),
    lastPrice: quote.lastPrice,
    source,
    ...(quote.timestamp !== undefined ? { timestamp: quote.timestamp } : {})
  };
}

function mapTossOrderbook(orderbook: TossOrderbookSummary, source: BrokerDataSource): BrokerOrderbookSummary {
  return {
    symbol: orderbook.symbol,
    currency: enumValue(orderbook.currency),
    source,
    ...(orderbook.bestAsk ? { bestAsk: orderbook.bestAsk } : {}),
    ...(orderbook.bestBid ? { bestBid: orderbook.bestBid } : {}),
    ...(orderbook.timestamp !== undefined ? { timestamp: orderbook.timestamp } : {})
  };
}

function mapTossCurrency(currency: TossCurrency): string {
  return enumValue(currency);
}

function mapTossFxRate(rate: TossExchangeRate, source: BrokerDataSource): BrokerFxRate {
  return {
    baseCurrency: mapTossCurrency(rate.baseCurrency),
    quoteCurrency: mapTossCurrency(rate.quoteCurrency),
    rate: rate.rate,
    validFrom: rate.validFrom,
    validUntil: rate.validUntil,
    source
  };
}

function mapTossMarketCalendar(calendar: TossMarketCalendar, source: BrokerDataSource): BrokerMarketCalendar {
  return {
    market: calendar.market,
    today: calendar.today,
    previousBusinessDay: calendar.previousBusinessDay,
    nextBusinessDay: calendar.nextBusinessDay,
    source
  };
}

function mapTossWarning(symbol: string, warning: TossStockWarning, source: BrokerDataSource): BrokerWarning {
  return {
    symbol,
    warningType: enumValue(warning.warningType),
    exchange: warning.exchange,
    source,
    ...(warning.startDate !== undefined ? { startDate: warning.startDate } : {}),
    ...(warning.endDate !== undefined ? { endDate: warning.endDate } : {})
  };
}

function accountSeqFromRef(accounts: TossAccount[], accountRef: string): number | null {
  const normalized = accountRef.replace(/^toss:/, "");
  const account = accounts.find((candidate) => candidate.maskedAccountNo === normalized);
  return account?.accountSeq ?? null;
}

export type TossBrokerAdapterOptions = {
  connector: TossReadonlyConnector;
  snapshotReader?: Pick<TossReadonlySnapshotRepository, "getFreshnessStatus">;
  clock?: () => Date;
};

export function createTossBrokerAdapter(options: TossBrokerAdapterOptions): BrokerAdapter {
  async function statusWithMode(): Promise<{ status: BrokerAdapterStatus; mode: TossConnectorMode }> {
    const connectorStatus = await options.connector.getStatus();
    const mode = connectorStatus.metadata.mode;
    const snapshot =
      options.snapshotReader && mode !== "not_configured"
        ? await options.snapshotReader.getFreshnessStatus({ now: nowIso(options.clock) })
        : undefined;
    const readAvailable = connectorStatus.status === "ok" && mode !== "not_configured";
    const adapterStatus =
      connectorStatus.status === "ok"
        ? mode === "mock_replay"
          ? "mock_replay"
          : "readonly_available"
        : "not_configured";

    return {
      mode,
      status: {
        provider: TOSS_PROVIDER,
        status: adapterStatus,
        authorityLevel: readAvailable ? "read_only" : "metadata_only",
        capabilities: tossCapabilities(readAvailable),
        freshness: freshnessFromTossStatus(mode, snapshot),
        message:
          adapterStatus === "mock_replay"
            ? "Toss Invest adapter is available through mock replay fixtures only."
            : adapterStatus === "readonly_available"
              ? "Toss Invest adapter has a read-only credential boundary; order mutation remains disabled."
              : "Toss Invest adapter is present, but credentials are not configured.",
        metadata: {
          openApiVersion: connectorStatus.metadata.openApiVersion,
          includedOperations: connectorStatus.metadata.includedOperations,
          forbiddenOperations: connectorStatus.metadata.forbiddenOperations,
          tools: connectorStatus.metadata.tools
        }
      }
    };
  }

  return {
    provider: TOSS_PROVIDER,

    async getStatus(): Promise<BrokerAdapterStatus> {
      return (await statusWithMode()).status;
    },

    async readAccounts(): Promise<BrokerOperationResult<BrokerAccount[]>> {
      const { status, mode } = await statusWithMode();
      const result = await options.connector.listAccounts();
      return tossOperationResult(
        result.data.map((account) => mapTossAccount(account, mode)),
        status,
        mode,
        result.rateLimit
      );
    },

    async readHoldings(request): Promise<BrokerOperationResult<BrokerHoldingsSnapshot>> {
      const { status, mode } = await statusWithMode();
      const accounts = await options.connector.listAccounts();
      const accountSeq = accountSeqFromRef(accounts.data, request.accountRef);
      if (accountSeq === null) {
        return tossOperationResult({ accountRef: request.accountRef, items: [] }, status, mode, accounts.rateLimit);
      }

      const firstSymbol = request.symbols?.[0];
      const holdingsResult = await options.connector.getHoldings(
        firstSymbol ? { accountSeq, symbol: firstSymbol } : { accountSeq }
      );
      const source = sourceFromMode(mode);
      const items: BrokerHolding[] = holdingsResult.data.items
        .filter((item) => !request.symbols || request.symbols.includes(item.symbol))
        .map((item) => ({
          accountRef: request.accountRef,
          symbol: item.symbol,
          market: enumValue(item.marketCountry),
          currency: enumValue(item.currency),
          name: item.name,
          quantity: item.quantity,
          averageCost: item.averagePurchasePrice,
          lastPrice: item.lastPrice,
          marketValue: item.marketValue.amount,
          profitLossAmount: item.profitLoss.amount,
          profitLossRate: item.profitLoss.rate,
          source
        }));
      return tossOperationResult({ accountRef: request.accountRef, items }, status, mode, holdingsResult.rateLimit);
    },

    async readCash(request): Promise<BrokerOperationResult<BrokerCashSnapshot>> {
      const { status, mode } = await statusWithMode();
      return tossOperationResult({ accountRef: request.accountRef, balances: [] }, status, mode);
    },

    async readQuotes(request): Promise<BrokerOperationResult<BrokerQuote[]>> {
      const { status, mode } = await statusWithMode();
      const result = await options.connector.getCurrentPrices({ symbols: request.symbols });
      const source = sourceFromMode(mode);
      return tossOperationResult(result.data.map((quote) => mapTossQuote(quote, source)), status, mode, result.rateLimit);
    },

    async readOrderbook(request): Promise<BrokerOperationResult<BrokerOrderbookSummary | null>> {
      const { status, mode } = await statusWithMode();
      const result = await options.connector.getOrderbookSummary({ symbol: request.symbol });
      return tossOperationResult(mapTossOrderbook(result.data, sourceFromMode(mode)), status, mode, result.rateLimit);
    },

    async readFxRate(request): Promise<BrokerOperationResult<BrokerFxRate | null>> {
      const { status, mode } = await statusWithMode();
      const result = await options.connector.getExchangeRate(request);
      return tossOperationResult(mapTossFxRate(result.data, sourceFromMode(mode)), status, mode, result.rateLimit);
    },

    async readMarketCalendar(request): Promise<BrokerOperationResult<BrokerMarketCalendar | null>> {
      const { status, mode } = await statusWithMode();
      const result = await options.connector.getMarketCalendar(request);
      return tossOperationResult(mapTossMarketCalendar(result.data, sourceFromMode(mode)), status, mode, result.rateLimit);
    },

    async readWarnings(request): Promise<BrokerOperationResult<BrokerWarning[]>> {
      const { status, mode } = await statusWithMode();
      const source = sourceFromMode(mode);
      const warnings: BrokerWarning[] = [];
      for (const symbol of request.symbols) {
        const result = await options.connector.getStockWarnings({ symbol });
        warnings.push(...result.data.map((warning) => mapTossWarning(symbol, warning, source)));
      }
      return tossOperationResult(warnings, status, mode);
    }
  };
}

export function assertBrokerOrderMutationUnavailable(operation: BrokerOrderMutationOperation): never {
  throw new Error(`${operation} is unavailable in Stage 2 Broker Connection Foundation.`);
}
