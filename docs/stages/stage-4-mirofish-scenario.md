# Stage 4 Gate: MiroFish Scenario

Generated: 2026-06-04

## Objective

Connect MiroFish as a Windows-native local sidecar for scenario analysis and future-price questions framed as conditional scenarios.

## Entry Criteria

- Stage 3 memory and research context accepted.
- MiroFish local doctor command passes.
- Sidecar sandbox/allowlist policy is documented.

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
