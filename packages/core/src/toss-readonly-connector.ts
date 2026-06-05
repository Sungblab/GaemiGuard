import type {
  KnownEnum,
  TossAccount,
  TossAccountRequest,
  TossAccountType,
  TossConnectorMode,
  TossConnectorResult,
  TossCurrency,
  TossCurrentPricesRequest,
  TossExchangeRate,
  TossExchangeRateRequest,
  TossForbiddenMutationOperationId,
  TossHoldingItem,
  TossHoldingsOverview,
  TossHoldingsRequest,
  TossMarketCalendar,
  TossMarketCalendarRequest,
  TossMarketCountry,
  TossMarketDay,
  TossOpenApiEndpoint,
  TossOrderbookLevel,
  TossOrderbookRequest,
  TossOrderbookSummary,
  TossQuote,
  TossRateChangeType,
  TossRateLimitSnapshot,
  TossReadonlyConnector,
  TossReadonlyConnectorStatus,
  TossReadonlyToolContract,
  TossStage2AvailableOperationId,
  TossStage2ReadonlyDataOperationId,
  TossStockWarning,
  TossStockWarningType,
  TossStockWarningsRequest
} from "@gaemiguard/shared";
import {
  TOSS_FORBIDDEN_MUTATION_ENDPOINTS,
  TOSS_INVEST_OPENAPI_VERSION,
  TOSS_READONLY_TOOL_CONTRACT,
  TOSS_STAGE2_AUTH_ENDPOINT,
  TOSS_STAGE2_READONLY_DATA_ENDPOINTS
} from "@gaemiguard/shared";

export {
  TOSS_FORBIDDEN_MUTATION_ENDPOINTS,
  TOSS_INVEST_OPENAPI_VERSION,
  TOSS_READONLY_TOOL_CONTRACT,
  TOSS_STAGE2_AUTH_ENDPOINT,
  TOSS_STAGE2_READONLY_DATA_ENDPOINTS
} from "@gaemiguard/shared";

type RawRecord = Record<string, unknown>;

type TossAccessToken = {
  accessToken: string;
  tokenType: string;
  expiresAtMs: number;
};

export type TossClientCredentials = {
  clientId: string;
  clientSecret: string;
  boundary: Extract<TossConnectorMode, "mock_replay" | "production_secret_store">;
};

export interface TossCredentialProvider {
  getClientCredentials(): Promise<TossClientCredentials | null>;
}

export interface TossTokenCache {
  get(now: Date): TossAccessToken | null;
  set(token: TossAccessToken): void;
  clear(): void;
}

export class InMemoryTossTokenCache implements TossTokenCache {
  private token: TossAccessToken | null = null;

  get(now: Date): TossAccessToken | null {
    if (!this.token) {
      return null;
    }

    const oneMinuteFromNow = now.getTime() + 60_000;
    if (this.token.expiresAtMs <= oneMinuteFromNow) {
      this.token = null;
      return null;
    }

    return this.token;
  }

  set(token: TossAccessToken): void {
    this.token = token;
  }

  clear(): void {
    this.token = null;
  }
}

export class TossReadonlyConnectorError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly retryAfter?: string;

  constructor(input: { status: number; code: string; message: string; requestId?: string; retryAfter?: string }) {
    super(`Toss read-only connector ${input.code}: ${input.message}`);
    this.name = "TossReadonlyConnectorError";
    this.status = input.status;
    this.code = input.code;
    if (input.requestId !== undefined) {
      this.requestId = input.requestId;
    }
    if (input.retryAfter !== undefined) {
      this.retryAfter = input.retryAfter;
    }
  }
}

export function createStaticTossCredentialProvider(credentials: TossClientCredentials): TossCredentialProvider {
  return {
    async getClientCredentials(): Promise<TossClientCredentials> {
      return credentials;
    }
  };
}

function toolContract(): TossReadonlyToolContract {
  return {
    mode: "read_only",
    tools: TOSS_READONLY_TOOL_CONTRACT,
    includedOperations: TOSS_STAGE2_READONLY_DATA_ENDPOINTS.map((endpoint) => endpoint.operationId),
    forbiddenOperations: TOSS_FORBIDDEN_MUTATION_ENDPOINTS.map((endpoint) => endpoint.operationId)
  };
}

function statusFor(mode: TossConnectorMode, status: TossReadonlyConnectorStatus["status"], message: string): TossReadonlyConnectorStatus {
  const contract = toolContract();
  return {
    name: "toss_read_only",
    status,
    message,
    metadata: {
      mode,
      openApiVersion: TOSS_INVEST_OPENAPI_VERSION,
      includedOperations: contract.includedOperations,
      forbiddenOperations: contract.forbiddenOperations,
      tools: contract.tools
    }
  };
}

function isForbiddenMutationOperation(operationId: string): operationId is TossForbiddenMutationOperationId {
  return TOSS_FORBIDDEN_MUTATION_ENDPOINTS.some((endpoint) => endpoint.operationId === operationId);
}

function isAvailableStage2Operation(operationId: string): operationId is TossStage2AvailableOperationId {
  return (
    operationId === TOSS_STAGE2_AUTH_ENDPOINT.operationId ||
    TOSS_STAGE2_READONLY_DATA_ENDPOINTS.some((endpoint) => endpoint.operationId === operationId)
  );
}

export function assertTossStage2OperationAvailable(operationId: string): asserts operationId is TossStage2AvailableOperationId {
  if (isForbiddenMutationOperation(operationId)) {
    throw new TossReadonlyConnectorError({
      status: 0,
      code: "order_mutation_forbidden",
      message: `${operationId} is a Toss order mutation endpoint and is forbidden in Stage 2 read-only mode.`
    });
  }

  if (!isAvailableStage2Operation(operationId)) {
    throw new TossReadonlyConnectorError({
      status: 0,
      code: "operation_not_included",
      message: `${operationId} is not included in the Stage 2 first-slice Toss read-only connector scope.`
    });
  }
}

function asRecord(value: unknown): RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as RawRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function optionalString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return asString(value);
}

function knownEnum<T extends readonly string[]>(value: unknown, allowed: T): KnownEnum<T[number]> {
  const raw = asString(value);
  return allowed.includes(raw) ? { value: raw as T[number], known: true } : { value: raw, known: false };
}

const CURRENCIES = ["KRW", "USD"] as const;
const MARKET_COUNTRIES = ["KR", "US"] as const;
const ACCOUNT_TYPES = ["BROKERAGE", "OVERSEAS_DERIVATIVES", "PENSION_SAVINGS", "RESHORING_INVESTMENT"] as const;
const RATE_CHANGE_TYPES = ["UP", "EQUAL", "DOWN"] as const;
const STOCK_WARNING_TYPES = [
  "LIQUIDATION_TRADING",
  "OVERHEATED",
  "INVESTMENT_WARNING",
  "INVESTMENT_RISK",
  "VI_STATIC_AND_DYNAMIC",
  "VI_STATIC",
  "VI_DYNAMIC",
  "STOCK_WARRANTS"
] as const;

function maskAccountNo(accountNo: string): string {
  const visible = accountNo.slice(-4);
  const hiddenLength = Math.max(accountNo.length - visible.length, 0);
  return `${"*".repeat(hiddenLength)}${visible}`;
}

function mapPriceAmount(value: unknown): { krw: string; usd?: string | null } {
  const row = asRecord(value);
  const usd = optionalString(row.usd);
  return {
    krw: asString(row.krw),
    ...(usd !== undefined ? { usd } : {})
  };
}

function mapAccount(value: unknown): TossAccount {
  const row = asRecord(value);
  return {
    accountSeq: asNumber(row.accountSeq),
    maskedAccountNo: maskAccountNo(asString(row.accountNo)),
    accountType: knownEnum(row.accountType, ACCOUNT_TYPES) as TossAccountType
  };
}

function mapHoldingItem(value: unknown): TossHoldingItem {
  const row = asRecord(value);
  const marketValue = asRecord(row.marketValue);
  const profitLoss = asRecord(row.profitLoss);
  const dailyProfitLoss = asRecord(row.dailyProfitLoss);
  const cost = asRecord(row.cost);
  const tax = optionalString(cost.tax);

  return {
    symbol: asString(row.symbol),
    name: asString(row.name),
    marketCountry: knownEnum(row.marketCountry, MARKET_COUNTRIES) as TossMarketCountry,
    currency: knownEnum(row.currency, CURRENCIES) as TossCurrency,
    quantity: asString(row.quantity),
    lastPrice: asString(row.lastPrice),
    averagePurchasePrice: asString(row.averagePurchasePrice),
    marketValue: {
      purchaseAmount: asString(marketValue.purchaseAmount),
      amount: asString(marketValue.amount),
      amountAfterCost: asString(marketValue.amountAfterCost)
    },
    profitLoss: {
      amount: asString(profitLoss.amount),
      amountAfterCost: asString(profitLoss.amountAfterCost),
      rate: asString(profitLoss.rate),
      rateAfterCost: asString(profitLoss.rateAfterCost)
    },
    dailyProfitLoss: {
      amount: asString(dailyProfitLoss.amount),
      rate: asString(dailyProfitLoss.rate)
    },
    cost: {
      commission: asString(cost.commission),
      ...(tax !== undefined ? { tax } : {})
    }
  };
}

function mapHoldingsOverview(value: unknown): TossHoldingsOverview {
  const row = asRecord(value);
  const marketValue = asRecord(row.marketValue);
  const profitLoss = asRecord(row.profitLoss);
  const dailyProfitLoss = asRecord(row.dailyProfitLoss);

  return {
    totalPurchaseAmount: mapPriceAmount(row.totalPurchaseAmount),
    marketValue: {
      amount: mapPriceAmount(marketValue.amount),
      amountAfterCost: mapPriceAmount(marketValue.amountAfterCost)
    },
    profitLoss: {
      amount: mapPriceAmount(profitLoss.amount),
      amountAfterCost: mapPriceAmount(profitLoss.amountAfterCost),
      rate: asString(profitLoss.rate),
      rateAfterCost: asString(profitLoss.rateAfterCost)
    },
    dailyProfitLoss: {
      amount: mapPriceAmount(dailyProfitLoss.amount),
      rate: asString(dailyProfitLoss.rate)
    },
    items: asArray(row.items).map(mapHoldingItem)
  };
}

function mapQuote(value: unknown): TossQuote {
  const row = asRecord(value);
  const timestamp = optionalString(row.timestamp);
  return {
    symbol: asString(row.symbol),
    ...(timestamp !== undefined ? { timestamp } : {}),
    lastPrice: asString(row.lastPrice),
    currency: knownEnum(row.currency, CURRENCIES) as TossCurrency
  };
}

function mapOrderbookLevel(value: unknown): TossOrderbookLevel {
  const row = asRecord(value);
  return {
    price: asString(row.price),
    volume: asString(row.volume)
  };
}

function mapOrderbookSummary(symbol: string, value: unknown): TossOrderbookSummary {
  const row = asRecord(value);
  const asks = asArray(row.asks).map(mapOrderbookLevel);
  const bids = asArray(row.bids).map(mapOrderbookLevel);
  const timestamp = optionalString(row.timestamp);
  return {
    symbol,
    ...(timestamp !== undefined ? { timestamp } : {}),
    currency: knownEnum(row.currency, CURRENCIES) as TossCurrency,
    ...(asks[0] ? { bestAsk: asks[0] } : {}),
    ...(bids[0] ? { bestBid: bids[0] } : {}),
    asks,
    bids
  };
}

function mapExchangeRate(value: unknown): TossExchangeRate {
  const row = asRecord(value);
  return {
    baseCurrency: knownEnum(row.baseCurrency, CURRENCIES) as TossCurrency,
    quoteCurrency: knownEnum(row.quoteCurrency, CURRENCIES) as TossCurrency,
    rate: asString(row.rate),
    midRate: asString(row.midRate),
    basisPoint: asString(row.basisPoint),
    rateChangeType: knownEnum(row.rateChangeType, RATE_CHANGE_TYPES) as TossRateChangeType,
    validFrom: asString(row.validFrom),
    validUntil: asString(row.validUntil)
  };
}

function mapMarketDay(value: unknown): TossMarketDay {
  const row = asRecord(value);
  const { date: _date, ...sessions } = row;
  return {
    date: asString(row.date),
    sessions
  };
}

function mapMarketCalendar(market: "KR" | "US", value: unknown): TossMarketCalendar {
  const row = asRecord(value);
  return {
    market,
    today: mapMarketDay(row.today),
    previousBusinessDay: mapMarketDay(row.previousBusinessDay),
    nextBusinessDay: mapMarketDay(row.nextBusinessDay)
  };
}

function mapStockWarning(value: unknown): TossStockWarning {
  const row = asRecord(value);
  const startDate = optionalString(row.startDate);
  const endDate = optionalString(row.endDate);
  return {
    warningType: knownEnum(row.warningType, STOCK_WARNING_TYPES) as TossStockWarningType,
    exchange: asString(row.exchange),
    ...(startDate !== undefined ? { startDate } : {}),
    ...(endDate !== undefined ? { endDate } : {})
  };
}

function rateLimitFrom(headers: Headers): TossRateLimitSnapshot {
  const limit = headers.get("X-RateLimit-Limit") ?? undefined;
  const remaining = headers.get("X-RateLimit-Remaining") ?? undefined;
  const reset = headers.get("X-RateLimit-Reset") ?? undefined;
  const retryAfter = headers.get("Retry-After") ?? undefined;

  return {
    ...(limit !== undefined ? { limit } : {}),
    ...(remaining !== undefined ? { remaining } : {}),
    ...(reset !== undefined ? { reset } : {}),
    ...(retryAfter !== undefined ? { retryAfter } : {})
  };
}

function resultFromEnvelope(body: unknown): unknown {
  return asRecord(body).result;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

function errorFromResponse(response: Response, body: unknown): TossReadonlyConnectorError {
  const row = asRecord(body);
  const apiError = row.error;
  const retryAfter = response.headers.get("Retry-After") ?? undefined;

  if (typeof apiError === "string") {
    const description = asString(row.error_description) || response.statusText || "Toss OAuth2 request failed.";
    return new TossReadonlyConnectorError({
      status: response.status,
      code: apiError,
      message: description,
      ...(retryAfter !== undefined ? { retryAfter } : {})
    });
  }

  const error = asRecord(apiError);
  const requestId = asString(error.requestId) || undefined;
  const code = asString(error.code) || `http_${response.status}`;
  const message = asString(error.message) || response.statusText || "Toss API request failed.";
  return new TossReadonlyConnectorError({
    status: response.status,
    code,
    message,
    ...(requestId !== undefined ? { requestId } : {}),
    ...(retryAfter !== undefined ? { retryAfter } : {})
  });
}

export type TossInvestReadonlyClientOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
  credentials?: TossCredentialProvider;
  tokenCache?: TossTokenCache;
  clock?: () => Date;
};

export class TossInvestReadonlyClient implements TossReadonlyConnector {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly credentials?: TossCredentialProvider;
  private readonly tokenCache: TossTokenCache;
  private readonly clock: () => Date;

  constructor(options: TossInvestReadonlyClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://openapi.tossinvest.com";
    this.fetchImpl = options.fetch ?? fetch;
    if (options.credentials !== undefined) {
      this.credentials = options.credentials;
    }
    this.tokenCache = options.tokenCache ?? new InMemoryTossTokenCache();
    this.clock = options.clock ?? (() => new Date());
  }

  async getStatus(): Promise<TossReadonlyConnectorStatus> {
    const credentials = await this.credentials?.getClientCredentials();
    if (!credentials) {
      return statusFor(
        "not_configured",
        "not_configured",
        "Toss Invest read-only connector is present, but no credential provider is configured."
      );
    }

    return statusFor(
      credentials.boundary,
      "ok",
      credentials.boundary === "mock_replay"
        ? "Toss Invest read-only connector is using mock replay credentials."
        : "Toss Invest read-only connector has a credential provider; requests remain read-only."
    );
  }

  getToolContract(): TossReadonlyToolContract {
    return toolContract();
  }

  async listAccounts(_request: TossAccountRequest = {}): Promise<TossConnectorResult<TossAccount[]>> {
    return this.request({
      endpoint: endpointByOperation("getAccounts"),
      map: (result) => asArray(result).map(mapAccount)
    });
  }

  async getHoldings(request: TossHoldingsRequest): Promise<TossConnectorResult<TossHoldingsOverview>> {
    return this.request({
      endpoint: endpointByOperation("getHoldings"),
      accountSeq: request.accountSeq,
      query: request.symbol ? { symbol: request.symbol } : {},
      map: mapHoldingsOverview
    });
  }

  async getCurrentPrices(request: TossCurrentPricesRequest): Promise<TossConnectorResult<TossQuote[]>> {
    return this.request({
      endpoint: endpointByOperation("getPrices"),
      query: { symbols: request.symbols.join(",") },
      map: (result) => asArray(result).map(mapQuote)
    });
  }

  async getOrderbookSummary(request: TossOrderbookRequest): Promise<TossConnectorResult<TossOrderbookSummary>> {
    return this.request({
      endpoint: endpointByOperation("getOrderbook"),
      query: { symbol: request.symbol },
      map: (result) => mapOrderbookSummary(request.symbol, result)
    });
  }

  async getExchangeRate(request: TossExchangeRateRequest): Promise<TossConnectorResult<TossExchangeRate>> {
    return this.request({
      endpoint: endpointByOperation("getExchangeRate"),
      query: {
        baseCurrency: request.baseCurrency,
        quoteCurrency: request.quoteCurrency,
        ...(request.dateTime ? { dateTime: request.dateTime } : {})
      },
      map: mapExchangeRate
    });
  }

  async getMarketCalendar(request: TossMarketCalendarRequest): Promise<TossConnectorResult<TossMarketCalendar>> {
    const operationId = request.market === "KR" ? "getKrMarketCalendar" : "getUsMarketCalendar";
    return this.request({
      endpoint: endpointByOperation(operationId),
      query: request.date ? { date: request.date } : {},
      map: (result) => mapMarketCalendar(request.market, result)
    });
  }

  async getStockWarnings(request: TossStockWarningsRequest): Promise<TossConnectorResult<TossStockWarning[]>> {
    return this.request({
      endpoint: endpointByOperation("getStockWarnings", { symbol: request.symbol }),
      map: (result) => asArray(result).map(mapStockWarning)
    });
  }

  private async request<T>(input: {
    endpoint: TossOpenApiEndpoint<TossStage2ReadonlyDataOperationId>;
    query?: Record<string, string>;
    accountSeq?: number;
    map: (result: unknown) => T;
  }): Promise<TossConnectorResult<T>> {
    assertTossStage2OperationAvailable(input.endpoint.operationId);
    const token = await this.accessToken();
    const url = new URL(input.endpoint.path, this.baseUrl);

    for (const [key, value] of Object.entries(input.query ?? {})) {
      url.searchParams.set(key, value);
    }

    const headers = new Headers({
      Accept: "application/json",
      Authorization: `${token.tokenType} ${token.accessToken}`
    });
    if (input.accountSeq !== undefined) {
      headers.set("X-Tossinvest-Account", String(input.accountSeq));
    }

    const response = await this.fetchImpl(url, {
      method: input.endpoint.method,
      headers
    });
    const body = await readJson(response);
    if (!response.ok) {
      throw errorFromResponse(response, body);
    }

    const requestId = asString(asRecord(asRecord(body).error).requestId) || undefined;
    return {
      data: input.map(resultFromEnvelope(body)),
      rateLimit: rateLimitFrom(response.headers),
      ...(requestId !== undefined ? { requestId } : {})
    };
  }

  private async accessToken(): Promise<TossAccessToken> {
    const cached = this.tokenCache.get(this.clock());
    if (cached) {
      return cached;
    }

    const credentials = await this.credentials?.getClientCredentials();
    if (!credentials) {
      throw new TossReadonlyConnectorError({
        status: 0,
        code: "not_configured",
        message: "Toss credentials are not configured for the read-only connector."
      });
    }

    const token = await this.issueToken(credentials);
    this.tokenCache.set(token);
    return token;
  }

  private async issueToken(credentials: TossClientCredentials): Promise<TossAccessToken> {
    assertTossStage2OperationAvailable(TOSS_STAGE2_AUTH_ENDPOINT.operationId);
    const url = new URL(TOSS_STAGE2_AUTH_ENDPOINT.path, this.baseUrl);
    const form = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret
    });

    const response = await this.fetchImpl(url, {
      method: TOSS_STAGE2_AUTH_ENDPOINT.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form
    });
    const body = await readJson(response);
    if (!response.ok) {
      throw errorFromResponse(response, body);
    }

    const row = asRecord(body);
    const expiresInSeconds = asNumber(row.expires_in);
    return {
      accessToken: asString(row.access_token),
      tokenType: asString(row.token_type) || "Bearer",
      expiresAtMs: this.clock().getTime() + expiresInSeconds * 1000
    };
  }
}

function endpointByOperation<OperationId extends TossStage2ReadonlyDataOperationId>(
  operationId: OperationId,
  pathParams: Record<string, string> = {}
): TossOpenApiEndpoint<OperationId> {
  const endpoint = TOSS_STAGE2_READONLY_DATA_ENDPOINTS.find((candidate) => candidate.operationId === operationId);
  if (!endpoint) {
    throw new TossReadonlyConnectorError({
      status: 0,
      code: "operation_not_included",
      message: `${operationId} is not included in the Stage 2 first-slice Toss read-only connector scope.`
    });
  }

  let path: string = endpoint.path;
  for (const [key, value] of Object.entries(pathParams)) {
    path = path.replace(`{${key}}`, encodeURIComponent(value));
  }

  return {
    operationId,
    method: endpoint.method,
    path,
    accountScoped: endpoint.accountScoped
  };
}

function unavailableResult(): never {
  throw new TossReadonlyConnectorError({
    status: 0,
    code: "not_configured",
    message: "Toss read-only connector is unavailable until credentials are configured."
  });
}

export function createUnavailableTossReadonlyConnector(): TossReadonlyConnector {
  return {
    async getStatus(): Promise<TossReadonlyConnectorStatus> {
      return statusFor(
        "not_configured",
        "not_configured",
        "Toss Invest read-only connector is not configured. Official API scope is wired but no credentials are stored."
      );
    },
    getToolContract: toolContract,
    async listAccounts(): Promise<TossConnectorResult<TossAccount[]>> {
      return unavailableResult();
    },
    async getHoldings(): Promise<TossConnectorResult<TossHoldingsOverview>> {
      return unavailableResult();
    },
    async getCurrentPrices(): Promise<TossConnectorResult<TossQuote[]>> {
      return unavailableResult();
    },
    async getOrderbookSummary(): Promise<TossConnectorResult<TossOrderbookSummary>> {
      return unavailableResult();
    },
    async getExchangeRate(): Promise<TossConnectorResult<TossExchangeRate>> {
      return unavailableResult();
    },
    async getMarketCalendar(): Promise<TossConnectorResult<TossMarketCalendar>> {
      return unavailableResult();
    },
    async getStockWarnings(): Promise<TossConnectorResult<TossStockWarning[]>> {
      return unavailableResult();
    }
  };
}

export type MockTossReadonlyConnectorOptions = {
  clientId: string;
  clientSecret: string;
  accessToken: string;
};

export function createMockTossReadonlyConnector(_options: MockTossReadonlyConnectorOptions): TossReadonlyConnector {
  return {
    async getStatus(): Promise<TossReadonlyConnectorStatus> {
      return statusFor(
        "mock_replay",
        "ok",
        "Toss Invest read-only connector is available through mock replay fixtures only."
      );
    },
    getToolContract: toolContract,
    async listAccounts(): Promise<TossConnectorResult<TossAccount[]>> {
      return {
        data: [
          {
            accountSeq: 321,
            maskedAccountNo: "********9012",
            accountType: { value: "BROKERAGE", known: true }
          }
        ],
        rateLimit: {}
      };
    },
    async getHoldings(): Promise<TossConnectorResult<TossHoldingsOverview>> {
      return unavailableResult();
    },
    async getCurrentPrices(): Promise<TossConnectorResult<TossQuote[]>> {
      return unavailableResult();
    },
    async getOrderbookSummary(): Promise<TossConnectorResult<TossOrderbookSummary>> {
      return unavailableResult();
    },
    async getExchangeRate(): Promise<TossConnectorResult<TossExchangeRate>> {
      return unavailableResult();
    },
    async getMarketCalendar(): Promise<TossConnectorResult<TossMarketCalendar>> {
      return unavailableResult();
    },
    async getStockWarnings(): Promise<TossConnectorResult<TossStockWarning[]>> {
      return unavailableResult();
    }
  };
}
