# Stage 1 Foundation

Generated: 2026-06-04

## Purpose

Stage 1 proves that GaemiGuard is an agentic investment guard runtime, not just a static stock dashboard.

The first working slice must create one real loop:

1. User asks the Commander Agent a market/account question.
2. The local API creates an `AgentRun`.
3. Commander delegates to deterministic specialist stubs.
4. The run writes SQLite rows.
5. The run writes Markdown/JSON artifacts.
6. The UI shows the answer, timeline, health, and blocked order status.

## In Scope

- Electron + React desktop shell.
- Fastify local API.
- SQLite persistence.
- File artifact storage.
- Commander Agent mock runtime.
- Portfolio, Research, Scenario, and Order Guard specialist stubs.
- Permission engine with Codex-style modes.
- Order Guard dry-run with Stage 1 live-order hard block.
- Healthcheck for local API, SQLite, artifacts, Commander, Toss, sidecars, kill switch.

## Out of Scope

- Live order submission.
- Live automatic trading.
- Broker credentials or real account connection.
- Full MiroFish execution.
- Hermes/OpenBB execution.
- Graphiti ingestion.
- Remote sync.
- Mobile.
- Multi-broker support.

## Acceptance Criteria

- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm build` passes.
- `GET /health` returns status checks.
- `POST /chat` persists a run and creates artifacts.
- Right sidebar is the Commander Agent panel.
- Order Guard dry-run explains why live submission is blocked.
- Every Stage 1 chat response exposes run id, timeline, artifact ids, and guardrail summary.

## Core Demo

User asks:

> 삼성전자 이 구간 이후 왜 떨어졌고 지금 사도 되는지, 내 계좌 기준으로 봐줘

Expected Stage 1 result:

- Portfolio specialist summarizes sample/sanitized account context.
- Research specialist notes Stage 1 source limitations.
- Scenario specialist creates a MiroFish-ready hypothetical scenario artifact.
- Order Guard creates an order draft review but blocks live submission.
- Commander returns a grounded answer with uncertainty and artifact links.
