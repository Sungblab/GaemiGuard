# GaemiGuard Documentation Hub

This is the routing page for the repository documentation. Use it to decide what to read before changing code.

## Start Here

| Need | Read |
| --- | --- |
| Agent entry point and short routing | `docs/agent-index.md` |
| Current implementation state and next work | `docs/development-status.md` |
| Development history by PR | `docs/development-history.md` |
| Product direction | `docs/product/agent-first-direction.md` |
| Broker and trading direction | `docs/product/broker-connection-and-trading.md` |
| External tools and data direction | `docs/product/external-tools-and-data.md` |
| Agent instructions and safety rules | `AGENTS.md` |
| Overall development model | `docs/waterfall/00-master-plan.md` |
| Stage sequence | `docs/roadmap.md` |
| All docs in one browser-readable file | `docs/gaemiguard-all-docs.html` |

## Source-Of-Truth Layers

| Layer | Canonical docs | Purpose |
| --- | --- | --- |
| Agent routing | `docs/agent-index.md` | Short read order, handoff policy, and harness commands. |
| Current state | `docs/development-status.md` | What is done, active, blocked, and next. |
| Development history | `docs/development-history.md` | PR-by-PR record of how the repo reached the current state. |
| Product shape | `docs/product/agent-first-direction.md`, `docs/product/broker-connection-and-trading.md`, `docs/product/external-tools-and-data.md`, `gaemiguard-design-spec.md`, `docs/gaemiguard-product-context.md` | Current agent-first product direction, broker/trading authority, external tool policy, product promise, target workflows, and long-running context. |
| Waterfall governance | `docs/waterfall/00-master-plan.md`, `docs/waterfall/` | Stage policy, safety model, gates, risks, and traceability. |
| Stage contracts | `docs/stages/` | Per-stage scope, non-scope, contracts, tests, and exit criteria. |
| Architecture | `docs/architecture/agent-runtime.md`, `docs/architecture/design-index.md`, `docs/architecture/maps/README.md` | Runtime ownership, document index, and code-to-doc routing. |
| External API and sidecars | `docs/product/external-tools-and-data.md`, `docs/toss-invest-openapi.md`, `vendor/tossinvest/openapi-1.0.3.json`, `docs/mirofish-sidecar-porting.md` | External tool priority, official API snapshot, and sidecar boundaries. |
| Workflow and verification | `docs/contributing/workflow.md`, `docs/testing/strategy.md`, `docs/setup/playwright-smoke.md` | Devflow, gates, setup, and smoke verification. |

## Active Stage

Stage 2, Broker Connection Foundation, is in progress. The current implemented slice is the Toss read-only adapter and snapshot persistence.

Read these together for Stage 2 work:

1. `docs/development-status.md`
2. `docs/agent-index.md`
3. `docs/product/broker-connection-and-trading.md`
4. `docs/stages/stage-2-toss-readonly-connector.md`
5. `docs/toss-invest-openapi.md`
6. `vendor/tossinvest/openapi-1.0.3.json`
7. `docs/architecture/agent-runtime.md`
8. `docs/architecture/maps/README.md`

## Workflow Documents

| Document | Role |
| --- | --- |
| `AGENTS.md` | Short agent-facing rules: read order, setup, safety, verification, handoff format. |
| `docs/agent-index.md` | Short agent-facing index for current work, history, handoffs, and harness commands. |
| `docs/contributing/workflow.md` | Devflow workflow and finish requirements. |
| `docs/testing/strategy.md` | Verification gates and when to run desktop smoke. |
| `docs/setup/agent-assisted-setup.md` | Setup contract for agent-assisted local installation. |
| `docs/setup/playwright-smoke.md` | Windows-safe Playwright smoke details. |

## Product Documents

| Document | Role |
| --- | --- |
| `docs/product/README.md` | Product-document index. |
| `docs/product/agent-first-direction.md` | Current direction: personal investment agent first; investment guard and local terminal surfaces support that agent. |
| `docs/product/broker-connection-and-trading.md` | Broker adapter contract direction, no-broker mode, manual trading, and automation authority. |
| `docs/product/external-tools-and-data.md` | External tool priority and OpenDART/KRX/Fincept/open-source reuse policy. |

## Maintenance Rules

- Keep `docs/development-status.md` current after each meaningful feature, docs, harness, or verification slice.
- Keep `docs/development-history.md` current when a PR is merged or when older PR history is corrected.
- Keep `docs/agent-index.md` current when the read order, handoff style, or harness gates change.
- Update the active `docs/stages/` gate when scope, completed work, or remaining gaps change.
- Update `docs/architecture/maps/README.md` when ownership between docs, code paths, and verification gates changes.
- Run `pnpm docs:agent-check` after changing agent-facing docs.
- Run `pnpm docs:html` after any documentation change.
- Run `pnpm verify` before claiming the repository is healthy.
- Write future next-session prompts in the `/goal` format documented in `docs/development-status.md`.
