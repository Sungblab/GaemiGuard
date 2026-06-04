# Stage 1 Gate: Foundation Runtime

Generated: 2026-06-04

## Objective

Prove GaemiGuard is a working local agentic investment guard runtime, not just a static dashboard.

## Entry Criteria

- Repo initialized.
- Node/pnpm workspace available.
- Product direction and Stage 1 scope documented.

## In Scope

- Electron + React shell.
- Fastify local API.
- SQLite repository.
- Markdown/JSON artifact storage.
- Commander Agent panel.
- Deterministic specialist stubs.
- Permission engine.
- Order Guard dry-run hard block.

## Out Of Scope

- Real Toss credentials.
- Real account data.
- Live orders.
- Automatic trading.
- MiroFish execution.
- Hermes/OpenBB execution.
- Remote sync.

## Exit Gate

Stage 1 exits when:

- `pnpm test` passes.
- `pnpm typecheck` passes.
- `pnpm build` passes.
- `/health` reports local runtime checks.
- `/chat` persists an agent run.
- Artifacts are created.
- UI shows Commander panel, run timeline, and blocked order status.
- Live order submission is blocked in every permission mode.

## Status

Implemented and merged to `main` before this waterfall package. Keep this document as the baseline gate record shape for future stages.
