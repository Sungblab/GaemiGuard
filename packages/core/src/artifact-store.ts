import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArtifactKind, ArtifactRecord } from "@gaemiguard/shared";

export type ArtifactWriteInput = {
  id: string;
  runId: string;
  kind: ArtifactKind;
  title: string;
  createdAt: string;
  extension: "md" | "json";
  content: string;
};

export interface ArtifactStore {
  writeArtifact(input: ArtifactWriteInput): Promise<ArtifactRecord>;
}

function dateSegment(createdAt: string): string {
  return createdAt.slice(0, 10);
}

function filenameFor(input: ArtifactWriteInput): string {
  return `${input.kind}.${input.extension}`;
}

function portablePath(...segments: string[]): string {
  return segments.join("/");
}

export class InMemoryArtifactStore implements ArtifactStore {
  readonly records: ArtifactRecord[] = [];
  readonly contents = new Map<string, string>();

  async writeArtifact(input: ArtifactWriteInput): Promise<ArtifactRecord> {
    const record: ArtifactRecord = {
      id: input.id,
      runId: input.runId,
      kind: input.kind,
      title: input.title,
      path: `memory://${input.runId}/${filenameFor(input)}`,
      createdAt: input.createdAt
    };

    this.records.push(record);
    this.contents.set(record.id, input.content);
    return record;
  }
}

export class FileArtifactStore implements ArtifactStore {
  constructor(private readonly rootDir: string) {}

  async writeArtifact(input: ArtifactWriteInput): Promise<ArtifactRecord> {
    const date = dateSegment(input.createdAt);
    const filename = filenameFor(input);
    const runDir = path.join(this.rootDir, "runs", date, input.runId);
    await mkdir(runDir, { recursive: true });

    const absolutePath = path.join(runDir, filename);
    await writeFile(absolutePath, input.content, "utf8");

    return {
      id: input.id,
      runId: input.runId,
      kind: input.kind,
      title: input.title,
      path: portablePath("artifacts", "runs", date, input.runId, filename),
      createdAt: input.createdAt
    };
  }
}
