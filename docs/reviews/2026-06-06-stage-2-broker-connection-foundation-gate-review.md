# Stage 2 Broker Connection Foundation Gate Review

Date: 2026-06-06

Decision: accepted

## Scope Reviewed

- Broker-independent `BrokerAdapter` contract and Toss as the first official read-only adapter.
- No-broker/manual portfolio foundation.
- Toss credential setup/disconnect behind the OS credential-store boundary.
- Real Toss read-only sync using production credentials through the existing snapshot repository.
- Freshness, stale, failed, retry, and source metadata in DB/API/UI/Commander.
- Security boundaries for broker secrets, OAuth tokens, account sequence values, raw account identifiers, order identifiers, artifacts, API responses, Commander context, and external-agent context.
- Preservation of the Stage 2 order mutation block.

## Accepted Evidence

- Credential setup and disconnect are represented by `GET`, `PUT`, and `DELETE /settings/brokers/toss/credentials`.
- Production credential storage uses the OS credential store through `packages/core/src/toss-credential-store.ts`; tests use only `createInMemoryTossCredentialStore`.
- `POST /sync/toss/read-only` runs the production read-only sync path and writes sanitized snapshots through `TossReadonlySnapshotRepository`.
- Raw Toss account sequence values are used only in memory when calling account-scoped Toss read APIs.
- SQLite stores masked account references, snapshot data, rate-limit metadata, sync logs, failure category, retry-after seconds, and next retry time.
- API health distinguishes `no_broker`, `not_configured`, `credential_configured`, `syncing`, `readonly_available`, `stale`, `failed`, and `mock_replay`.
- Desktop UI displays broker/freshness status from health and does not render credential-only or mock mode as a real connection.
- Commander answers account/holding facts only from `production_snapshot` freshness plus stored snapshots; mock/no-source cases clearly say the fact is unknown.
- Tests cover non-exposure of raw secret/token/account sequence/raw account/order sentinel values in DB, API, Commander, artifacts, and external-agent context.
- Toss order create, modify, and cancel remain unavailable and hard-blocked.

## Verification Evidence

- `pnpm docs:agent-check` passed.
- `pnpm docs:html` passed and regenerated `docs/gaemiguard-all-docs.html`.
- `pnpm test` passed: 9 test files, 32 tests.
- `pnpm typecheck` passed across shared, core, DB, API, and desktop packages.
- `pnpm verify` passed: test, typecheck, and build.
- `pnpm smoke:desktop` passed: favicon 200, blocked order banner, Commander review card, run-log toggle, composer input re-enabled, and console clean.

PR CI and main CI must still pass before the branch is considered merged into `main`.

## Residual Boundaries

- Stage 2 does not implement order drafts, paper trading, manual live orders, or automation.
- Stage 2 does not call Toss order create/modify/cancel or unofficial broker APIs.
- Stage 2 does not add KIS, Kiwoom, LS, OpenBB, Hermes, MiroFish, OpenDART, or KRX integrations.
- Stage 3 should build research and memory on top of accepted source/freshness/redaction boundaries.
