import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type {
  AgentName,
  AgentRunBundle,
  AgentRunEvent,
  AgentRunEventType,
  AgentRunStatus,
  AgentRunSummary,
  ArtifactKind,
  ArtifactRecord,
  BrokerAccount,
  BrokerFreshness,
  InvestmentMemoryJournalInput,
  InvestmentMemoryRecord,
  InvestmentMemoryRecallRequest,
  InvestmentMemoryRecallResult,
  InvestmentMemoryRepository,
  InvestmentMemoryRuleInput,
  InvestmentMemorySource,
  InvestmentMemoryThesisInput,
  ManualPortfolioCashBalance,
  ManualPortfolioCashBalanceInput,
  ManualPortfolioHolding,
  ManualPortfolioHoldingInput,
  ManualPortfolioRepository,
  ManualPortfolioSnapshot,
  ManualPortfolioWatchlistInput,
  ManualPortfolioWatchlistItem,
  PermissionMode,
  TossExchangeRate,
  TossMarketCalendar,
  TossOrderbookSummary,
  TossQuote,
  TossReadonlySnapshotBundle,
  TossReadonlySnapshotFreshness,
  TossReadonlySnapshotFreshnessRequest,
  TossReadonlySnapshotRepository,
  TossReadonlySnapshotWrite,
  TossReadonlySyncFailureMetadata,
  TossReadonlySyncMode,
  TossReadonlyStoredAccount,
  TossReadonlyStoredHoldingsSnapshot,
  TossReadonlyStoredRateLimitMetadata,
  TossReadonlyStoredStockWarningSnapshot,
  TossReadonlyStoredSyncLog,
  TossStage2ReadonlyDataOperationId
} from "@gaemiguard/shared";
import { migrations } from "./schema";

type Row = Record<string, unknown>;

export type CreateDatabaseOptions = {
  dataDir: string;
};

export type GaemiGuardDatabase = {
  runs: {
    save(bundle: AgentRunBundle): Promise<void>;
    findById(id: string): Promise<AgentRunBundle | null>;
    listRecent(limit: number): Promise<AgentRunSummary[]>;
  };
  tossReadonlySnapshots: TossReadonlySnapshotRepository;
  manualPortfolio: ManualPortfolioRepository;
  investmentMemory: InvestmentMemoryRepository;
  close(): void;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseJson<T>(value: unknown): T {
  return JSON.parse(asString(value)) as T;
}

function mapRun(row: Row): AgentRunSummary {
  const finishedAt = row.finished_at === null ? undefined : asString(row.finished_at);
  return {
    id: asString(row.id),
    status: asString(row.status) as AgentRunStatus,
    userMessage: asString(row.user_message),
    permissionMode: asString(row.permission_mode) as PermissionMode,
    startedAt: asString(row.started_at),
    ...(finishedAt ? { finishedAt } : {}),
    answer: asString(row.answer)
  };
}

function mapEvent(row: Row): AgentRunEvent {
  const metadataJson = row.metadata_json === null ? undefined : asString(row.metadata_json);
  return {
    id: asString(row.id),
    runId: asString(row.run_id),
    agent: asString(row.agent) as AgentName,
    type: asString(row.type) as AgentRunEventType,
    message: asString(row.message),
    createdAt: asString(row.created_at),
    ...(metadataJson ? { metadata: JSON.parse(metadataJson) as Record<string, unknown> } : {})
  };
}

function mapArtifact(row: Row): ArtifactRecord {
  return {
    id: asString(row.id),
    runId: asString(row.run_id),
    kind: asString(row.kind) as ArtifactKind,
    title: asString(row.title),
    path: asString(row.path),
    createdAt: asString(row.created_at)
  };
}

function mapTossAccount(row: Row): TossReadonlyStoredAccount {
  return {
    accountRef: asString(row.account_ref),
    maskedAccountNo: asString(row.masked_account_no),
    accountType: parseJson(row.account_type_json),
    lastSyncedAt: asString(row.last_synced_at)
  };
}

function mapTossHoldings(row: Row): TossReadonlyStoredHoldingsSnapshot {
  return {
    snapshotId: asString(row.snapshot_id),
    accountRef: asString(row.account_ref),
    syncedAt: asString(row.synced_at),
    overview: parseJson(row.overview_json)
  };
}

function mapTossQuote(row: Row): TossQuote & { syncedAt: string } {
  return {
    ...parseJson<TossQuote>(row.quote_json),
    syncedAt: asString(row.synced_at)
  };
}

function mapTossOrderbook(row: Row): TossOrderbookSummary & { syncedAt: string } {
  return {
    ...parseJson<TossOrderbookSummary>(row.summary_json),
    syncedAt: asString(row.synced_at)
  };
}

function mapTossExchangeRate(row: Row): TossExchangeRate & { syncedAt: string } {
  return {
    ...parseJson<TossExchangeRate>(row.rate_json),
    syncedAt: asString(row.synced_at)
  };
}

function mapTossMarketCalendar(row: Row): TossMarketCalendar & { syncedAt: string } {
  return {
    ...parseJson<TossMarketCalendar>(row.calendar_json),
    syncedAt: asString(row.synced_at)
  };
}

function mapTossStockWarning(row: Row): TossReadonlyStoredStockWarningSnapshot {
  return {
    snapshotId: asString(row.snapshot_id),
    symbol: asString(row.symbol),
    syncedAt: asString(row.synced_at),
    warnings: parseJson(row.warnings_json)
  };
}

function mapTossSyncLog(row: Row): TossReadonlyStoredSyncLog {
  const failureCategory = row.failure_category === null ? undefined : asString(row.failure_category);
  const safeErrorCode = row.safe_error_code === null ? undefined : asString(row.safe_error_code);
  const safeRequestId = row.safe_request_id === null ? undefined : asString(row.safe_request_id);
  const retryAfterSeconds = asOptionalNumber(row.retry_after_seconds);
  const nextRetryAt = row.next_retry_at === null ? undefined : asString(row.next_retry_at);

  return {
    id: asString(row.id),
    mode: asString(row.mode) as TossReadonlyStoredSyncLog["mode"],
    status: asString(row.status) as TossReadonlyStoredSyncLog["status"],
    startedAt: asString(row.started_at),
    finishedAt: asString(row.finished_at),
    message: asString(row.message),
    ...(failureCategory ? { failureCategory: failureCategory as NonNullable<TossReadonlyStoredSyncLog["failureCategory"]> } : {}),
    ...(safeErrorCode ? { safeErrorCode } : {}),
    ...(safeRequestId ? { safeRequestId } : {}),
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
    ...(nextRetryAt ? { nextRetryAt } : {}),
    accountCount: asNumber(row.account_count),
    holdingCount: asNumber(row.holding_count),
    quoteCount: asNumber(row.quote_count),
    orderbookCount: asNumber(row.orderbook_count),
    exchangeRateCount: asNumber(row.exchange_rate_count),
    marketCalendarCount: asNumber(row.market_calendar_count),
    stockWarningCount: asNumber(row.stock_warning_count)
  };
}

function mapTossRateLimit(row: Row): TossReadonlyStoredRateLimitMetadata {
  return {
    scope: asString(row.scope) as TossStage2ReadonlyDataOperationId,
    capturedAt: asString(row.captured_at),
    metadata: parseJson(row.metadata_json)
  };
}

function pairKey(rate: TossExchangeRate): string {
  return `${rate.baseCurrency.value}-${rate.quoteCurrency.value}`;
}

function sourceFromMode(mode: TossReadonlySyncMode): "mock_replay_snapshot" | "production_snapshot" {
  return mode === "mock_replay" ? "mock_replay_snapshot" : "production_snapshot";
}

function modeLabel(mode: TossReadonlySyncMode): string {
  return mode === "mock_replay" ? "Mock replay" : "Production";
}

function failureMetadataFromSyncLog(syncLog: TossReadonlyStoredSyncLog): TossReadonlySyncFailureMetadata | undefined {
  if (syncLog.status !== "failed" || !syncLog.failureCategory) {
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

function ensureColumn(database: Database.Database, table: string, column: string, definition: string): void {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!rows.some((row) => row.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}

const MANUAL_ACCOUNT: BrokerAccount = {
  accountRef: "manual:default",
  displayLabel: "Manual portfolio",
  providerId: "manual",
  source: "manual_input",
  accountType: "MANUAL"
};

function optionalDbString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const output = asString(value);
  return output ? output : undefined;
}

function mapManualWatchlistItem(row: Row): ManualPortfolioWatchlistItem {
  const name = optionalDbString(row.name);
  return {
    symbol: asString(row.symbol),
    market: asString(row.market),
    source: "manual_input",
    updatedAt: asString(row.updated_at),
    ...(name ? { name } : {})
  };
}

function mapManualHolding(row: Row): ManualPortfolioHolding {
  const name = optionalDbString(row.name);
  const averageCost = optionalDbString(row.average_cost);
  return {
    accountRef: "manual:default",
    symbol: asString(row.symbol),
    market: asString(row.market),
    currency: asString(row.currency),
    quantity: asString(row.quantity),
    source: "manual_input",
    updatedAt: asString(row.updated_at),
    ...(name ? { name } : {}),
    ...(averageCost ? { averageCost } : {})
  };
}

function mapManualCashBalance(row: Row): ManualPortfolioCashBalance {
  return {
    accountRef: "manual:default",
    currency: asString(row.currency),
    amount: asString(row.amount),
    source: "manual_input",
    updatedAt: asString(row.updated_at)
  };
}

function redactMemoryText(value: string): string {
  return value
    .replace(/fixture-private-value-[A-Za-z0-9-]+/g, "[redacted]")
    .replace(/fixture-account-ref-[A-Za-z0-9-]+/g, "[redacted]")
    .replace(/fixture-order-id-[A-Za-z0-9-]+/g, "[redacted]")
    .replace(/\b\d{9,}\b/g, "[redacted]");
}

function sanitizeMemorySource(source: InvestmentMemorySource): InvestmentMemorySource {
  return {
    ...source,
    label: redactMemoryText(source.label),
    freshness: {
      ...source.freshness,
      message: redactMemoryText(source.freshness.message)
    }
  };
}

function mapInvestmentMemoryRecord(row: Row): InvestmentMemoryRecord {
  const symbol = optionalDbString(row.symbol);
  return {
    id: asString(row.id),
    kind: asString(row.kind) as InvestmentMemoryRecord["kind"],
    ...(symbol ? { symbol } : {}),
    title: asString(row.title),
    body: asString(row.body),
    version: asNumber(row.version),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
    source: parseJson(row.source_json)
  };
}

function canUseInvestmentMemorySource(record: InvestmentMemoryRecord): boolean {
  const freshness = record.source.freshness;
  if (!freshness || !freshness.source || !freshness.status) {
    return false;
  }
  return freshness.status === "fresh" || freshness.status === "local_manual";
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

function latestUpdatedAt(rows: Array<{ updatedAt: string }>): string | undefined {
  return rows.map((row) => row.updatedAt).filter(Boolean).sort().at(-1);
}

export function createGaemiGuardDatabase(options: CreateDatabaseOptions): GaemiGuardDatabase {
  mkdirSync(options.dataDir, { recursive: true });

  const databasePath = path.join(options.dataDir, "gaemiguard.sqlite");
  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");

  for (const migration of migrations) {
    database.exec(migration);
  }
  ensureColumn(database, "toss_sync_logs", "failure_category", "failure_category TEXT");
  ensureColumn(database, "toss_sync_logs", "safe_error_code", "safe_error_code TEXT");
  ensureColumn(database, "toss_sync_logs", "safe_request_id", "safe_request_id TEXT");
  ensureColumn(database, "toss_sync_logs", "retry_after_seconds", "retry_after_seconds INTEGER");
  ensureColumn(database, "toss_sync_logs", "next_retry_at", "next_retry_at TEXT");

  const syncLogStatement = database.prepare(
    `INSERT INTO toss_sync_logs
      (id, mode, status, started_at, finished_at, message, failure_category, safe_error_code, safe_request_id,
       retry_after_seconds, next_retry_at, account_count, holding_count, quote_count, orderbook_count,
       exchange_rate_count, market_calendar_count, stock_warning_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  function insertSyncLog(syncLog: TossReadonlyStoredSyncLog): void {
    syncLogStatement.run(
      syncLog.id,
      syncLog.mode,
      syncLog.status,
      syncLog.startedAt,
      syncLog.finishedAt,
      syncLog.message,
      syncLog.failureCategory ?? null,
      syncLog.safeErrorCode ?? null,
      syncLog.safeRequestId ?? null,
      syncLog.retryAfterSeconds ?? null,
      syncLog.nextRetryAt ?? null,
      syncLog.accountCount,
      syncLog.holdingCount,
      syncLog.quoteCount,
      syncLog.orderbookCount,
      syncLog.exchangeRateCount,
      syncLog.marketCalendarCount,
      syncLog.stockWarningCount
    );
  }

  const tossReadonlySnapshots: TossReadonlySnapshotRepository = {
    async saveSyncSnapshot(snapshot: TossReadonlySnapshotWrite): Promise<void> {
      database.exec("BEGIN");
      try {
        const accountStatement = database.prepare(
          `INSERT OR REPLACE INTO toss_readonly_accounts
            (account_ref, masked_account_no, account_type_json, last_synced_at)
           VALUES (?, ?, ?, ?)`
        );
        for (const account of snapshot.accounts) {
          accountStatement.run(
            account.accountRef,
            account.maskedAccountNo,
            JSON.stringify(account.accountType),
            account.lastSyncedAt
          );
        }

        const holdingsStatement = database.prepare(
          `INSERT OR REPLACE INTO toss_holdings_snapshots
            (snapshot_id, account_ref, synced_at, overview_json)
           VALUES (?, ?, ?, ?)`
        );
        for (const holdings of snapshot.holdings) {
          holdingsStatement.run(
            holdings.snapshotId,
            holdings.accountRef,
            holdings.syncedAt,
            JSON.stringify(holdings.overview)
          );
        }

        const quoteStatement = database.prepare(
          `INSERT OR REPLACE INTO toss_quote_snapshots
            (symbol, synced_at, quote_json)
           VALUES (?, ?, ?)`
        );
        for (const quote of snapshot.quotes) {
          const { syncedAt: _syncedAt, ...storedQuote } = quote;
          quoteStatement.run(quote.symbol, quote.syncedAt, JSON.stringify(storedQuote));
        }

        const orderbookStatement = database.prepare(
          `INSERT OR REPLACE INTO toss_orderbook_summary_snapshots
            (symbol, synced_at, summary_json)
           VALUES (?, ?, ?)`
        );
        for (const orderbook of snapshot.orderbooks) {
          const { syncedAt: _syncedAt, ...storedOrderbook } = orderbook;
          orderbookStatement.run(orderbook.symbol, orderbook.syncedAt, JSON.stringify(storedOrderbook));
        }

        const exchangeRateStatement = database.prepare(
          `INSERT OR REPLACE INTO toss_exchange_rate_snapshots
            (pair, synced_at, rate_json)
           VALUES (?, ?, ?)`
        );
        for (const exchangeRate of snapshot.exchangeRates) {
          const { syncedAt: _syncedAt, ...storedRate } = exchangeRate;
          exchangeRateStatement.run(pairKey(exchangeRate), exchangeRate.syncedAt, JSON.stringify(storedRate));
        }

        const marketCalendarStatement = database.prepare(
          `INSERT OR REPLACE INTO toss_market_calendar_snapshots
            (market, calendar_date, synced_at, calendar_json)
           VALUES (?, ?, ?, ?)`
        );
        for (const calendar of snapshot.marketCalendars) {
          const { syncedAt: _syncedAt, ...storedCalendar } = calendar;
          marketCalendarStatement.run(calendar.market, calendar.today.date, calendar.syncedAt, JSON.stringify(storedCalendar));
        }

        const warningStatement = database.prepare(
          `INSERT OR REPLACE INTO toss_stock_warning_snapshots
            (symbol, snapshot_id, synced_at, warnings_json)
           VALUES (?, ?, ?, ?)`
        );
        for (const warning of snapshot.stockWarnings) {
          warningStatement.run(warning.symbol, warning.snapshotId, warning.syncedAt, JSON.stringify(warning.warnings));
        }

        insertSyncLog(snapshot.syncLog);

        const rateLimitStatement = database.prepare(
          `INSERT OR REPLACE INTO toss_rate_limit_metadata
            (scope, captured_at, metadata_json)
           VALUES (?, ?, ?)`
        );
        for (const rateLimit of snapshot.rateLimits) {
          rateLimitStatement.run(rateLimit.scope, rateLimit.capturedAt, JSON.stringify(rateLimit.metadata));
        }

        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },

    async saveSyncFailure(syncLog: TossReadonlyStoredSyncLog): Promise<void> {
      insertSyncLog(syncLog);
    },

    async getFreshnessStatus(request: TossReadonlySnapshotFreshnessRequest = {}): Promise<TossReadonlySnapshotFreshness> {
      const staleAfterSeconds = request.staleAfterSeconds ?? 300;
      const now = request.now ?? new Date().toISOString();
      const modeFilter = request.mode ? " AND mode = ?" : "";
      const latest = database
        .prepare(`SELECT * FROM toss_sync_logs WHERE status = 'succeeded'${modeFilter} ORDER BY finished_at DESC LIMIT 1`)
        .get(...(request.mode ? [request.mode] : [])) as Row | undefined;
      const latestFailureRow = database
        .prepare(`SELECT * FROM toss_sync_logs WHERE status = 'failed'${modeFilter} ORDER BY finished_at DESC LIMIT 1`)
        .get(...(request.mode ? [request.mode] : [])) as Row | undefined;
      const latestFailureLog = latestFailureRow ? mapTossSyncLog(latestFailureRow) : undefined;
      const latestFailure = latestFailureLog ? failureMetadataFromSyncLog(latestFailureLog) : undefined;

      if (!latest) {
        const mode = request.mode ?? latestFailureLog?.mode ?? "mock_replay";
        return {
          mode,
          status: latestFailure ? "failed" : "never_synced",
          source: sourceFromMode(mode),
          staleAfterSeconds,
          accountCount: 0,
          holdingCount: 0,
          quoteCount: 0,
          orderbookCount: 0,
          exchangeRateCount: 0,
          marketCalendarCount: 0,
          stockWarningCount: 0,
          rateLimitScopes: [],
          ...(latestFailure ? { latestFailure } : {}),
          ...(latestFailure?.nextRetryAt ? { nextRetryAt: latestFailure.nextRetryAt } : {}),
          message: latestFailure
            ? `${modeLabel(mode)} Toss read-only snapshot sync failed.`
            : `No ${modeLabel(mode).toLowerCase()} Toss read-only snapshot sync has completed.`
        };
      }

      const syncLog = mapTossSyncLog(latest);
      const ageSeconds = Math.max(0, Math.floor((Date.parse(now) - Date.parse(syncLog.finishedAt)) / 1000));
      const baseStatus: TossReadonlySnapshotFreshness["status"] =
        ageSeconds <= staleAfterSeconds ? "fresh" : "stale";
      const failureAfterSuccess =
        latestFailureLog !== undefined && latestFailureLog.finishedAt.localeCompare(syncLog.finishedAt) >= 0;
      const status: TossReadonlySnapshotFreshness["status"] = failureAfterSuccess ? "failed" : baseStatus;
      const rateLimitRows = database
        .prepare("SELECT scope FROM toss_rate_limit_metadata ORDER BY scope ASC")
        .all() as Row[];

      return {
        mode: syncLog.mode,
        status,
        source: sourceFromMode(syncLog.mode),
        lastSuccessfulSyncAt: syncLog.finishedAt,
        ageSeconds,
        staleAfterSeconds,
        accountCount: syncLog.accountCount,
        holdingCount: syncLog.holdingCount,
        quoteCount: syncLog.quoteCount,
        orderbookCount: syncLog.orderbookCount,
        exchangeRateCount: syncLog.exchangeRateCount,
        marketCalendarCount: syncLog.marketCalendarCount,
        stockWarningCount: syncLog.stockWarningCount,
        rateLimitScopes: rateLimitRows.map((row) => asString(row.scope) as TossStage2ReadonlyDataOperationId),
        ...(latestFailure ? { latestFailure } : {}),
        ...(latestFailure?.nextRetryAt ? { nextRetryAt: latestFailure.nextRetryAt } : {}),
        message:
          status === "failed"
            ? `${modeLabel(syncLog.mode)} Toss read-only sync failed after the last successful snapshot.`
            : status === "fresh"
              ? `${modeLabel(syncLog.mode)} Toss read-only snapshots are fresh.`
              : `${modeLabel(syncLog.mode)} Toss read-only snapshots are stale.`
      };
    },

    async readLatest(): Promise<TossReadonlySnapshotBundle> {
      const accounts = database
        .prepare("SELECT * FROM toss_readonly_accounts ORDER BY account_ref ASC")
        .all() as Row[];
      const holdings = database
        .prepare("SELECT * FROM toss_holdings_snapshots ORDER BY synced_at DESC, snapshot_id ASC")
        .all() as Row[];
      const quotes = database
        .prepare("SELECT * FROM toss_quote_snapshots ORDER BY symbol ASC")
        .all() as Row[];
      const orderbooks = database
        .prepare("SELECT * FROM toss_orderbook_summary_snapshots ORDER BY symbol ASC")
        .all() as Row[];
      const exchangeRates = database
        .prepare("SELECT * FROM toss_exchange_rate_snapshots ORDER BY pair ASC")
        .all() as Row[];
      const marketCalendars = database
        .prepare("SELECT * FROM toss_market_calendar_snapshots ORDER BY market ASC")
        .all() as Row[];
      const stockWarnings = database
        .prepare("SELECT * FROM toss_stock_warning_snapshots ORDER BY symbol ASC")
        .all() as Row[];
      const syncLogs = database
        .prepare("SELECT * FROM toss_sync_logs ORDER BY finished_at DESC, id ASC")
        .all() as Row[];
      const rateLimits = database
        .prepare("SELECT * FROM toss_rate_limit_metadata ORDER BY scope ASC")
        .all() as Row[];

      return {
        accounts: accounts.map(mapTossAccount),
        holdings: holdings.map(mapTossHoldings),
        quotes: quotes.map(mapTossQuote),
        orderbooks: orderbooks.map(mapTossOrderbook),
        exchangeRates: exchangeRates.map(mapTossExchangeRate),
        marketCalendars: marketCalendars.map(mapTossMarketCalendar),
        stockWarnings: stockWarnings.map(mapTossStockWarning),
        syncLogs: syncLogs.map(mapTossSyncLog),
        rateLimits: rateLimits.map(mapTossRateLimit)
      };
    }
  };

  async function readManualPortfolioSnapshot(): Promise<ManualPortfolioSnapshot> {
    const watchlistRows = database
      .prepare("SELECT * FROM manual_watchlist_items ORDER BY symbol ASC")
      .all() as Row[];
    const holdingRows = database.prepare("SELECT * FROM manual_holdings ORDER BY symbol ASC").all() as Row[];
    const cashRows = database.prepare("SELECT * FROM manual_cash_balances ORDER BY currency ASC").all() as Row[];
    const watchlist = watchlistRows.map(mapManualWatchlistItem);
    const holdings = holdingRows.map(mapManualHolding);
    const cashBalances = cashRows.map(mapManualCashBalance);
    const lastUpdatedAt = latestUpdatedAt([...watchlist, ...holdings, ...cashBalances]);

    return {
      account: MANUAL_ACCOUNT,
      watchlist,
      holdings,
      cashBalances,
      freshness: manualFreshness(lastUpdatedAt)
    };
  }

  const manualPortfolio: ManualPortfolioRepository = {
    async upsertWatchlistItem(input: ManualPortfolioWatchlistInput): Promise<ManualPortfolioSnapshot> {
      database
        .prepare(
          `INSERT OR REPLACE INTO manual_watchlist_items
            (symbol, market, name, note, updated_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(input.symbol, input.market, input.name ?? null, null, new Date().toISOString());
      return readManualPortfolioSnapshot();
    },

    async upsertHolding(input: ManualPortfolioHoldingInput): Promise<ManualPortfolioSnapshot> {
      database
        .prepare(
          `INSERT OR REPLACE INTO manual_holdings
            (symbol, market, currency, name, quantity, average_cost, note, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          input.symbol,
          input.market,
          input.currency,
          input.name ?? null,
          input.quantity,
          input.averageCost ?? null,
          null,
          new Date().toISOString()
        );
      return readManualPortfolioSnapshot();
    },

    async upsertCashBalance(input: ManualPortfolioCashBalanceInput): Promise<ManualPortfolioSnapshot> {
      database
        .prepare(
          `INSERT OR REPLACE INTO manual_cash_balances
            (currency, amount, updated_at)
           VALUES (?, ?, ?)`
        )
        .run(input.currency, input.amount, new Date().toISOString());
      return readManualPortfolioSnapshot();
    },

    readSnapshot: readManualPortfolioSnapshot
  };

  function nextMemoryVersion(identityKey: string): { version: number; createdAt: string } {
    const latest = database
      .prepare("SELECT version, created_at FROM investment_memory_records WHERE identity_key = ? ORDER BY version DESC LIMIT 1")
      .get(identityKey) as Row | undefined;
    if (!latest) {
      return { version: 1, createdAt: new Date().toISOString() };
    }
    return {
      version: asNumber(latest.version) + 1,
      createdAt: asString(latest.created_at)
    };
  }

  function insertMemoryRecord(input: {
    id: string;
    kind: InvestmentMemoryRecord["kind"];
    identityKey: string;
    symbol?: string;
    title: string;
    body: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    source: InvestmentMemorySource;
  }): InvestmentMemoryRecord {
    const title = redactMemoryText(input.title);
    const body = redactMemoryText(input.body);
    const source = sanitizeMemorySource(input.source);
    database
      .prepare(
        `INSERT INTO investment_memory_records
          (id, kind, identity_key, symbol, title, body, version, created_at, updated_at, source_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.id,
        input.kind,
        input.identityKey,
        input.symbol ?? null,
        title,
        body,
        input.version,
        input.createdAt,
        input.updatedAt,
        JSON.stringify(source)
      );

    return {
      id: input.id,
      kind: input.kind,
      ...(input.symbol ? { symbol: input.symbol } : {}),
      title,
      body,
      version: input.version,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      source
    };
  }

  const investmentMemory: InvestmentMemoryRepository = {
    async upsertThesis(input: InvestmentMemoryThesisInput): Promise<InvestmentMemoryRecord> {
      const identityKey = `thesis:${input.symbol}`;
      const version = nextMemoryVersion(identityKey);
      const updatedAt = new Date().toISOString();
      return insertMemoryRecord({
        id: `memory_${crypto.randomUUID()}`,
        kind: "thesis",
        identityKey,
        symbol: input.symbol,
        title: input.title,
        body: input.body,
        version: version.version,
        createdAt: version.createdAt,
        updatedAt,
        source: input.source
      });
    },

    async upsertRule(input: InvestmentMemoryRuleInput): Promise<InvestmentMemoryRecord> {
      const identityKey = `rule:${input.name}`;
      const version = nextMemoryVersion(identityKey);
      const updatedAt = new Date().toISOString();
      return insertMemoryRecord({
        id: `memory_${crypto.randomUUID()}`,
        kind: "rule",
        identityKey,
        title: input.name,
        body: input.body,
        version: version.version,
        createdAt: version.createdAt,
        updatedAt,
        source: input.source
      });
    },

    async addJournalEntry(input: InvestmentMemoryJournalInput): Promise<InvestmentMemoryRecord> {
      const updatedAt = new Date().toISOString();
      return insertMemoryRecord({
        id: `memory_${crypto.randomUUID()}`,
        kind: "journal",
        identityKey: `journal:${crypto.randomUUID()}`,
        ...(input.symbol ? { symbol: input.symbol } : {}),
        title: "Journal entry",
        body: input.body,
        version: 1,
        createdAt: updatedAt,
        updatedAt,
        source: input.source
      });
    },

    async recall(request: InvestmentMemoryRecallRequest = {}): Promise<InvestmentMemoryRecallResult> {
      const limit = request.limit ?? 20;
      const rows = database
        .prepare(
          `SELECT * FROM investment_memory_records
           WHERE symbol = ? OR symbol IS NULL
           ORDER BY
             CASE kind WHEN 'thesis' THEN 1 WHEN 'rule' THEN 2 ELSE 3 END ASC,
             updated_at DESC
           LIMIT ?`
        )
        .all(request.symbol ?? "", limit) as Row[];
      const records = rows.map(mapInvestmentMemoryRecord);
      const items: InvestmentMemoryRecord[] = [];
      const skipped: InvestmentMemoryRecallResult["skipped"] = [];

      for (const record of records) {
        if (canUseInvestmentMemorySource(record) || request.includeStale) {
          items.push(record);
        } else {
          skipped.push({
            id: record.id,
            reason: record.source ? "stale_source" : "missing_source"
          });
        }
      }

      return { items, skipped };
    }
  };

  return {
    runs: {
      async save(bundle: AgentRunBundle): Promise<void> {
        database.exec("BEGIN");
        try {
          database
            .prepare(
              `INSERT OR REPLACE INTO agent_runs
                (id, status, user_message, permission_mode, started_at, finished_at, answer)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
            .run(
              bundle.run.id,
              bundle.run.status,
              bundle.run.userMessage,
              bundle.run.permissionMode,
              bundle.run.startedAt,
              bundle.run.finishedAt ?? null,
              bundle.run.answer
            );

          database.prepare("DELETE FROM agent_run_events WHERE run_id = ?").run(bundle.run.id);
          database.prepare("DELETE FROM artifacts WHERE run_id = ?").run(bundle.run.id);

          const eventStatement = database.prepare(
            `INSERT INTO agent_run_events
              (id, run_id, agent, type, message, created_at, metadata_json)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          );
          for (const item of bundle.timeline) {
            eventStatement.run(
              item.id,
              item.runId,
              item.agent,
              item.type,
              item.message,
              item.createdAt,
              item.metadata ? JSON.stringify(item.metadata) : null
            );
          }

          const artifactStatement = database.prepare(
            `INSERT INTO artifacts
              (id, run_id, kind, title, path, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          );
          for (const item of bundle.artifacts) {
            artifactStatement.run(item.id, item.runId, item.kind, item.title, item.path, item.createdAt);
          }

          database.exec("COMMIT");
        } catch (error) {
          database.exec("ROLLBACK");
          throw error;
        }
      },

      async findById(id: string): Promise<AgentRunBundle | null> {
        const run = database.prepare("SELECT * FROM agent_runs WHERE id = ?").get(id) as Row | undefined;
        if (!run) {
          return null;
        }

        const timeline = database
          .prepare("SELECT * FROM agent_run_events WHERE run_id = ? ORDER BY created_at ASC, id ASC")
          .all(id) as Row[];
        const artifacts = database
          .prepare("SELECT * FROM artifacts WHERE run_id = ? ORDER BY created_at ASC, id ASC")
          .all(id) as Row[];

        return {
          run: mapRun(run),
          timeline: timeline.map(mapEvent),
          artifacts: artifacts.map(mapArtifact)
        };
      },

      async listRecent(limit: number): Promise<AgentRunSummary[]> {
        const rows = database
          .prepare("SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT ?")
          .all(limit) as Row[];
        return rows.map(mapRun);
      }
    },
    tossReadonlySnapshots,
    manualPortfolio,
    investmentMemory,

    close(): void {
      database.close();
    }
  };
}
