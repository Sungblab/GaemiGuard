export const TOSS_INVEST_OPENAPI_VERSION = "1.0.3" as const;

export type KnownEnum<T extends string> =
  | {
      value: T;
      known: true;
    }
  | {
      value: string;
      known: false;
    };

export type TossHttpMethod = "GET" | "POST";

export type TossOpenApiEndpoint<OperationId extends string = string> = {
  operationId: OperationId;
  method: TossHttpMethod;
  path: string;
  accountScoped: boolean;
};

export const TOSS_STAGE2_AUTH_ENDPOINT = {
  operationId: "issueOAuth2Token",
  method: "POST",
  path: "/oauth2/token",
  accountScoped: false
} as const satisfies TossOpenApiEndpoint;

export const TOSS_STAGE2_READONLY_DATA_ENDPOINTS = [
  {
    operationId: "getAccounts",
    method: "GET",
    path: "/api/v1/accounts",
    accountScoped: false
  },
  {
    operationId: "getHoldings",
    method: "GET",
    path: "/api/v1/holdings",
    accountScoped: true
  },
  {
    operationId: "getPrices",
    method: "GET",
    path: "/api/v1/prices",
    accountScoped: false
  },
  {
    operationId: "getOrderbook",
    method: "GET",
    path: "/api/v1/orderbook",
    accountScoped: false
  },
  {
    operationId: "getExchangeRate",
    method: "GET",
    path: "/api/v1/exchange-rate",
    accountScoped: false
  },
  {
    operationId: "getKrMarketCalendar",
    method: "GET",
    path: "/api/v1/market-calendar/KR",
    accountScoped: false
  },
  {
    operationId: "getUsMarketCalendar",
    method: "GET",
    path: "/api/v1/market-calendar/US",
    accountScoped: false
  },
  {
    operationId: "getStockWarnings",
    method: "GET",
    path: "/api/v1/stocks/{symbol}/warnings",
    accountScoped: false
  }
] as const satisfies readonly TossOpenApiEndpoint[];

export const TOSS_FORBIDDEN_MUTATION_ENDPOINTS = [
  {
    operationId: "createOrder",
    method: "POST",
    path: "/api/v1/orders",
    accountScoped: true
  },
  {
    operationId: "modifyOrder",
    method: "POST",
    path: "/api/v1/orders/{orderId}/modify",
    accountScoped: true
  },
  {
    operationId: "cancelOrder",
    method: "POST",
    path: "/api/v1/orders/{orderId}/cancel",
    accountScoped: true
  }
] as const satisfies readonly TossOpenApiEndpoint[];

export const TOSS_READONLY_TOOL_CONTRACT = [
  "toss.listAccounts",
  "toss.getHoldings",
  "toss.getCurrentPrices",
  "toss.getOrderbookSummary",
  "toss.getExchangeRate",
  "toss.getMarketCalendar",
  "toss.getStockWarnings"
] as const;

export type TossStage2ReadonlyDataOperationId = (typeof TOSS_STAGE2_READONLY_DATA_ENDPOINTS)[number]["operationId"];

export type TossForbiddenMutationOperationId = (typeof TOSS_FORBIDDEN_MUTATION_ENDPOINTS)[number]["operationId"];

export type TossStage2AvailableOperationId =
  | typeof TOSS_STAGE2_AUTH_ENDPOINT.operationId
  | TossStage2ReadonlyDataOperationId;

export type TossReadonlyToolName = (typeof TOSS_READONLY_TOOL_CONTRACT)[number];

export type TossConnectorMode = "not_configured" | "mock_replay" | "production_secret_store";

export type TossReadonlyToolContract = {
  mode: "read_only";
  tools: readonly TossReadonlyToolName[];
  includedOperations: readonly TossStage2ReadonlyDataOperationId[];
  forbiddenOperations: readonly TossForbiddenMutationOperationId[];
};

export type TossReadonlyConnectorStatus = {
  name: "toss_read_only";
  status: "ok" | "disabled" | "not_configured" | "warning" | "error";
  message: string;
  metadata: {
    mode: TossConnectorMode;
    openApiVersion: typeof TOSS_INVEST_OPENAPI_VERSION;
    includedOperations: readonly TossStage2ReadonlyDataOperationId[];
    forbiddenOperations: readonly TossForbiddenMutationOperationId[];
    tools: readonly TossReadonlyToolName[];
    snapshotFreshness?: TossReadonlySnapshotFreshness;
  };
};

export type TossCurrency = KnownEnum<"KRW" | "USD">;
export type TossMarketCountry = KnownEnum<"KR" | "US">;
export type TossAccountType = KnownEnum<"BROKERAGE" | "OVERSEAS_DERIVATIVES" | "PENSION_SAVINGS" | "RESHORING_INVESTMENT">;
export type TossRateChangeType = KnownEnum<"UP" | "EQUAL" | "DOWN">;
export type TossStockWarningType = KnownEnum<
  | "LIQUIDATION_TRADING"
  | "OVERHEATED"
  | "INVESTMENT_WARNING"
  | "INVESTMENT_RISK"
  | "VI_STATIC_AND_DYNAMIC"
  | "VI_STATIC"
  | "VI_DYNAMIC"
  | "STOCK_WARRANTS"
>;

export type TossAccount = {
  accountSeq: number;
  maskedAccountNo: string;
  accountType: TossAccountType;
};

export type TossPriceAmount = {
  krw: string;
  usd?: string | null;
};

export type TossHoldingItem = {
  symbol: string;
  name: string;
  marketCountry: TossMarketCountry;
  currency: TossCurrency;
  quantity: string;
  lastPrice: string;
  averagePurchasePrice: string;
  marketValue: {
    purchaseAmount: string;
    amount: string;
    amountAfterCost: string;
  };
  profitLoss: {
    amount: string;
    amountAfterCost: string;
    rate: string;
    rateAfterCost: string;
  };
  dailyProfitLoss: {
    amount: string;
    rate: string;
  };
  cost: {
    commission: string;
    tax?: string | null;
  };
};

export type TossHoldingsOverview = {
  totalPurchaseAmount: TossPriceAmount;
  marketValue: {
    amount: TossPriceAmount;
    amountAfterCost: TossPriceAmount;
  };
  profitLoss: {
    amount: TossPriceAmount;
    amountAfterCost: TossPriceAmount;
    rate: string;
    rateAfterCost: string;
  };
  dailyProfitLoss: {
    amount: TossPriceAmount;
    rate: string;
  };
  items: TossHoldingItem[];
};

export type TossQuote = {
  symbol: string;
  timestamp?: string | null;
  lastPrice: string;
  currency: TossCurrency;
};

export type TossOrderbookLevel = {
  price: string;
  volume: string;
};

export type TossOrderbookSummary = {
  symbol: string;
  timestamp?: string | null;
  currency: TossCurrency;
  bestAsk?: TossOrderbookLevel;
  bestBid?: TossOrderbookLevel;
  asks: TossOrderbookLevel[];
  bids: TossOrderbookLevel[];
};

export type TossExchangeRate = {
  baseCurrency: TossCurrency;
  quoteCurrency: TossCurrency;
  rate: string;
  midRate: string;
  basisPoint: string;
  rateChangeType: TossRateChangeType;
  validFrom: string;
  validUntil: string;
};

export type TossMarketCalendar = {
  market: "KR" | "US";
  today: TossMarketDay;
  previousBusinessDay: TossMarketDay;
  nextBusinessDay: TossMarketDay;
};

export type TossMarketDay = {
  date: string;
  sessions: Record<string, unknown>;
};

export type TossStockWarning = {
  warningType: TossStockWarningType;
  exchange: string;
  startDate?: string | null;
  endDate?: string | null;
};

export type TossRateLimitSnapshot = {
  limit?: string;
  remaining?: string;
  reset?: string;
  retryAfter?: string;
};

export type TossConnectorResult<T> = {
  data: T;
  rateLimit: TossRateLimitSnapshot;
  requestId?: string;
};

export type TossReadonlySnapshotSource = "mock_replay_snapshot";

export type TossReadonlySnapshotFreshness = {
  mode: Extract<TossConnectorMode, "mock_replay">;
  status: "never_synced" | "fresh" | "stale";
  source: TossReadonlySnapshotSource;
  lastSuccessfulSyncAt?: string;
  ageSeconds?: number;
  staleAfterSeconds: number;
  accountCount: number;
  holdingCount: number;
  quoteCount: number;
  orderbookCount: number;
  exchangeRateCount: number;
  marketCalendarCount: number;
  stockWarningCount: number;
  rateLimitScopes: TossStage2ReadonlyDataOperationId[];
  message: string;
};

export type TossReadonlySnapshotFreshnessRequest = {
  now?: string;
  staleAfterSeconds?: number;
};

export type TossReadonlyStoredAccount = {
  accountRef: string;
  maskedAccountNo: string;
  accountType: TossAccountType;
  lastSyncedAt: string;
};

export type TossReadonlyStoredHoldingsSnapshot = {
  snapshotId: string;
  accountRef: string;
  syncedAt: string;
  overview: TossHoldingsOverview;
};

export type TossReadonlyStoredStockWarningSnapshot = {
  snapshotId: string;
  symbol: string;
  syncedAt: string;
  warnings: TossStockWarning[];
};

export type TossReadonlyStoredRateLimitMetadata = {
  scope: TossStage2ReadonlyDataOperationId;
  capturedAt: string;
  metadata: TossRateLimitSnapshot;
};

export type TossReadonlyStoredSyncLog = {
  id: string;
  mode: Extract<TossConnectorMode, "mock_replay">;
  status: "succeeded" | "failed" | "skipped";
  startedAt: string;
  finishedAt: string;
  message: string;
  accountCount: number;
  holdingCount: number;
  quoteCount: number;
  orderbookCount: number;
  exchangeRateCount: number;
  marketCalendarCount: number;
  stockWarningCount: number;
};

export type TossReadonlySnapshotWrite = {
  syncLog: TossReadonlyStoredSyncLog;
  accounts: TossReadonlyStoredAccount[];
  holdings: TossReadonlyStoredHoldingsSnapshot[];
  quotes: Array<TossQuote & { syncedAt: string }>;
  orderbooks: Array<TossOrderbookSummary & { syncedAt: string }>;
  exchangeRates: Array<TossExchangeRate & { syncedAt: string }>;
  marketCalendars: Array<TossMarketCalendar & { syncedAt: string }>;
  stockWarnings: TossReadonlyStoredStockWarningSnapshot[];
  rateLimits: TossReadonlyStoredRateLimitMetadata[];
};

export type TossReadonlySnapshotBundle = {
  accounts: TossReadonlyStoredAccount[];
  holdings: TossReadonlyStoredHoldingsSnapshot[];
  quotes: Array<TossQuote & { syncedAt: string }>;
  orderbooks: Array<TossOrderbookSummary & { syncedAt: string }>;
  exchangeRates: Array<TossExchangeRate & { syncedAt: string }>;
  marketCalendars: Array<TossMarketCalendar & { syncedAt: string }>;
  stockWarnings: TossReadonlyStoredStockWarningSnapshot[];
  syncLogs: TossReadonlyStoredSyncLog[];
  rateLimits: TossReadonlyStoredRateLimitMetadata[];
};

export interface TossReadonlySnapshotRepository {
  saveSyncSnapshot(snapshot: TossReadonlySnapshotWrite): Promise<void>;
  getFreshnessStatus(request?: TossReadonlySnapshotFreshnessRequest): Promise<TossReadonlySnapshotFreshness>;
  readLatest(): Promise<TossReadonlySnapshotBundle>;
}

export type TossAccountRequest = Record<string, never>;

export type TossHoldingsRequest = {
  accountSeq: number;
  symbol?: string;
};

export type TossCurrentPricesRequest = {
  symbols: string[];
};

export type TossOrderbookRequest = {
  symbol: string;
};

export type TossExchangeRateRequest = {
  baseCurrency: "KRW" | "USD";
  quoteCurrency: "KRW" | "USD";
  dateTime?: string;
};

export type TossMarketCalendarRequest = {
  market: "KR" | "US";
  date?: string;
};

export type TossStockWarningsRequest = {
  symbol: string;
};

export interface TossReadonlyConnector {
  getStatus(): Promise<TossReadonlyConnectorStatus>;
  getToolContract(): TossReadonlyToolContract;
  listAccounts(request?: TossAccountRequest): Promise<TossConnectorResult<TossAccount[]>>;
  getHoldings(request: TossHoldingsRequest): Promise<TossConnectorResult<TossHoldingsOverview>>;
  getCurrentPrices(request: TossCurrentPricesRequest): Promise<TossConnectorResult<TossQuote[]>>;
  getOrderbookSummary(request: TossOrderbookRequest): Promise<TossConnectorResult<TossOrderbookSummary>>;
  getExchangeRate(request: TossExchangeRateRequest): Promise<TossConnectorResult<TossExchangeRate>>;
  getMarketCalendar(request: TossMarketCalendarRequest): Promise<TossConnectorResult<TossMarketCalendar>>;
  getStockWarnings(request: TossStockWarningsRequest): Promise<TossConnectorResult<TossStockWarning[]>>;
}
