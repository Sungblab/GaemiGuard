# GaemiGuard Development Status

Updated: 2026-06-06

This is the current-state document coding agents should read before continuing GaemiGuard development. Use `docs/agent-index.md` as the short routing map, then use this file for the current implementation state, active stage, next work, and blocking rules.

## Current Baseline

- Active branch after the latest completed goal: `main`
- Latest completed baseline: current `main`; run `git log -1 --oneline` for the exact SHA.
- Recent documentation baseline: `5b924a2`, `docs: use goal format for Devflow handoffs`
- Recent infrastructure baseline: `e41067e`, `chore: install Devflow Native harness`
- Recent feature baseline: PR #10, `c97bbee`, `feat: add Toss read-only connector skeleton`
- Current Stage 2 baseline includes production-safe Toss credential setup/disconnect, real read-only sync, safe freshness/failure metadata, Commander production snapshot grounding, and desktop freshness status.
- Current Stage 3 baseline includes local thesis/rule/journal memory persistence, source-backed research artifacts, explicit local Markdown/CSV import, weekly review artifacts, API endpoints, Commander MemoryAgent context, source/freshness gating, desktop memory/research authoring/review/report surfaces, and redaction tests.
- Current product design baseline treats Stage 2 as Broker Connection Foundation; the implemented code now includes the shared broker adapter contract, Toss as the first adapter, no-broker/manual portfolio foundation, and a completed Stage 2 exit gate.
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
- Latest focused local verification for the current credential/sync slice:
  - `pnpm test`
  - `pnpm typecheck`
- Current development model: Gate-Based Waterfall, not MVP iteration.
- Latest completed stage: Stage 3, Research And Memory.
- Stage 2 status: exit accepted after credential boundary, real read-only sync, freshness UI, Commander grounding, security tests, and gate review.
- Active stage: Stage 4, MiroFish Scenario.

## Read Order For Future Goals

1. `AGENTS.md`
2. `docs/agent-index.md`
3. `docs/development-status.md`
4. `docs/README.md`
5. Product direction:
   - `docs/product/agent-first-direction.md`
   - `docs/product/broker-connection-and-trading.md`
   - `docs/product/external-tools-and-data.md`
6. Latest completed stage gates:
   - `docs/stages/stage-2-toss-readonly-connector.md` (file name retained; product meaning is Broker Connection Foundation)
   - `docs/stages/stage-3-research-memory.md`
   - `docs/reviews/2026-06-06-stage-3-research-memory-gate-review.md`
7. Source references for the active work:
   - Toss connector work: `docs/toss-invest-openapi.md` and `vendor/tossinvest/openapi-1.0.3.json`
   - Agent runtime work: `docs/architecture/agent-runtime.md`
   - Desktop smoke work: `docs/setup/playwright-smoke.md`
8. `docs/development-history.md` when the task asks why earlier PRs or stages shaped the current code.
9. Run `rg` against code/tests before assuming implementation status.

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
| Stage 2 Broker Connection Foundation | Complete | Toss read-only adapter, mock replay and production snapshot sync, OS credential-store boundary, setup/disconnect API, safe freshness/failure metadata, desktop freshness status, Commander production snapshot grounding, manual/no-broker foundation, and security tests are implemented. |
| Stage 3 Research And Memory | Complete | Thesis/rule/journal/research authoring, explicit local Markdown/CSV import, source/freshness-gated recall, Commander MemoryAgent grounding, weekly review artifacts, desktop visibility, and exit gate review are implemented. |
| Stage 4 MiroFish Scenario | Not started | Sidecar remains scenario-only; no order execution. |
| Stage 5 Paper Trading And Order Draft | Not started | Order drafts and paper trading stay unavailable until earlier gates pass. |
| Stage 6 Guarded Manual Live Orders | Locked | User-approved manual live order submission remains forbidden before this stage. |
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

- Shared Toss read-only TypeScript operation and data contracts. This is now interpreted as the first broker adapter slice, not as a Toss-only product commitment.
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
- In-memory token cache only in the connector; production secrets are stored through the OS credential-store boundary added in the final Stage 2 slice.
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

Stage 2 broker adapter/manual foundation slice:

- Shared `BrokerAdapter` TypeScript contract and capability metadata live in `packages/shared/src/broker-adapter.ts`.
- Toss read-only is wrapped as the first broker adapter in `packages/core/src/broker-adapter.ts`.
- Toss adapter status distinguishes `not_configured`, `mock_replay`, and future `readonly_available`; order create/modify/cancel capabilities are disabled.
- Manual no-broker mode has a local service/DB/API foundation for watchlist items, manual holdings, and manual cash balances using the synthetic `manual:default` account reference.
- API `/health` now includes a `broker_adapters` check that reports no-broker/manual, Toss not-configured, Toss credential-configured, syncing, read-only available, stale, failed, and mock replay states without calling any real broker API during health checks.
- API manual portfolio endpoints are available at `GET /portfolio/manual`, `PUT /portfolio/manual/watchlist`, `PUT /portfolio/manual/holdings`, and `PUT /portfolio/manual/cash`.
- Commander emits broker-independent `BrokerAgent` availability/freshness/capability metadata before Toss specialist metadata.
- `BrokerTossAgent` remains the Toss adapter specialist and still does not create holdings, balances, or account facts without source/freshness grounding.
- Tests cover adapter status mapping, manual portfolio persistence/API behavior, redaction of secret/account/order sentinels, and order mutation unavailability.

Stage 2 production credential/sync and exit slice:

- `packages/core/src/toss-credential-store.ts` adds a Toss credential-store boundary with a Windows Credential Manager implementation and an in-memory fake provider for tests.
- API endpoints now support `GET`, `PUT`, and `DELETE /settings/brokers/toss/credentials` for safe credential status, setup, and disconnect without returning secrets.
- `POST /sync/toss/read-only` runs the real Toss read-only sync path behind the credential boundary and reuses the existing SQLite snapshot repository.
- The sync job calls only Stage 2 read-only operations. Raw account sequence values are used only in memory for account-scoped Toss calls and are not stored or returned.
- Sync logs now carry success/failure metadata, failure category, safe request/error codes, retry-after seconds, and next retry time.
- API `/health` distinguishes no-broker/manual, Toss `not_configured`, `credential_configured`, `syncing`, `readonly_available`, `stale`, `failed`, and `mock_replay` states.
- Desktop UI displays broker/freshness status from health without claiming connection before credentials and production sync exist.
- Commander answers account/holding facts only from `production_snapshot` freshness plus stored snapshots; mock/no-source cases explicitly say the account fact is unknown.
- Security tests cover raw secret/token/account sequence/raw account/order sentinel non-exposure in DB, API responses, Commander responses, artifacts, and external-agent context.
- Toss order create/modify/cancel remains unavailable and hard-blocked.

Stage 3 first local memory slice:

- `packages/shared/src/index.ts` defines the Stage 3 thesis/rule/journal memory contract with source metadata, freshness metadata, and optional broker snapshot source references.
- `packages/db/src/schema.ts` and `packages/db/src/sqlite.ts` persist local-only `investment_memory_records` with versioned thesis/rule entries and journal entries.
- Stored memory text and source labels/messages are redacted before SQLite persistence so raw secret, token, account, and order sentinel values are not retained.
- API endpoints are available at `PUT /memory/theses`, `PUT /memory/rules`, `POST /memory/journal`, and `GET /memory/recall`.
- Commander can call `MemoryAgent` for memory-oriented questions and uses only memory records with usable source/freshness status. Stale broker-snapshot memory is skipped instead of being presented as current evidence.
- Tests cover DB persistence/redaction, API memory CRUD/recall, Commander MemoryAgent context, and stale-source exclusion.

Stage 3 source-backed research artifact slice:

- `packages/shared/src/index.ts` extends investment memory with `research` records and research links to symbols, holding symbols, watchlist symbols, and the originating user question.
- `packages/db/src/schema.ts` and `packages/db/src/sqlite.ts` persist source-backed research artifacts locally with redacted body, source, and link metadata.
- API endpoint `POST /memory/research` writes research artifacts. Missing source metadata is rejected.
- `/memory/recall` can return research artifacts tied to the selected symbol through direct symbol, holding, or watchlist links.
- Commander `MemoryAgent` recalls research artifacts for research/thesis questions only when source/freshness metadata is usable.
- Stale research artifacts are skipped and reported as skipped memory instead of being used as answer grounding.
- Tests cover DB persistence/redaction, API write/recall validation, Commander research recall, missing-source rejection, and stale research exclusion.

Stage 3 desktop memory/research review surface slice:

- `apps/desktop/src/App.tsx` shows a Stage 3 Memory panel for the selected holding with `/memory/recall` results.
- The panel surfaces source, freshness status, research links, and skipped stale/missing-source memory so users can review what Commander may use.
- Commander review cards can surface MemoryAgent used/skipped grounding metadata when memory is involved in a run.
- `scripts/smoke-desktop-ui.ps1` now verifies that the desktop home screen includes the memory/research review surface.

Stage 3 authoring/import/report exit slice:

- Desktop Stage 3 Memory panel now supports selected-symbol thesis, rule, journal, and research authoring.
- Authored desktop memory automatically receives `local_manual` source/freshness metadata and refreshes `/memory/recall` after save.
- API CORS explicitly allows browser `PUT`, `DELETE`, and `OPTIONS`, so desktop write flows work through the local API.
- API endpoint `POST /memory/import/local` stores explicit user Markdown, CSV, or already-extracted PDF text imports as source-backed research memory.
- Local import metadata stores safe file names and explicit source labels without retaining original local paths.
- Desktop local import controls support Markdown/CSV file selection or pasted text and show imported research in recall.
- API endpoint `POST /reports/weekly-review` creates persisted `weekly_review_markdown` and `weekly_review_json` artifacts through `ReportAgent`.
- Weekly review artifacts combine usable thesis/rule/journal/research recall with local manual holding/watchlist context and list skipped stale/missing-source memory.
- Desktop weekly review control generates the report and shows the resulting artifacts.
- Tests cover local import source metadata, redaction, path stripping, weekly review artifact persistence, stale-source exclusion, and desktop smoke coverage for authoring/import/report visibility.

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
- `docs/product/agent-first-direction.md` records the current product decision: personal investment agent first, with investment guard and local terminal surfaces supporting the agent.
- `docs/product/broker-connection-and-trading.md` records the broker-independent adapter direction, no-broker mode, manual trading, and automation authority.
- `docs/product/external-tools-and-data.md` records Hermes, MiroFish, OpenBB, OpenDART, KRX, FinceptTerminal, and open-source reuse priorities.
- `docs/architecture/design-index.md` owns the source-of-truth map.
- `docs/architecture/maps/README.md` maps source docs to code owners and verification gates.
- `scripts/build-docs-html.mjs` builds the searchable single-file bundle.

## Stage 2 Gate Review

Stage 2 exit is accepted in `docs/reviews/2026-06-06-stage-2-broker-connection-foundation-gate-review.md`.

## Stage 3 Gate Review

Stage 3 exit is accepted in `docs/reviews/2026-06-06-stage-3-research-memory-gate-review.md`.

Accepted evidence:

- Toss credentials live behind the OS credential-store boundary; tests use only the fake credential provider.
- Credential setup/disconnect APIs return only safe status metadata.
- Production Toss read-only sync reuses the snapshot repository and stores only masked account references plus snapshot metadata.
- Raw secrets, tokens, account sequence values, raw account identifiers, and order sentinels are not exposed through DB, API, Commander, artifacts, or external-agent context.
- API and desktop health distinguish `no_broker`, `not_configured`, `credential_configured`, `syncing`, `readonly_available`, `stale`, `failed`, and `mock_replay`.
- Commander answers account/holding facts only when a `production_snapshot` source and freshness metadata exist.
- Toss order create/modify/cancel remains unavailable.

## Hard Rules Still Active

- No Toss order create/modify/cancel implementation.
- No live trading.
- No automatic trading.
- No unofficial broker web/internal API.
- No real broker secrets, tokens, account numbers, account sequence values, order IDs, or personal identifiers in code, docs, tests, logs, DB, artifacts, API responses, Commander responses, or external-agent context.
- No UI copy that implies Toss is connected when only mock or not-configured mode is active.

## Recommended Next Slice

The next practical slice is Stage 4 MiroFish Scenario:

1. Keep MiroFish scenario work sidecar-only and no-order.
2. Package source/freshness-grounded portfolio, thesis, rule, journal, research, and weekly review context as scenario inputs.
3. Keep KIS implementation, live orders, order drafts, paper trading, and automation out of scope unless a later gate explicitly opens them.
4. Preserve the Stage 3 source/freshness and redaction boundaries when scenario artifacts reference memory or imported research.
