# Stage 4 Gate: MiroFish Scenario

Generated: 2026-06-04

Prepared: 2026-06-07

## Objective

Connect MiroFish as a Windows-native local sidecar for scenario analysis and future-price questions framed as conditional scenarios.

## Entry Criteria

- Stage 3 memory and research context accepted. Status: complete in `docs/reviews/2026-06-06-stage-3-research-memory-gate-review.md`.
- MiroFish local doctor command passes. Status: required for the first Stage 4 implementation PR.
- Sidecar sandbox/allowlist policy is documented. Status: initial policy is in this document and `docs/mirofish-sidecar-porting.md`; implementation must enforce it before exit.

## Preparation Status

Stage 4 is prepared but not implemented.

The first Stage 4 slice should prove the scenario contract without adding live trading, paper trading, or order drafts:

1. Add a local MiroFish sidecar capability/health contract that can report `not_configured`, `available`, and `failed`.
2. Build a scenario input package from selected symbol, selected chart range, local manual holdings/watchlist, usable Stage 3 memory/research recall, and weekly review artifacts.
3. Write scenario input/output Markdown and JSON artifacts.
4. Surface sidecar status and scenario artifact links in the existing desktop structure.
5. Keep all order paths blocked and keep MiroFish results labeled as conditional scenarios, not predictions.

Do not install or vendor MiroFish automatically. Use the existing `external/mirofish-cli` notes only when the user explicitly asks to run or configure the sidecar locally.

## In Scope

- MiroFish sidecar health check.
- Scenario input package builder.
- Price/volume CSV export.
- Selected chart range context.
- Portfolio exposure summary.
- Thesis/rule/research summary.
- Scenario run artifacts.
- Scenario comparison.
- Uncertainty and assumption display.

## Out Of Scope

- MiroFish placing orders.
- MiroFish directly triggering order drafts.
- Guaranteed future price language.
- Docker-only startup.

## Sidecar Contract

Every MiroFish run must include:

- `run_id`
- `request_id`
- `sidecar_name`
- `sidecar_version`
- `working_dir`
- input artifact paths
- output artifact paths
- model/provider
- source snapshot
- assumptions
- started/finished timestamps
- status/error/warnings
- license boundary

The Stage 4 implementation must also record:

- explicit source/freshness summary for every Stage 3 memory/research/report input
- redaction status
- whether the sidecar ran, was skipped, or failed
- sanitized error code/message when failed
- order authority state, which must remain blocked

## Sidecar Sandbox / Allowlist Policy

- Allowed input paths are generated GaemiGuard artifacts and explicit user-selected local files only.
- Do not send raw broker tokens, raw account numbers, account sequence values, order IDs, OAuth tokens, or personal identifiers to MiroFish.
- Do not let MiroFish write outside the configured run artifact directory.
- Do not let MiroFish place, schedule, draft, or mutate orders.
- A failed or missing sidecar must not break account, memory, research, or weekly review flows.

## UI Contract

UI must show:

- Selected chart range.
- Scenario assumptions.
- Scenario output.
- Risk factors.
- Source and input artifact links.
- "not guaranteed prediction" copy.

## Agent Contract

Commander can answer:

- "이 구간 이후 왜 떨어졌고 앞으로 어떤 조건이면 반등 가능해?"
- "내 보유 비중 기준으로 이 시나리오가 위험한지 봐줘"

Commander cannot:

- treat MiroFish result as deterministic forecast
- submit or schedule orders from scenario alone

## Exit Gate

Stage 4 exits when:

- Sidecar contract tests pass.
- Scenario run writes Markdown and JSON artifacts.
- Failed sidecar runs do not break account/research flows.
- UI scenario flow works.
- Order paths remain blocked.

## First Slice Verification

- `pnpm verify`
- `pnpm smoke:desktop`, if the desktop scenario surface changes
- Contract tests proving sidecar missing/failure states are safe
- Artifact tests proving scenario inputs include source/freshness and redaction metadata
