# GaemiGuard Design Index

Generated: 2026-06-04

This is the canonical map of the GaemiGuard design material currently in the repository.

## Product Decision Source

- `gaemiguard-design-spec.md`: locked 65/65 design survey result. This is the highest-level product and architecture source.
- `docs/gaemiguard-product-context.md`: earlier product context and module direction, now aligned to staged build language.
- `docs/agent-example-reverse-engineering.md`: extracted agent-runtime lessons from the local `agent-example` inspection.
- `docs/roadmap.md`: staged development roadmap from foundation runtime to guarded automation.

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

## Open Source Operations

- `README.md`: Korean public entry point.
- `CONTRIBUTING.md`: contribution workflow and safety expectations.
- `SECURITY.md`: private vulnerability reporting policy.
- `CODE_OF_CONDUCT.md`: community conduct policy.
- `.github/workflows/ci.yml`: pull request and branch verification.
