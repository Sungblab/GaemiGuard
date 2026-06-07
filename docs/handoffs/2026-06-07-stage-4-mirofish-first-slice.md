# Stage 4 MiroFish Scenario First Slice

## Goal

Implement the first Stage 4 MiroFish Scenario slice: sidecar status contract, source/freshness-grounded scenario input package, scenario artifacts, safe failure handling, and minimal desktop visibility.

## Context

- Stage 1 Foundation Runtime is complete.
- Stage 2 Broker Connection Foundation is complete.
- Stage 3 Research And Memory is complete and accepted in `docs/reviews/2026-06-06-stage-3-research-memory-gate-review.md`.
- Current `main` includes:
  - desktop thesis/rule/journal/research authoring
  - explicit local Markdown/CSV import as research memory
  - weekly review Markdown/JSON artifacts
  - Commander MemoryAgent source/freshness-gated recall
- Stage 4 must use those existing source/freshness and redaction boundaries when packaging scenario context.

## First Read

- `AGENTS.md`
- `docs/agent-index.md`
- `docs/development-status.md`
- `docs/stages/stage-4-mirofish-scenario.md`
- `docs/mirofish-sidecar-porting.md`
- `docs/product/external-tools-and-data.md`
- `docs/architecture/agent-runtime.md`
- `docs/architecture/maps/README.md`
- `apps/api/src/app.ts`
- `apps/desktop/src/App.tsx`
- `packages/shared/src/index.ts`
- `packages/core/src/commander-runtime.ts`
- `scripts/smoke-desktop-ui.ps1`

## Do Not

- Do not implement live trading, automatic trading, paper trading, or order drafts.
- Do not let MiroFish place, schedule, draft, or mutate orders.
- Do not store or expose raw secrets, tokens, account numbers, account sequence values, order IDs, or personal identifiers.
- Do not install, vendor, or modify optional sidecars unless explicitly asked.
- Do not send stale/missing-source memory or broker facts as current scenario input.
- Do not present MiroFish output as a guaranteed forecast.
- Do not redesign the whole desktop UI.

## Implementation Scope

1. Add a Stage 4 sidecar status contract.
   - Represent `not_configured`, `available`, and `failed`.
   - Keep the default state safe when MiroFish is absent.
   - Do not run external sidecar commands in normal health checks unless explicitly configured.
2. Add a scenario input package builder.
   - Inputs: selected symbol, chart range, manual holdings/watchlist summary, usable Stage 3 memory/research recall, weekly review artifact references.
   - Include source/freshness metadata and skipped memory metadata.
   - Strip or redact sensitive sentinels.
3. Add scenario artifact persistence.
   - Write Markdown and JSON artifacts.
   - Include assumptions, uncertainty labels, sidecar status, source summary, redaction status, and order-authority blocked state.
4. Add API surface for a scenario run.
   - The first slice may use deterministic/stubbed sidecar output when MiroFish is not configured.
   - Failed/missing sidecar must still return a safe artifact or safe failure payload without breaking account/research flows.
5. Add minimal desktop visibility.
   - Existing scenario panel can show sidecar status, assumptions, and scenario artifact links.
   - Keep UI scoped to the current desktop structure.
6. Update docs.
   - `docs/development-status.md`
   - `docs/stages/stage-4-mirofish-scenario.md`
   - `docs/architecture/agent-runtime.md` or maps if ownership changes
   - regenerate `docs/gaemiguard-all-docs.html`

## Verification

- `pnpm docs:agent-check`
- `pnpm docs:html`
- `pnpm verify`
- `pnpm smoke:desktop`, if desktop scenario UI changes
- PR CI
- main CI after merge

## Completion Criteria

- Scenario input packages are generated from source/freshness-grounded memory/research/report/portfolio context.
- Scenario Markdown and JSON artifacts are persisted.
- Sidecar missing/failure state is safe and does not break account, memory, research, or weekly review flows.
- UI can show scenario status/artifact visibility if desktop changes are included.
- Stale or missing-source memory is skipped, not used as current scenario grounding.
- Order paths remain blocked.
- Secret/account/order sentinel redaction tests pass.
- Docs and docs HTML reflect the Stage 4 first slice status.
- PR is created, CI passes, branch is squash-merged to `main`, and main CI passes.
