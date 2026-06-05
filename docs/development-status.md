# GaemiGuard Development Status

Updated: 2026-06-06

This is the current-state document coding agents should read before continuing GaemiGuard development. Use `docs/agent-index.md` as the short routing map, then use this file for the current implementation state, active stage, next work, and blocking rules.

## Current Baseline

- Active branch after the latest completed goal: `main`
- Latest completed baseline: current `main`; run `git log -1 --oneline` for the exact SHA.
- Recent documentation baseline: `5b924a2`, `docs: use goal format for Devflow handoffs`
- Recent infrastructure baseline: `e41067e`, `chore: install Devflow Native harness`
- Recent feature baseline: PR #10, `c97bbee`, `feat: add Toss read-only connector skeleton`
- Current Stage 2 baseline includes mock replay snapshot persistence/sync shape with safe freshness status.
- Development history is indexed in `docs/development-history.md`.
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
- Latest local verification for the current persistence/sync slice:
  - `pnpm docs:html`
  - `pnpm verify`
- Earlier focused checks for the persistence/sync slice:
  - `pnpm test`
  - `pnpm typecheck`
- Current development model: Gate-Based Waterfall, not MVP iteration.
- Active stage: Stage 2, Toss Readonly Connector.
- Stage 2 status: first implementation slice is complete; Stage 2 exit gate is not complete.

## Read Order For Future Goals

1. `AGENTS.md`
2. `docs/agent-index.md`
3. `docs/development-status.md`
4. `docs/README.md`
5. Active stage gate:
   - currently `docs/stages/stage-2-toss-readonly-connector.md`
6. Source references for the active work:
   - Toss connector work: `docs/toss-invest-openapi.md` and `vendor/tossinvest/openapi-1.0.3.json`
   - Agent runtime work: `docs/architecture/agent-runtime.md`
   - Desktop smoke work: `docs/setup/playwright-smoke.md`
7. `docs/development-history.md` when the task asks why earlier PRs or stages shaped the current code.
8. Run `rg` against code/tests before assuming implementation status.

## Next-Session Prompt Format

Future handoff prompts should use the user's `/goal` format, not a loose narrative prompt.

If a goal prompt would exceed about 4,000 characters, write the long task spec under `docs/handoffs/` and make the `/goal` prompt point to that file. See `docs/agent-index.md` and `docs/handoffs/README.md`.

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
| Stage 2 Toss Readonly Connector | In progress | First connector slice is merged; mock replay SQLite snapshot persistence/sync shape is implemented. Real secret store, real sync jobs, UI data flow, and account-grounded Commander answers remain. |
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

Stage 2 persistence/sync slice:

- SQLite tables and repository APIs for mock replay read-only Toss snapshots:
  - masked account references
  - holdings snapshots
  - quote/current price snapshots
  - orderbook summary snapshots
  - exchange rate snapshots
  - KR/US market calendar snapshots
  - stock warning snapshots
  - sync logs
  - rate-limit metadata
- `syncMockTossReadonlySnapshots` orchestrates only the Stage 2 read-only connector methods and writes snapshot families to SQLite.
- Mock replay connector now returns fixture data for every included read-only operation.
- API `/health` can include safe `snapshotFreshness` metadata after an explicit mock replay sync; it still distinguishes `not_configured` and `mock_replay`.
- Commander/BrokerTossAgent can include snapshot availability/freshness metadata only. It does not answer with holdings or account facts from the snapshot in this slice.
- Tests prove raw mock client secrets, access tokens, raw account numbers, and order identifier sentinels are not stored in SQLite, artifacts, API responses, or Commander/external-agent context.

Devflow Native:

- Repo-local Devflow scaffold is installed.
- Codex and Claude harness files are installed under `plugins/devflow/`.
- Devflow gates are configured as `docs-html` (`pnpm docs:html`) and `verify` (`pnpm verify`).
- Devflow review evidence is required by `.devflow/config.json`.
- Agent host restart/new session is required for the repo-local hooks, skills, and MCP config to load.

Documentation routing:

- `docs/README.md` is the documentation hub.
- `docs/agent-index.md` is the short agent-facing route into the current state, handoff policy, and harness commands.
- `docs/development-history.md` records PR-by-PR development history.
- `docs/architecture/design-index.md` owns the source-of-truth map.
- `docs/architecture/maps/README.md` maps source docs to code owners and verification gates.
- `scripts/build-docs-html.mjs` builds the searchable single-file bundle.

## Active Stage 2 Gaps

Do not treat Stage 2 as exited until these are implemented and verified:

- Production secret storage using the OS credential store.
- Credential setup/disconnect flow.
- Real Toss sync jobs using production credentials.
- Production account sequence mapping and scheduling around the OS credential boundary.
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

After the mock replay persistence/sync slice, the next practical Stage 2 slice is production credential setup and real read-only sync:

1. Add production credential setup/disconnect flow backed by the OS credential store.
2. Add real Toss sync jobs that reuse the snapshot repository without writing raw secrets, tokens, raw account numbers, or order identifiers.
3. Add rate-limit scheduling/backoff around real sync execution.
4. Add user-facing account/holdings/data freshness UI that never implies connection before credentials and sync are configured.
5. Ground Commander account-aware answers in real read-only snapshots with source links.
6. Complete the Stage 2 security review and gate review record.

Do not add production credential storage or UI claims of real Toss connection in the same slice unless the goal explicitly asks for that broader scope.
