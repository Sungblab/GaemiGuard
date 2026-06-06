export type BrokerProviderId = "manual" | "toss" | "kis" | "kiwoom" | "ls" | "csv_import";

export type BrokerProviderDescriptor = {
  id: BrokerProviderId;
  displayName: string;
};

export type BrokerConnectionStatus =
  | "no_broker"
  | "not_configured"
  | "credential_configured"
  | "syncing"
  | "mock_replay"
  | "readonly_available"
  | "stale"
  | "failed"
  | "unavailable"
  | "error";

export type BrokerAuthorityLevel = "no_broker" | "metadata_only" | "read_only";

export type BrokerReadCapability = "available" | "unavailable";

export type BrokerMutationCapability = {
  availability: "disabled" | "unavailable";
  reason: string;
  stage: "stage_2_broker_connection_foundation";
};

export type BrokerCapabilities = {
  accounts: { read: BrokerReadCapability };
  holdings: { read: BrokerReadCapability };
  cash: { read: BrokerReadCapability };
  quotes: { read: BrokerReadCapability };
  orderbook: { read: BrokerReadCapability };
  fx: { read: BrokerReadCapability };
  calendar: { read: BrokerReadCapability };
  warnings: { read: BrokerReadCapability };
  orders: {
    create: BrokerMutationCapability;
    modify: BrokerMutationCapability;
    cancel: BrokerMutationCapability;
  };
};

export type BrokerFreshnessStatus = "unavailable" | "never_synced" | "syncing" | "fresh" | "stale" | "failed" | "local_manual";

export type BrokerFreshnessSource = "not_configured" | "mock_replay_snapshot" | "production_snapshot" | "manual_input";

export type BrokerFreshness = {
  status: BrokerFreshnessStatus;
  source: BrokerFreshnessSource;
  message: string;
  lastUpdatedAt?: string;
  ageSeconds?: number;
  staleAfterSeconds?: number;
};

export type BrokerAdapterStatus = {
  provider: BrokerProviderDescriptor;
  status: BrokerConnectionStatus;
  authorityLevel: BrokerAuthorityLevel;
  capabilities: BrokerCapabilities;
  freshness: BrokerFreshness;
  message: string;
  metadata?: Record<string, unknown>;
};

export type BrokerDataSource = "manual_input" | "mock_replay" | "production_snapshot";

export type BrokerOperationResult<T> = {
  data: T;
  provider: BrokerProviderDescriptor;
  source: BrokerDataSource;
  freshness: BrokerFreshness;
  rateLimit?: Record<string, string | undefined>;
};

export type BrokerAccount = {
  accountRef: string;
  displayLabel: string;
  providerId: BrokerProviderId;
  source: BrokerDataSource;
  accountType?: string;
};

export type BrokerHolding = {
  accountRef: string;
  symbol: string;
  market: "KR" | "US" | string;
  currency: "KRW" | "USD" | string;
  name?: string;
  quantity: string;
  averageCost?: string;
  lastPrice?: string;
  marketValue?: string;
  profitLossAmount?: string;
  profitLossRate?: string;
  source: BrokerDataSource;
  updatedAt?: string;
};

export type BrokerHoldingsSnapshot = {
  accountRef: string;
  items: BrokerHolding[];
};

export type BrokerCashBalance = {
  accountRef: string;
  currency: "KRW" | "USD" | string;
  amount: string;
  source: BrokerDataSource;
  updatedAt?: string;
};

export type BrokerCashSnapshot = {
  accountRef: string;
  balances: BrokerCashBalance[];
};

export type BrokerQuote = {
  symbol: string;
  currency: "KRW" | "USD" | string;
  lastPrice: string;
  timestamp?: string | null;
  source: BrokerDataSource;
};

export type BrokerOrderbookSummary = {
  symbol: string;
  currency: "KRW" | "USD" | string;
  bestAsk?: { price: string; volume: string };
  bestBid?: { price: string; volume: string };
  timestamp?: string | null;
  source: BrokerDataSource;
};

export type BrokerFxRate = {
  baseCurrency: "KRW" | "USD" | string;
  quoteCurrency: "KRW" | "USD" | string;
  rate: string;
  validFrom?: string;
  validUntil?: string;
  source: BrokerDataSource;
};

export type BrokerMarketCalendar = {
  market: "KR" | "US";
  today: { date: string; sessions: Record<string, unknown> };
  previousBusinessDay: { date: string; sessions: Record<string, unknown> };
  nextBusinessDay: { date: string; sessions: Record<string, unknown> };
  source: BrokerDataSource;
};

export type BrokerWarning = {
  symbol: string;
  warningType: string;
  exchange: string;
  startDate?: string | null;
  endDate?: string | null;
  source: BrokerDataSource;
};

export type BrokerHoldingsRequest = {
  accountRef: string;
  symbols?: string[];
};

export type BrokerCashRequest = {
  accountRef: string;
};

export type BrokerQuotesRequest = {
  symbols: string[];
};

export type BrokerOrderbookRequest = {
  symbol: string;
};

export type BrokerFxRateRequest = {
  baseCurrency: "KRW" | "USD";
  quoteCurrency: "KRW" | "USD";
};

export type BrokerMarketCalendarRequest = {
  market: "KR" | "US";
  date?: string;
};

export type BrokerWarningsRequest = {
  symbols: string[];
};

export interface BrokerAdapter {
  readonly provider: BrokerProviderDescriptor;
  getStatus(): Promise<BrokerAdapterStatus>;
  readAccounts(): Promise<BrokerOperationResult<BrokerAccount[]>>;
  readHoldings(request: BrokerHoldingsRequest): Promise<BrokerOperationResult<BrokerHoldingsSnapshot>>;
  readCash(request: BrokerCashRequest): Promise<BrokerOperationResult<BrokerCashSnapshot>>;
  readQuotes(request: BrokerQuotesRequest): Promise<BrokerOperationResult<BrokerQuote[]>>;
  readOrderbook(request: BrokerOrderbookRequest): Promise<BrokerOperationResult<BrokerOrderbookSummary | null>>;
  readFxRate(request: BrokerFxRateRequest): Promise<BrokerOperationResult<BrokerFxRate | null>>;
  readMarketCalendar(request: BrokerMarketCalendarRequest): Promise<BrokerOperationResult<BrokerMarketCalendar | null>>;
  readWarnings(request: BrokerWarningsRequest): Promise<BrokerOperationResult<BrokerWarning[]>>;
}

export type ManualPortfolioWatchlistItem = {
  symbol: string;
  market: "KR" | "US" | string;
  name?: string;
  note?: string;
  source: "manual_input";
  updatedAt: string;
};

export type ManualPortfolioHolding = BrokerHolding & {
  accountRef: "manual:default";
  source: "manual_input";
  updatedAt: string;
};

export type ManualPortfolioCashBalance = BrokerCashBalance & {
  accountRef: "manual:default";
  source: "manual_input";
  updatedAt: string;
};

export type ManualPortfolioSnapshot = {
  account: BrokerAccount;
  watchlist: ManualPortfolioWatchlistItem[];
  holdings: ManualPortfolioHolding[];
  cashBalances: ManualPortfolioCashBalance[];
  freshness: BrokerFreshness;
};

export type ManualPortfolioWatchlistInput = {
  symbol: string;
  market: "KR" | "US" | string;
  name?: string;
  note?: string;
};

export type ManualPortfolioHoldingInput = {
  symbol: string;
  market: "KR" | "US" | string;
  currency: "KRW" | "USD" | string;
  name?: string;
  quantity: string;
  averageCost?: string;
  note?: string;
};

export type ManualPortfolioCashBalanceInput = {
  currency: "KRW" | "USD" | string;
  amount: string;
};

export interface ManualPortfolioRepository {
  upsertWatchlistItem(input: ManualPortfolioWatchlistInput): Promise<ManualPortfolioSnapshot>;
  upsertHolding(input: ManualPortfolioHoldingInput): Promise<ManualPortfolioSnapshot>;
  upsertCashBalance(input: ManualPortfolioCashBalanceInput): Promise<ManualPortfolioSnapshot>;
  readSnapshot(): Promise<ManualPortfolioSnapshot>;
}
