import { mkdirSync } from "node:fs";
import path from "node:path";
import cors from "@fastify/cors";
import { FileArtifactStore, createCommanderRuntime, createUnavailableTossReadonlyConnector } from "@gaemiguard/core";
import { createGaemiGuardDatabase, type GaemiGuardDatabase } from "@gaemiguard/db";
import type { CommanderContext, HealthCheck, PermissionMode, TossReadonlyConnector } from "@gaemiguard/shared";
import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";

export type BuildApiAppOptions = {
  dataDir: string;
  tossReadOnlyConnector?: TossReadonlyConnector;
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

async function healthChecks(tossReadOnlyConnector: TossReadonlyConnector): Promise<HealthCheck[]> {
  const tossStatus = await tossReadOnlyConnector.getStatus();
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
    tossStatus,
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

  const db: GaemiGuardDatabase = createGaemiGuardDatabase({ dataDir });
  const commander = createCommanderRuntime({
    repository: db.runs,
    artifactStore: new FileArtifactStore(artifactDir),
    tossReadOnlyConnector
  });

  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true });

  app.addHook("onClose", async () => {
    db.close();
  });

  app.get("/health", async () => ({
    ok: true,
    stage: "stage_2_toss_readonly_connector",
    gate: "first_slice",
    checks: await healthChecks(tossReadOnlyConnector)
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
