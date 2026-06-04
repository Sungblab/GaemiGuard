# Stage 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable GaemiGuard foundation: local desktop shell, local API, SQLite persistence, artifact storage, Commander Agent mock runtime, permission gates, and a Toss-inspired Stage 1 dashboard.

**Architecture:** Stage 1 is a vertical runtime spine, not a trading bot. The UI sends a chat request to a local Fastify API, the API creates an agent run, the Commander delegates to deterministic specialist stubs, and every run writes SQLite rows plus Markdown/JSON artifacts.

**Tech Stack:** pnpm workspace, TypeScript, Electron, Vite, React, Fastify, SQLite, Vitest, Playwright-ready UI structure.

---

## File Map

- `README.md`: project status, local reference map, and run commands.
- `docs/architecture/design-index.md`: canonical index of design decisions and source documents.
- `docs/architecture/stage-1-foundation.md`: Stage 1 scope, acceptance criteria, and non-goals.
- `docs/architecture/agent-runtime.md`: Commander/specialist/tool/permission runtime design.
- `docs/superpowers/plans/2026-06-04-stage-1-foundation.md`: this executable plan.
- `prototypes/index.html`: preserved static prototype.
- `prototypes/prototype-screenshot.png`: preserved visual reference.
- `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.config.ts`: root workspace and test setup.
- `packages/shared/src/index.ts`: shared domain types.
- `packages/core/src/*`: permission engine, artifact store, Commander runtime, order guard, test fixtures.
- `packages/db/src/*`: SQLite schema and repository.
- `apps/api/src/*`: Fastify local API.
- `apps/desktop/src/*`: React renderer.
- `apps/desktop/electron/main.cjs`: Electron shell.

## Task 1: Workspace Foundation

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: package manifests and TypeScript configs under `apps/*` and `packages/*`

- [x] **Step 1: Add workspace config and package boundaries**

Create a pnpm workspace with `apps/api`, `apps/desktop`, `packages/core`, `packages/db`, and `packages/shared`.

- [x] **Step 2: Install dependencies**

Run:

```powershell
pnpm install
```

Expected: lockfile created and workspace packages linked.

## Task 2: Red Tests for Stage 1 Contracts

**Files:**
- Create: `packages/core/src/permission-engine.test.ts`
- Create: `packages/core/src/commander-runtime.test.ts`
- Create: `packages/db/src/sqlite-repository.test.ts`
- Create: `apps/api/src/app.test.ts`

- [x] **Step 1: Write failing permission tests**

The tests require:

- Stage 1 blocks `submit_live_order` in every mode, including `full_access`.
- Read-only market/account tools are allowed in guarded modes.
- `order_dry_run` is allowed but must be audited.

- [x] **Step 2: Write failing Commander runtime test**

The test requires:

- A user chat creates one completed `AgentRun`.
- Specialist timeline includes Portfolio, Research, Scenario, and Order Guard.
- Markdown and JSON artifacts are written.
- The final answer explicitly states live order submit is blocked in Stage 1.

- [x] **Step 3: Write failing SQLite repository test**

The test requires:

- Migrations create expected tables.
- A completed run can be saved and loaded.
- Artifact index rows can be listed for a run.

- [x] **Step 4: Write failing API test**

The test requires:

- `GET /health` returns local API, SQLite, artifact, Commander, Toss, sidecar, and kill switch checks.
- `POST /chat` returns a persisted Commander response.
- `GET /agent-runs/:id` returns the same run.

## Task 3: Core Runtime

**Files:**
- Create: `packages/shared/src/index.ts`
- Create: `packages/core/src/permission-engine.ts`
- Create: `packages/core/src/artifact-store.ts`
- Create: `packages/core/src/order-guard.ts`
- Create: `packages/core/src/commander-runtime.ts`
- Create: `packages/core/src/index.ts`

- [x] **Step 1: Implement shared types**

Define `PermissionMode`, `ToolAction`, `AgentRun`, `AgentRunEvent`, `ArtifactRecord`, `CommanderRequest`, and `CommanderResponse`.

- [x] **Step 2: Implement permission engine**

Implement deterministic policy:

- `submit_live_order` is blocked in Stage 1.
- `create_order_draft` and `order_dry_run` are allowed with audit.
- read-only tools are allowed under all modes.
- external/process tools require approval in `manual`.

- [x] **Step 3: Implement artifact stores**

Implement `InMemoryArtifactStore` for tests and `FileArtifactStore` for runtime. File artifacts are written under `artifacts/runs/YYYY-MM-DD/<run_id>/`.

- [x] **Step 4: Implement Commander runtime**

Implement deterministic specialist stubs:

- Portfolio Agent returns account/holding context from supplied context or sample fixture.
- Research Agent returns a Stage 1 research placeholder with source limitations.
- Scenario Agent returns a MiroFish placeholder artifact with assumptions.
- Order Guard Agent returns dry-run review and blocks live order submission.

## Task 4: SQLite Persistence

**Files:**
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/sqlite.ts`
- Create: `packages/db/src/index.ts`

- [x] **Step 1: Implement migrations**

Create tables:

- `agent_runs`
- `agent_run_events`
- `artifacts`
- `audit_events`
- `settings`

- [x] **Step 2: Implement repository**

Implement save/find/list methods for runs and artifacts.

## Task 5: Local API

**Files:**
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/index.ts`

- [x] **Step 1: Implement Fastify app factory**

`buildApiApp({ dataDir })` wires SQLite repository, file artifact store, and Commander runtime.

- [x] **Step 2: Implement routes**

Routes:

- `GET /health`
- `POST /chat`
- `GET /agent-runs`
- `GET /agent-runs/:id`

## Task 6: Desktop Shell

**Files:**
- Create: `apps/desktop/index.html`
- Create: `apps/desktop/vite.config.ts`
- Create: `apps/desktop/electron/main.cjs`
- Create: `apps/desktop/src/main.tsx`
- Create: `apps/desktop/src/App.tsx`
- Create: `apps/desktop/src/styles.css`

- [x] **Step 1: Build Toss-inspired Stage 1 UI**

The first screen has:

- dense Today Guard dashboard
- right Commander Agent chat panel
- health badges
- holdings/risk/research/scenario/order guard panels
- run timeline and artifact links

- [x] **Step 2: Wire UI to API**

The UI calls `GET /health` on load and `POST /chat` when the user sends a message.

## Task 7: Verification and Review

**Commands:**

```powershell
pnpm test
pnpm typecheck
pnpm build
```

- [x] **Step 1: Run tests**
- [x] **Step 2: Run typecheck**
- [x] **Step 3: Run build**
- [x] **Step 4: Review current diff and fix defects**
- [ ] **Step 5: Initialize/inspect git state and create PR if a remote repository exists**

## Acceptance Criteria

- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm build` passes.
- `GET /health` works through the local API.
- `POST /chat` creates a persisted run with timeline and artifacts.
- Desktop UI has the Commander panel as the right sidebar.
- Stage 1 live order submission is blocked by deterministic policy.
- Existing design/prototype files are organized under docs/prototypes.
- PR is opened if this folder can be connected to a GitHub remote.
