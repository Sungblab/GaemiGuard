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
  PermissionMode
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
  close(): void;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
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

export function createGaemiGuardDatabase(options: CreateDatabaseOptions): GaemiGuardDatabase {
  mkdirSync(options.dataDir, { recursive: true });

  const databasePath = path.join(options.dataDir, "gaemiguard.sqlite");
  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  database.pragma("journal_mode = WAL");

  for (const migration of migrations) {
    database.exec(migration);
  }

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

    close(): void {
      database.close();
    }
  };
}
