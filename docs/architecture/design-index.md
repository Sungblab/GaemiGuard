# GaemiGuard Design Index

Generated: 2026-06-04

This is the canonical map of the GaemiGuard design material currently in the repository.

## Product Decision Source

- `docs/gaemiguard-all-docs.html`: single-file readable bundle of project documents and raw appendices.
- `gaemiguard-design-spec.md`: locked 65/65 design survey result. This is the highest-level product and architecture source.
- `docs/gaemiguard-product-context.md`: earlier product context and module direction, now aligned to staged build language.
- `docs/agent-runtime-patterns.md`: generalized agent runtime patterns for Commander/specialist orchestration.
- `docs/roadmap.md`: staged development roadmap from foundation runtime to guarded automation.
- `docs/waterfall/00-master-plan.md`: gate-based waterfall operating plan.
- `docs/reviews/2026-06-04-ten-loop-planning-review.md`: ten-cycle plan/review/research planning log.
- `docs/research/2026-06-04-planning-research.md`: external research basis for the waterfall plan.
- `docs/setup/agent-assisted-setup.md`: agent-assisted one-click style setup contract.

## External API and Sidecar Source

- `docs/toss-invest-openapi.md`: agent-readable Toss Invest Open API summary.
- `vendor/tossinvest/openapi-1.0.3.json`: exact vendored OpenAPI source.
- `docs/mirofish-sidecar-porting.md`: Windows-native MiroFish sidecar decision and verification notes.
- `external/mirofish-cli/`: local MiroFish CLI fork/wrapper.
- `external/mirofish-original/`: original MiroFish source kept as a reference and process-boundary dependency.

## Prototype Source

- `prototypes/index.html`: static Toss-inspired prototype kept for visual reference.
- `prototypes/prototype-screenshot.png`: screenshot of the prototype.
- `docs/design/design-survey.html`: local survey UI used to collect design answers.
- `docs/design/design-qa.md`: earlier design question/answer notes.

## Locked Product Shape

- Product promise: "거래 전 한 번 더 생각하게 하는 투자 가드"
- First screen: Today Guard dashboard.
- Right sidebar: Commander Agent chat panel.
- Runtime: local-first desktop app, no Docker required for normal startup.
- Storage: SQLite plus Markdown/JSON artifacts.
- Toss: official Toss Invest Open API first.
- Agent model: internal Commander Agent plus specialists.
- MiroFish: scenario/price-analysis sidecar, never an order executor.
- Trading path: Order Guard, audit log, kill switch, approval/idempotency, and deterministic policy before any live order.

## Stage 1 Definition

Stage 1 is the foundation runtime:

- Local app shell.
- Local API.
- SQLite schema.
- Artifact writer.
- Commander chat panel.
- Deterministic specialist stubs.
- Permission engine.
- Order Guard dry-run.
- No live order submit.

The Stage 1 implementation plan lives at `docs/superpowers/plans/2026-06-04-stage-1-foundation.md`.

## Stage Gate Contracts

- `docs/stages/stage-1-foundation-gate.md`
- `docs/stages/stage-2-toss-readonly-connector.md`
- `docs/stages/stage-3-research-memory.md`
- `docs/stages/stage-4-mirofish-scenario.md`
- `docs/stages/stage-5-paper-trading-order-draft.md`
- `docs/stages/stage-6-guarded-live-orders.md`
- `docs/stages/stage-7-rule-based-automation.md`

## Waterfall Operating Documents

- `docs/waterfall/00-master-plan.md`
- `docs/waterfall/01-product-requirements.md`
- `docs/waterfall/02-system-architecture.md`
- `docs/waterfall/03-agent-orchestration.md`
- `docs/waterfall/04-permission-and-safety.md`
- `docs/waterfall/05-data-and-artifacts.md`
- `docs/waterfall/06-ui-and-workflows.md`
- `docs/waterfall/07-testing-and-release-gates.md`
- `docs/waterfall/08-change-control.md`
- `docs/waterfall/09-operating-model.md`
- `docs/waterfall/10-risk-register.md`
- `docs/waterfall/11-requirements-traceability-matrix.md`

## Open Source Operations

- `README.md`: Korean public entry point.
- `AGENTS.md`: coding-agent setup, verification, and safety instructions.
- `CONTRIBUTING.md`: contribution workflow and safety expectations.
- `SECURITY.md`: private vulnerability reporting policy.
- `CODE_OF_CONDUCT.md`: community conduct policy.
- `NOTICE`: project and license boundary notice.
- `THIRD_PARTY_NOTICES.md`: external component license boundary notes.
- `.github/workflows/ci.yml`: pull request and branch verification.
