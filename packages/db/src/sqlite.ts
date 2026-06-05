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
  close(): void;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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
  return {
    id: asString(row.id),
    mode: "mock_replay",
    status: asString(row.status) as TossReadonlyStoredSyncLog["status"],
    startedAt: asString(row.started_at),
    finishedAt: asString(row.finished_at),
    message: asString(row.message),
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

export function createGaemiGuardDatabase(options: CreateDatabaseOptions): GaemiGuardDatabase {
  mkdirSync(options.dataDir, { recursive: true });

  const databasePath = path.join(options.dataDir, "gaemiguard.sqlite");
  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");

  for (const migration of migrations) {
    database.exec(migration);
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

        database
          .prepare(
            `INSERT INTO toss_sync_logs
              (id, mode, status, started_at, finished_at, message, account_count, holding_count, quote_count,
               orderbook_count, exchange_rate_count, market_calendar_count, stock_warning_count)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            snapshot.syncLog.id,
            snapshot.syncLog.mode,
            snapshot.syncLog.status,
            snapshot.syncLog.startedAt,
            snapshot.syncLog.finishedAt,
            snapshot.syncLog.message,
            snapshot.syncLog.accountCount,
            snapshot.syncLog.holdingCount,
            snapshot.syncLog.quoteCount,
            snapshot.syncLog.orderbookCount,
            snapshot.syncLog.exchangeRateCount,
            snapshot.syncLog.marketCalendarCount,
            snapshot.syncLog.stockWarningCount
          );

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

    async getFreshnessStatus(request: TossReadonlySnapshotFreshnessRequest = {}): Promise<TossReadonlySnapshotFreshness> {
      const staleAfterSeconds = request.staleAfterSeconds ?? 300;
      const now = request.now ?? new Date().toISOString();
      const latest = database
        .prepare("SELECT * FROM toss_sync_logs WHERE status = 'succeeded' ORDER BY finished_at DESC LIMIT 1")
        .get() as Row | undefined;

      if (!latest) {
        return {
          mode: "mock_replay",
          status: "never_synced",
          source: "mock_replay_snapshot",
          staleAfterSeconds,
          accountCount: 0,
          holdingCount: 0,
          quoteCount: 0,
          orderbookCount: 0,
          exchangeRateCount: 0,
          marketCalendarCount: 0,
          stockWarningCount: 0,
          rateLimitScopes: [],
          message: "No Toss read-only mock replay snapshot sync has completed."
        };
      }

      const syncLog = mapTossSyncLog(latest);
      const ageSeconds = Math.max(0, Math.floor((Date.parse(now) - Date.parse(syncLog.finishedAt)) / 1000));
      const status: TossReadonlySnapshotFreshness["status"] =
        ageSeconds <= staleAfterSeconds ? "fresh" : "stale";
      const rateLimitRows = database
        .prepare("SELECT scope FROM toss_rate_limit_metadata ORDER BY scope ASC")
        .all() as Row[];

      return {
        mode: "mock_replay",
        status,
        source: "mock_replay_snapshot",
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
        message:
          status === "fresh"
            ? "Mock replay Toss read-only snapshots are fresh."
            : "Mock replay Toss read-only snapshots are stale."
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

    close(): void {
      database.close();
    }
  };
}
