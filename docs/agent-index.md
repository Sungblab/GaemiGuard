# GaemiGuard Agent Index

Updated: 2026-06-06

This is the short routing document for agents starting GaemiGuard work. It points to the source documents instead of replacing them.

## Read Order

| Order | Document | Why |
| --- | --- | --- |
| 1 | `AGENTS.md` | Short rules, safety boundaries, language policy, and verification commands. |
| 2 | `docs/agent-index.md` | Agent-facing route through docs, handoffs, and harness commands. |
| 3 | `docs/development-status.md` | Current implementation state, active work, blockers, and next work. |
| 4 | `docs/product/agent-first-direction.md` | Current product direction: personal investment agent first, guard and terminal as supporting surfaces. |
| 5 | `docs/stages/stage-2-toss-readonly-connector.md` | Current Stage 2 contract. |
| 6 | `docs/architecture/maps/README.md` | Source docs mapped to owning code paths and verification gates. |

Read these only when relevant:

| Need | Document |
| --- | --- |
| Overall plan | `docs/waterfall/00-master-plan.md` |
| Development history | `docs/development-history.md` |
| Product direction | `docs/product/README.md`, `docs/product/agent-first-direction.md` |
| Toss API reference | `docs/toss-invest-openapi.md`, `vendor/tossinvest/openapi-1.0.3.json` |
| Commander/runtime work | `docs/architecture/agent-runtime.md` |
| Desktop smoke testing | `docs/setup/playwright-smoke.md` |
| Workflow rules | `docs/contributing/workflow.md` |

## Current Facts

- Development follows stage gates.
- Stage 1 is complete.
- Stage 2 is in progress.
- Stage 2 is not exited yet.
- Product direction is agent-first: the personal investment agent is primary; investment guard and local terminal surfaces support it.
- Toss order create/update/cancel remains forbidden.
- Real Toss secrets, tokens, account numbers, and order IDs must not be stored in code, docs, SQLite, artifacts, API responses, or external agent context.

## Current Implementation

- Local desktop app and local API
- SQLite storage
- Commander runtime
- Artifact persistence
- Permission engine and live-order blocking
- Toss read-only connector skeleton
- Mock replay based Toss snapshot persistence and sync shape
- Safe snapshot freshness status in health/Commander surfaces

Use `docs/development-status.md` for the complete current list.

## Planning The Next Work

Do not put long goals entirely inside `/goal`. If a goal would exceed about 4,000 characters, write the full spec as a document first.

Preferred flow:

1. Create a long task spec under `docs/handoffs/`.
2. Keep `/goal` short and point it at that file.
3. Put completion criteria in the handoff document.
4. After completion, update `docs/development-status.md` and the relevant stage document.

Short `/goal` example:

```text
/goal CWD: C:\Users\Sungbin\Documents\GitHub\GaemiGuard

Goal:
Complete the Stage 2 next work described in docs/handoffs/<file>.md, including code, tests, docs, PR, CI, and main verification.

First read:
- AGENTS.md
- docs/development-status.md
- docs/agent-index.md
- docs/handoffs/<file>.md

Verification:
- pnpm docs:agent-check
- pnpm docs:html
- pnpm verify
```

## Harness Commands

Before command-heavy work:

```powershell
devflow doctor --json
devflow status --json
```

For documentation changes:

```powershell
pnpm docs:agent-check
pnpm docs:html
```

Before completing normal work:

```powershell
pnpm verify
```

If a user-visible desktop workflow changed:

```powershell
pnpm smoke:desktop
```

## Harness Checks

`pnpm docs:agent-check` verifies that required agent-facing documents and links exist. If a new core agent document is added, update `scripts/check-agent-docs.mjs`.

Devflow gates live in `.devflow/config.json`:

- `agent-docs`: `pnpm docs:agent-check`
- `docs-html`: `pnpm docs:html`
- `verify`: `pnpm verify`

GitHub CI lives in `.github/workflows/ci.yml`. Its current baseline:

- GitHub token permissions are read-only.
- Older CI runs for the same branch are canceled.
- Jobs and install steps have timeouts.
- pnpm cache uses `pnpm-lock.yaml`.
- PR and main checks run `pnpm docs:agent-check`, `pnpm docs:html`, and `pnpm verify`.

## Do Not

- Do not add Toss order functionality during Stage 2.
- Do not create or store real secrets.
- Do not present mock/not-configured status as a real Toss connection.
- Do not change docs without regenerating `docs/gaemiguard-all-docs.html`.
