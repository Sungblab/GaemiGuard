# GaemiGuard Documentation Hub

This is the routing page for the repository documentation. Use it to decide what to read before changing code.

## Start Here

| Need | Read |
| --- | --- |
| Current implementation state and next work | `docs/development-status.md` |
| Agent instructions and safety rules | `AGENTS.md` |
| Overall development model | `docs/waterfall/00-master-plan.md` |
| Stage sequence | `docs/roadmap.md` |
| All docs in one browser-readable file | `docs/gaemiguard-all-docs.html` |

## Source-Of-Truth Layers

| Layer | Canonical docs | Purpose |
| --- | --- | --- |
| Current state | `docs/development-status.md` | What is done, active, blocked, and next. |
| Product shape | `gaemiguard-design-spec.md`, `docs/gaemiguard-product-context.md` | Product promise, target workflows, and long-running context. |
| Waterfall governance | `docs/waterfall/00-master-plan.md`, `docs/waterfall/` | Stage policy, safety model, gates, risks, and traceability. |
| Stage contracts | `docs/stages/` | Per-stage scope, non-scope, contracts, tests, and exit criteria. |
| Architecture | `docs/architecture/agent-runtime.md`, `docs/architecture/design-index.md`, `docs/architecture/maps/README.md` | Runtime ownership, document index, and code-to-doc routing. |
| External API and sidecars | `docs/toss-invest-openapi.md`, `vendor/tossinvest/openapi-1.0.3.json`, `docs/mirofish-sidecar-porting.md` | Official API snapshot and sidecar boundaries. |
| Workflow and verification | `docs/contributing/workflow.md`, `docs/testing/strategy.md`, `docs/setup/playwright-smoke.md` | Devflow, gates, setup, and smoke verification. |

## Active Stage

Stage 2, Toss Readonly Connector, is in progress.

Read these together for Stage 2 work:

1. `docs/development-status.md`
2. `docs/stages/stage-2-toss-readonly-connector.md`
3. `docs/toss-invest-openapi.md`
4. `vendor/tossinvest/openapi-1.0.3.json`
5. `docs/architecture/agent-runtime.md`
6. `docs/architecture/maps/README.md`

## Workflow Documents

| Document | Role |
| --- | --- |
| `AGENTS.md` | Short agent-facing rules: read order, setup, safety, verification, handoff format. |
| `docs/contributing/workflow.md` | Devflow workflow and finish requirements. |
| `docs/testing/strategy.md` | Verification gates and when to run desktop smoke. |
| `docs/setup/agent-assisted-setup.md` | Setup contract for agent-assisted local installation. |
| `docs/setup/playwright-smoke.md` | Windows-safe Playwright smoke details. |

## Maintenance Rules

- Keep `docs/development-status.md` current after each meaningful feature, docs, harness, or verification slice.
- Update the active `docs/stages/` gate when scope, completed work, or remaining gaps change.
- Update `docs/architecture/maps/README.md` when ownership between docs, code paths, and verification gates changes.
- Run `pnpm docs:html` after any documentation change.
- Run `pnpm verify` before claiming the repository is healthy.
- Write future next-session prompts in the `/goal` format documented in `docs/development-status.md`.
