import { mkdirSync } from "node:fs";
import path from "node:path";
import cors from "@fastify/cors";
import {
  FileArtifactStore,
  InMemoryTossTokenCache,
  TossInvestReadonlyClient,
  createDefaultTossCredentialStore,
  createManualPortfolioBrokerAdapter,
  createCommanderRuntime,
  createTossBrokerAdapter,
  createTossCredentialProviderFromStore,
  runTossReadonlySyncJob,
  syncMockTossReadonlySnapshots,
  type TossCredentialStore
} from "@gaemiguard/core";
import { createGaemiGuardDatabase, type GaemiGuardDatabase } from "@gaemiguard/db";
import type {
  CommanderContext,
  BrokerAdapter,
  BrokerAdapterStatus,
  HealthCheck,
  PermissionMode,
  TossReadonlyConnector,
  TossReadonlySnapshotFreshness,
  TossReadonlySnapshotRepository
} from "@gaemiguard/shared";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";

export type BuildApiAppOptions = {
  dataDir: string;
  tossReadOnlyConnector?: TossReadonlyConnector;
  tossCredentialStore?: TossCredentialStore;
  tossTokenCache?: InMemoryTossTokenCache;
  tossReadonlyMockSync?: {
    enabled: boolean;
    symbols?: string[];
  };
  clock?: () => Date;
};

const chatSchema = z.object({
  message: z.string().min(1),
  permissionMode: z.enum(["manual", "guarded_auto", "trusted_auto", "full_access"]).default("manual"),
  context: z
    .object({
      selectedSymbol: z.string().optional(),
      selectedRange: z
        .object({
          from: z.string(),
          to: z.string()
        })
        .optional(),
      accountLabel: z.string().optional()
    })
    .optional()
});

const manualWatchlistSchema = z.object({
  symbol: z.string().min(1),
  market: z.string().min(1),
  name: z.string().min(1).optional(),
  note: z.string().min(1).optional()
});

const manualHoldingSchema = z.object({
  symbol: z.string().min(1),
  market: z.string().min(1),
  currency: z.string().min(1),
  name: z.string().min(1).optional(),
  quantity: z.string().min(1),
  averageCost: z.string().min(1).optional(),
  note: z.string().min(1).optional()
});

const manualCashSchema = z.object({
  currency: z.string().min(1),
  amount: z.string().min(1)
});

const tossCredentialSetupSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1)
});

const tossSyncSchema = z.object({
  symbols: z.array(z.string().min(1)).min(1).optional()
});

function brokerHealthStatus(statuses: BrokerAdapterStatus[]): HealthCheck["status"] {
  if (statuses.some((status) => status.status === "error")) {
    return "error";
  }
  if (statuses.some((status) => status.status === "failed")) {
    return "failed";
  }
  if (statuses.some((status) => status.status === "syncing")) {
    return "syncing";
  }
  if (statuses.some((status) => status.status === "stale")) {
    return "stale";
  }
  if (statuses.some((status) => status.status === "mock_replay")) {
    return "mock_replay";
  }
  if (statuses.some((status) => status.status === "readonly_available")) {
    return "readonly_available";
  }
  if (statuses.some((status) => status.status === "credential_configured")) {
    return "credential_configured";
  }
  if (statuses.some((status) => status.status === "not_configured")) {
    return "not_configured";
  }
  return "no_broker";
}

function brokerHealthMessage(status: HealthCheck["status"]): string {
  if (status === "failed") {
    return "A broker read-only sync failed; inspect retry metadata before relying on account facts.";
  }
  if (status === "syncing") {
    return "A broker read-only sync is currently running.";
  }
  if (status === "stale") {
    return "At least one broker adapter has stale read-only data; refresh before relying on account facts.";
  }
  if (status === "mock_replay") {
    return "Broker adapters are available through manual no-broker mode and Toss mock replay only.";
  }
  if (status === "readonly_available") {
    return "At least one broker adapter has read-only availability; order mutation remains disabled.";
  }
  if (status === "credential_configured") {
    return "Manual no-broker mode is available and Toss credentials are configured, but no fresh production sync is available yet.";
  }
  if (status === "not_configured") {
    return "Manual no-broker mode is available and broker credentials are not configured.";
  }
  return "Manual no-broker mode is available.";
}

type TossSyncState = { status: "idle" | "syncing"; startedAt?: string };

function healthStatusFromToss(
  connectorStatus: Awaited<ReturnType<TossReadonlyConnector["getStatus"]>>,
  snapshotFreshness: TossReadonlySnapshotFreshness | undefined,
  syncState: TossSyncState
): HealthCheck["status"] {
  if (connectorStatus.status === "not_configured" || connectorStatus.metadata.mode === "not_configured") {
    return "not_configured";
  }
  if (connectorStatus.metadata.mode === "mock_replay") {
    return "mock_replay";
  }
  if (syncState.status === "syncing") {
    return "syncing";
  }
  if (snapshotFreshness?.status === "fresh") {
    return "readonly_available";
  }
  if (snapshotFreshness?.status === "stale") {
    return "stale";
  }
  if (snapshotFreshness?.status === "failed") {
    return "failed";
  }
  return "credential_configured";
}

function tossHealthMessage(status: HealthCheck["status"]): string {
  if (status === "mock_replay") {
    return "Toss read-only connector is using mock replay fixtures, not a real broker connection.";
  }
  if (status === "credential_configured") {
    return "Toss credentials are configured in the credential boundary; run read-only sync before using account facts.";
  }
  if (status === "syncing") {
    return "Toss read-only sync is running behind the credential boundary.";
  }
  if (status === "readonly_available") {
    return "Toss production read-only snapshot is available; order mutation remains disabled.";
  }
  if (status === "stale") {
    return "Toss production read-only snapshot is stale; refresh before using account facts.";
  }
  if (status === "failed") {
    return "The latest Toss read-only sync failed; retry metadata is available.";
  }
  return "Toss credentials are not configured.";
}

async function healthChecks(
  tossReadOnlyConnector: TossReadonlyConnector,
  tossSnapshotReader: TossReadonlySnapshotRepository,
  brokerAdapters: BrokerAdapter[],
  syncState: TossSyncState,
  clock: () => Date
): Promise<HealthCheck[]> {
  const tossStatus = await tossReadOnlyConnector.getStatus();
  const snapshotFreshness =
    tossStatus.metadata.mode === "not_configured"
      ? undefined
      : await tossSnapshotReader.getFreshnessStatus({
          now: clock().toISOString(),
          mode: tossStatus.metadata.mode === "mock_replay" ? "mock_replay" : "production_secret_store"
        });
  const brokerStatuses = await Promise.all(brokerAdapters.map((adapter) => adapter.getStatus()));
  const brokerStatus = brokerHealthStatus(brokerStatuses);
  const tossHealthStatus = healthStatusFromToss(tossStatus, snapshotFreshness, syncState);

  return [
    {
      name: "local_api",
      status: "ok",
      message: "Fastify local API is running."
    },
    {
      name: "sqlite",
      status: "ok",
      message: "SQLite database is writable."
    },
    {
      name: "artifacts",
      status: "ok",
      message: "Artifact directory is writable."
    },
    {
      name: "commander",
      status: "ok",
      message: "Commander runtime is available."
    },
    {
      name: "broker_adapters",
      status: brokerStatus,
      message: brokerHealthMessage(brokerStatus),
      metadata: {
        adapters: brokerStatuses
      }
    },
    {
      name: "toss_read_only",
      status: tossHealthStatus,
      message: tossHealthMessage(tossHealthStatus),
      metadata: {
        ...tossStatus.metadata,
        syncState,
        ...(snapshotFreshness ? { snapshotFreshness } : {})
      }
    },
    {
      name: "sidecars",
      status: "not_configured",
      message: "MiroFish/Hermes/OpenBB sidecars are represented by deterministic stubs in Stage 1."
    },
    {
      name: "kill_switch",
      status: "ok",
      message: "Live order submission is disabled by Stage 1 policy."
    }
  ] as const;
}

export async function buildApiApp(options: BuildApiAppOptions): Promise<FastifyInstance> {
  const dataDir = options.dataDir;
  const artifactDir = path.join(dataDir, "artifacts");
  mkdirSync(artifactDir, { recursive: true });
  const tossCredentialStore = options.tossCredentialStore ?? createDefaultTossCredentialStore();
  const tossTokenCache = options.tossTokenCache ?? new InMemoryTossTokenCache();
  const tossReadOnlyConnector =
    options.tossReadOnlyConnector ??
    new TossInvestReadonlyClient({
      credentials: createTossCredentialProviderFromStore(tossCredentialStore),
      tokenCache: tossTokenCache,
      ...(options.clock ? { clock: options.clock } : {})
    });
  const clock = options.clock ?? (() => new Date());
  let tossSyncState: TossSyncState = { status: "idle" };

  const db: GaemiGuardDatabase = createGaemiGuardDatabase({ dataDir });
  if (options.tossReadonlyMockSync?.enabled) {
    await syncMockTossReadonlySnapshots({
      connector: tossReadOnlyConnector,
      repository: db.tossReadonlySnapshots,
      ...(options.tossReadonlyMockSync.symbols ? { symbols: options.tossReadonlyMockSync.symbols } : {}),
      clock
    });
  }
  const brokerAdapters: BrokerAdapter[] = [
    createManualPortfolioBrokerAdapter({ repository: db.manualPortfolio }),
    createTossBrokerAdapter({
      connector: tossReadOnlyConnector,
      snapshotReader: db.tossReadonlySnapshots,
      syncStateReader: () => tossSyncState,
      clock
    })
  ];

  const commander = createCommanderRuntime({
    repository: db.runs,
    artifactStore: new FileArtifactStore(artifactDir),
    brokerAdapters,
    tossReadOnlyConnector,
    tossSnapshotReader: db.tossReadonlySnapshots,
    clock
  });

  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true });

  app.addHook("onClose", async () => {
    db.close();
  });

  app.get("/health", async () => ({
    ok: true,
    stage: "stage_2_toss_readonly_connector",
    gate: "persistence_sync_slice",
    checks: await healthChecks(tossReadOnlyConnector, db.tossReadonlySnapshots, brokerAdapters, tossSyncState, clock)
  }));

  app.get("/settings/brokers/toss/credentials", async () => ({
    provider: "toss",
    credentialStatus: await tossCredentialStore.getStatus()
  }));

  app.put("/settings/brokers/toss/credentials", async (request, reply) => {
    const parsed = tossCredentialSetupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "invalid-toss-credentials",
          message: "clientId and clientSecret are required",
          issues: parsed.error.issues
        }
      });
    }

    tossTokenCache.clear();
    return {
      provider: "toss",
      credentialStatus: await tossCredentialStore.write(parsed.data)
    };
  });

  app.delete("/settings/brokers/toss/credentials", async () => {
    tossTokenCache.clear();
    return {
      provider: "toss",
      credentialStatus: await tossCredentialStore.clear()
    };
  });

  app.post("/sync/toss/read-only", async (request, reply) => {
    const parsed = tossSyncSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "invalid-toss-sync-request",
          message: "symbols must be a non-empty string array when provided",
          issues: parsed.error.issues
        }
      });
    }
    if (tossSyncState.status === "syncing") {
      return reply.status(409).send({
        error: {
          code: "toss-sync-already-running",
          message: "A Toss read-only sync is already running."
        }
      });
    }

    tossSyncState = { status: "syncing", startedAt: clock().toISOString() };
    try {
      const result = await runTossReadonlySyncJob({
        connector: tossReadOnlyConnector,
        repository: db.tossReadonlySnapshots,
        mode: "production_secret_store",
        ...(parsed.data.symbols ? { symbols: parsed.data.symbols } : {}),
        clock
      });

      return {
        status: result.status,
        mode: result.mode,
        source: result.source,
        ...(result.status === "succeeded"
          ? {
              accountCount: result.accountCount,
              holdingCount: result.holdingCount,
              quoteCount: result.quoteCount,
              orderbookCount: result.orderbookCount,
              exchangeRateCount: result.exchangeRateCount,
              marketCalendarCount: result.marketCalendarCount,
              stockWarningCount: result.stockWarningCount
            }
          : {
              failureCategory: result.failureCategory,
              ...(result.safeErrorCode ? { safeErrorCode: result.safeErrorCode } : {}),
              ...(result.safeRequestId ? { safeRequestId: result.safeRequestId } : {}),
              ...(result.retryAfterSeconds !== undefined ? { retryAfterSeconds: result.retryAfterSeconds } : {}),
              ...(result.nextRetryAt ? { nextRetryAt: result.nextRetryAt } : {})
            })
      };
    } finally {
      tossSyncState = { status: "idle" };
    }
  });

  app.post("/chat", async (request, reply) => {
    const parsed = chatSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "invalid-request",
          message: "message is required",
          issues: parsed.error.issues
        }
      });
    }

    const body = parsed.data;
    return commander.handleUserMessage({
      message: body.message,
      permissionMode: body.permissionMode as PermissionMode,
      ...(body.context ? { context: body.context as CommanderContext } : {})
    });
  });

  app.get("/portfolio/manual", async () => db.manualPortfolio.readSnapshot());

  app.put("/portfolio/manual/watchlist", async (request, reply) => {
    const parsed = manualWatchlistSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "invalid-manual-watchlist-item",
          message: "symbol and market are required",
          issues: parsed.error.issues
        }
      });
    }

    return db.manualPortfolio.upsertWatchlistItem({
      symbol: parsed.data.symbol,
      market: parsed.data.market,
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.note ? { note: parsed.data.note } : {})
    });
  });

  app.put("/portfolio/manual/holdings", async (request, reply) => {
    const parsed = manualHoldingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "invalid-manual-holding",
          message: "symbol, market, currency, and quantity are required",
          issues: parsed.error.issues
        }
      });
    }

    return db.manualPortfolio.upsertHolding({
      symbol: parsed.data.symbol,
      market: parsed.data.market,
      currency: parsed.data.currency,
      quantity: parsed.data.quantity,
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.averageCost ? { averageCost: parsed.data.averageCost } : {}),
      ...(parsed.data.note ? { note: parsed.data.note } : {})
    });
  });

  app.put("/portfolio/manual/cash", async (request, reply) => {
    const parsed = manualCashSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "invalid-manual-cash-balance",
          message: "currency and amount are required",
          issues: parsed.error.issues
        }
      });
    }

    return db.manualPortfolio.upsertCashBalance(parsed.data);
  });

  app.get("/agent-runs", async () => ({
    runs: await db.runs.listRecent(20)
  }));

  app.get<{ Params: { id: string } }>("/agent-runs/:id", async (request, reply) => {
    const run = await db.runs.findById(request.params.id);
    if (!run) {
      return reply.status(404).send({
        error: {
          code: "not-found",
          message: "Agent run not found."
        }
      });
    }

    return run;
  });

  return app;
}
