import { mkdirSync } from "node:fs";
import path from "node:path";
import cors from "@fastify/cors";
import {
  FileArtifactStore,
  createManualPortfolioBrokerAdapter,
  createCommanderRuntime,
  createTossBrokerAdapter,
  createUnavailableTossReadonlyConnector,
  syncMockTossReadonlySnapshots
} from "@gaemiguard/core";
import { createGaemiGuardDatabase, type GaemiGuardDatabase } from "@gaemiguard/db";
import type {
  CommanderContext,
  BrokerAdapter,
  BrokerAdapterStatus,
  HealthCheck,
  PermissionMode,
  TossReadonlyConnector,
  TossReadonlySnapshotRepository
} from "@gaemiguard/shared";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";

export type BuildApiAppOptions = {
  dataDir: string;
  tossReadOnlyConnector?: TossReadonlyConnector;
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

function brokerHealthStatus(statuses: BrokerAdapterStatus[]): HealthCheck["status"] {
  if (statuses.some((status) => status.status === "error")) {
    return "error";
  }
  if (statuses.some((status) => status.status === "mock_replay")) {
    return "mock_replay";
  }
  if (statuses.some((status) => status.status === "readonly_available")) {
    return "readonly_available";
  }
  if (statuses.some((status) => status.status === "not_configured")) {
    return "not_configured";
  }
  return "no_broker";
}

function brokerHealthMessage(status: HealthCheck["status"]): string {
  if (status === "mock_replay") {
    return "Broker adapters are available through manual no-broker mode and Toss mock replay only.";
  }
  if (status === "readonly_available") {
    return "At least one broker adapter has read-only availability; order mutation remains disabled.";
  }
  if (status === "not_configured") {
    return "Manual no-broker mode is available and broker credentials are not configured.";
  }
  return "Manual no-broker mode is available.";
}

async function healthChecks(
  tossReadOnlyConnector: TossReadonlyConnector,
  tossSnapshotReader: TossReadonlySnapshotRepository,
  brokerAdapters: BrokerAdapter[],
  clock: () => Date
): Promise<HealthCheck[]> {
  const tossStatus = await tossReadOnlyConnector.getStatus();
  const snapshotFreshness = await tossSnapshotReader.getFreshnessStatus({ now: clock().toISOString() });
  const brokerStatuses = await Promise.all(brokerAdapters.map((adapter) => adapter.getStatus()));
  const brokerStatus = brokerHealthStatus(brokerStatuses);
  const tossStatusWithSnapshot =
    snapshotFreshness.status === "never_synced"
      ? tossStatus
      : {
          ...tossStatus,
          message: `${tossStatus.message} Mock replay snapshot freshness is ${snapshotFreshness.status}.`,
          metadata: {
            ...tossStatus.metadata,
            snapshotFreshness
          }
        };

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
    tossStatusWithSnapshot,
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
  const tossReadOnlyConnector = options.tossReadOnlyConnector ?? createUnavailableTossReadonlyConnector();
  const clock = options.clock ?? (() => new Date());

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
    checks: await healthChecks(tossReadOnlyConnector, db.tossReadonlySnapshots, brokerAdapters, clock)
  }));

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
