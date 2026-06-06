# GaemiGuard Design Index

Generated: 2026-06-04
Last reorganized: 2026-06-05

This is the canonical index of GaemiGuard design and architecture material. It explains which document owns which truth so future agents do not have to infer project state from scattered files.

## Canonical Read Order

| Order | Document | Why |
| --- | --- | --- |
| 1 | `AGENTS.md` | Short operational rules for agents. |
| 2 | `docs/agent-index.md` | Short agent route, handoff policy, and harness commands. |
| 3 | `docs/development-status.md` | Current implementation state, active stage, latest verification, and next slice. |
| 4 | `docs/README.md` | Documentation hub and routing map. |
| 5 | `docs/product/agent-first-direction.md` | Current product identity and stage implications for agent-first investment workflows. |
| 6 | `docs/product/broker-connection-and-trading.md` | Broker adapter, no-broker mode, manual trading, and automation authority direction. |
| 7 | Active `docs/stages/` gate | The contract for the current implementation work. |
| 8 | `docs/architecture/maps/README.md` | Source docs to owning code paths and verification gates. |

## Truth Ownership

| Question | Source of truth | Supporting docs |
| --- | --- | --- |
| What is implemented now? | `docs/development-status.md` | `CHANGELOG.md`, latest Git history |
| How did the repo get here? | `docs/development-history.md` | PR list, latest Git history |
| What should an agent read first? | `docs/agent-index.md` | `AGENTS.md`, `docs/development-status.md` |
| What is the product promise? | `docs/product/agent-first-direction.md` | `docs/product/broker-connection-and-trading.md`, `docs/product/external-tools-and-data.md`, `gaemiguard-design-spec.md`, `docs/gaemiguard-product-context.md`, `README.md` |
| What is the build model? | `docs/waterfall/00-master-plan.md` | `docs/waterfall/07-testing-and-release-gates.md` |
| What stage is active? | `docs/development-status.md` | `docs/roadmap.md`, active stage gate |
| What is forbidden? | Active stage gate, `AGENTS.md` | `docs/waterfall/04-permission-and-safety.md` |
| Which code owns a behavior? | `docs/architecture/maps/README.md` | package source and tests |
| How should agents finish work? | `docs/contributing/workflow.md` | `plugins/devflow/skills/finish/SKILL.md` |

## Locked Product Shape

- Product promise: agent-first local personal investment workspace for Korean retail investors.
- Supporting surfaces: investment guard and small local investment terminal.
- Public short copy: "판단 점검부터 주문 실행까지 GaemiGuard에서 하되, 실제 연결은 공식 증권사 API로만 합니다."
- Broker model: broker-independent adapter contract; Toss is first implemented adapter slice, KIS is a future candidate.
- No-broker mode: local manual watchlist, holdings, and cash inputs are now represented in DB/API/service contracts; thesis/rules, CSV, research, scenarios, and sample data remain later extensions.
- First screen: Today Guard dashboard.
- Right sidebar: Commander Agent chat panel.
- Runtime: local-first desktop app, no Docker required for normal startup.
- Storage: SQLite plus Markdown/JSON artifacts.
- Broker APIs: official APIs only; no unofficial broker web/internal APIs.
- Agent model: internal Commander Agent plus specialists.
- MiroFish: scenario/price-analysis sidecar, never an order executor.
- Trading path: Order Guard, audit log, kill switch, approval/idempotency, and deterministic policy before manual live orders or automation.

## Stage Gate Contracts

| Stage | Gate document | Current status |
| --- | --- | --- |
| Stage 1 Foundation Runtime | `docs/stages/stage-1-foundation-gate.md` | Complete |
| Stage 2 Broker Connection Foundation | `docs/stages/stage-2-toss-readonly-connector.md` | In progress |
| Stage 3 Research And Memory | `docs/stages/stage-3-research-memory.md` | Not started |
| Stage 4 MiroFish Scenario | `docs/stages/stage-4-mirofish-scenario.md` | Not started |
| Stage 5 Paper Trading And Order Draft | `docs/stages/stage-5-paper-trading-order-draft.md` | Not started |
| Stage 6 Guarded Manual Live Orders | `docs/stages/stage-6-guarded-live-orders.md` | Locked |
| Stage 7 Rule-Based Automation | `docs/stages/stage-7-rule-based-automation.md` | Locked |

## Product And Research Sources

| Document | Role |
| --- | --- |
| `docs/product/README.md` | Product-document index. |
| `docs/product/agent-first-direction.md` | Current product direction and stage implications. |
| `docs/product/broker-connection-and-trading.md` | Broker adapter and trading authority direction. |
| `docs/product/external-tools-and-data.md` | External tools, public data, FinceptTerminal reference, and open-source reuse policy. |
| `gaemiguard-design-spec.md` | Original product and architecture decision source. |
| `docs/gaemiguard-product-context.md` | Longer product context and module direction. |
| `docs/agent-runtime-patterns.md` | Generalized Commander/specialist orchestration patterns. |
| `docs/reviews/2026-06-04-ten-loop-planning-review.md` | Ten-cycle planning review log. |
| `docs/research/2026-06-04-planning-research.md` | External research basis for the waterfall plan. |

## External API And Sidecar Sources

| Document | Role |
| --- | --- |
| `docs/toss-invest-openapi.md` | Agent-readable Toss Invest OpenAPI summary. |
| `vendor/tossinvest/openapi-1.0.3.json` | Exact vendored OpenAPI source. |
| `vendor/tossinvest/README.md` | Vendored source notes. |
| Future KIS source note | Required before implementing a KIS adapter. |
| `docs/mirofish-sidecar-porting.md` | Windows-native MiroFish sidecar decision and boundary. |
| `external/mirofish-cli/` | Local MiroFish CLI fork/wrapper, intentionally outside Git. |
| `external/mirofish-original/` | Original MiroFish source reference, intentionally outside Git. |

## Workflow And Operations Sources

| Document | Role |
| --- | --- |
| `AGENTS.md` | Concise coding-agent rules. |
| `docs/contributing/workflow.md` | Devflow workflow and finish contract. |
| `docs/testing/strategy.md` | Verification gate policy. |
| `docs/setup/agent-assisted-setup.md` | Agent-assisted setup contract. |
| `docs/setup/playwright-smoke.md` | Windows-safe UI smoke workflow. |
| `.devflow/config.json` | Devflow gates and required review evidence. |
| `plugins/devflow/` | Repo-local Codex/Claude Devflow harness. |
| `scripts/check-agent-docs.mjs` | Agent-facing document integrity check used by `pnpm docs:agent-check`. |

## Maintenance Rules

- Do not add a new top-level planning document unless `docs/README.md` and this index are updated.
- Do not add a new agent-facing document unless `docs/agent-index.md`, `docs/README.md`, and this index are updated.
- Do not move a stage boundary without updating the active stage gate and `docs/development-status.md`.
- Do not claim a stage is exited unless the stage gate evidence exists.
- Do not change agent read order or harness gates without running `pnpm docs:agent-check`.
- Do not update docs without regenerating `docs/gaemiguard-all-docs.html`.
- Keep agent-facing rules short in `AGENTS.md`; put detailed continuity and status in `docs/development-status.md`.
