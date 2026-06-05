# GaemiGuard Development Status

Updated: 2026-06-05

This is the first document coding agents should read before continuing GaemiGuard development. It records the current implementation state, the active stage, the next work, and the documents that define the rules.

## Current Baseline

- Active branch after the latest completed goal: `main`
- Latest completed implementation: `e41067e`, `chore: install Devflow Native harness`
- Previous feature implementation: PR #10, `c97bbee`, `feat: add Toss read-only connector skeleton`
- Latest verified commands for the current main baseline:
  - `devflow doctor --json`
  - `devflow status --json`
  - `devflow harness health --json`
  - `devflow health --json`
  - `devflow harness inspect --json`
  - `devflow gates run docs-html --json`
  - `devflow gates run verify --json`
- Latest verified commands for PR #10:
  - `pnpm docs:html`
  - `pnpm verify`
  - PR CI `verify`
  - main push CI
- Current development model: Gate-Based Waterfall, not MVP iteration.
- Active stage: Stage 2, Toss Readonly Connector.
- Stage 2 status: first implementation slice is complete; Stage 2 exit gate is not complete.

## Read Order For Future Goals

1. `AGENTS.md`
2. `docs/development-status.md`
3. `docs/waterfall/00-master-plan.md`
4. Active stage gate:
   - currently `docs/stages/stage-2-toss-readonly-connector.md`
5. Source references for the active work:
   - Toss connector work: `docs/toss-invest-openapi.md` and `vendor/tossinvest/openapi-1.0.3.json`
   - Agent runtime work: `docs/architecture/agent-runtime.md`
   - Desktop smoke work: `docs/setup/playwright-smoke.md`
6. Run `rg` against code/tests before assuming implementation status.

## Next-Session Prompt Format

Future handoff prompts should use the user's `/goal` format, not a loose narrative prompt.

Required shape:

```text
/goal CWD: C:\Users\Sungbin\Documents\GitHub\GaemiGuard

Goal:
<concrete objective>

Context:
- <current state>
- <relevant prior work>

First read:
- AGENTS.md
- docs/development-status.md
- docs/waterfall/00-master-plan.md
- <active stage/source docs>

Do not:
- <stage-specific forbidden actions>

Implementation scope:
1. <task>
2. <task>

Verification:
- pnpm verify
- pnpm docs:html, when docs change
- pnpm smoke:desktop, when desktop UI workflow changes

Completion criteria:
- <observable done state>
```

Devflow next-session prompts and manual handoffs should follow this structure.

## Stage Status

| Stage | Status | Notes |
| --- | --- | --- |
| Stage 1 Foundation Runtime | Complete | Electron/React desktop, Fastify API, SQLite, artifact store, Commander runtime, specialist stubs, permission engine, Order Guard dry-run, live-order hard block. |
| Stage 2 Toss Readonly Connector | In progress | First read-only connector slice is merged. Real secret store, sync persistence, UI data flow, and account-grounded Commander answers remain. |
| Stage 3 Research And Memory | Not started | Must wait for accepted Stage 2 read-only Toss data. |
| Stage 4 MiroFish Scenario | Not started | Sidecar remains scenario-only; no order execution. |
| Stage 5 Paper Trading And Order Draft | Not started | Order drafts and paper trading stay unavailable until earlier gates pass. |
| Stage 6 Guarded Live Orders | Locked | Live order submission remains forbidden before this stage. |
| Stage 7 Rule-Based Automation | Locked | Unattended automation remains forbidden before this stage. |

## Implemented So Far

Stage 1:

- Local desktop shell and product-facing home UI.
- Local Fastify API.
- SQLite repository for agent runs/events/artifact indexes.
- Markdown/JSON artifact store.
- CommanderAgent runtime with deterministic specialist timeline.
- Portfolio, Research, Scenario, and Order Guard stubs.
- Permission engine and Order Guard dry-run.
- Live order submission hard block.
- Windows-safe desktop smoke command: `pnpm smoke:desktop`.

Stage 2 first slice:

- Shared Toss read-only TypeScript operation and data contracts.
- Official Toss Invest OpenAPI version pinned to `1.0.3`.
- First-slice operation scope:
  - `getAccounts`
  - `getHoldings`
  - `getPrices`
  - `getOrderbook`
  - `getExchangeRate`
  - `getKrMarketCalendar`
  - `getUsMarketCalendar`
  - `getStockWarnings`
- OAuth2 token issuance modeled only as an injected credential/token boundary.
- Fetch-based `TossInvestReadonlyClient` skeleton.
- Mock replay connector for tests and local health wiring.
- In-memory token cache only; no production secret store yet.
- Mutation operations explicitly forbidden:
  - `createOrder`
  - `modifyOrder`
  - `cancelOrder`
- API `/health` exposes safe Toss read-only connector status.
- Commander/BrokerTossAgent exposes only read-only tool contract metadata.
- Tests cover 200, 401, 403, 429, unknown enum, mutation exclusion, health wiring, and non-persistence of mock private boundary values.

Devflow Native:

- Repo-local Devflow scaffold is installed.
- Codex and Claude harness files are installed under `plugins/devflow/`.
- Devflow gates are configured as `docs-html` (`pnpm docs:html`) and `verify` (`pnpm verify`).
- Devflow review evidence is required by `.devflow/config.json`.
- Agent host restart/new session is required for the repo-local hooks, skills, and MCP config to load.

## Active Stage 2 Gaps

Do not treat Stage 2 as exited until these are implemented and verified:

- Production secret storage using the OS credential store.
- Credential setup/disconnect flow.
- Real Toss sync jobs.
- SQLite snapshot tables for accounts, holdings, quotes, orderbook summaries, FX, market calendars, stock warnings, sync logs, and rate-limit metadata.
- Rate-limit scheduling/backoff behavior beyond response metadata normalization.
- Account/holdings/data freshness UI.
- Commander answers grounded in real read-only snapshots with source links.
- Security review for credential lifecycle and external-agent redaction.
- Stage 2 gate review record.

## Hard Rules Still Active

- No Toss order create/modify/cancel implementation.
- No live trading.
- No automatic trading.
- No unofficial Toss web/internal API.
- No real Toss secrets, tokens, account numbers, order IDs, or personal identifiers in code, docs, tests, logs, DB, artifacts, or external-agent context.
- No UI copy that implies Toss is connected when only mock or not-configured mode is active.

## Recommended Next Slice

The next practical Stage 2 slice is persistence and sync shape, still using mock replay:

1. Add SQLite tables/repository APIs for read-only Toss snapshots and sync logs.
2. Add fixture-backed sync service that writes masked account and market snapshots.
3. Prove secret/token values are not stored in those tables.
4. Expose last sync/freshness status through API health or a narrow read-only endpoint.
5. Update this file and `docs/stages/stage-2-toss-readonly-connector.md`.
6. Run `pnpm docs:html` and `pnpm verify`.

Do not add production credential storage or UI claims of real Toss connection in the same slice unless the goal explicitly asks for that broader scope.
