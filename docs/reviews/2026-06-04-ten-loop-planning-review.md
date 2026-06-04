# Ten-Loop Planning Review

Generated: 2026-06-04

Purpose: convert the conversation and existing repo into a company-grade waterfall plan by repeatedly planning, reviewing, researching, and tightening the design. This file is the evidence that the planning loop was run ten times.

## Loop 1: Product Boundary

**Plan:** Position GaemiGuard as an investment guard, not another brokerage app.

**Review:** The earlier design spec says the product promise is "거래 전 한 번 더 생각하게 하는 투자 가드" and explicitly rejects being a mobile brokerage app.

**Research:** Toss has an official Open API path, so GaemiGuard can focus on agentic guardrails around official broker access instead of reinventing a broker UI.

**Decision:** Product scope is a local-first agent terminal for safer investment decisions. Do not compete with Toss on fast trading UX.

**Change locked:** README, PRD, and UI spec must lead with guard/orchestrator language.

## Loop 2: Development Model

**Plan:** Use stage-gated waterfall instead of agile MVP.

**Review:** The user explicitly said not to do MVP and to build in stages. The risk profile involves accounts, orders, and automation.

**Research:** Financial AI guidance emphasizes governance, responsibility, reliability, and security. This fits formal gate reviews better than loose iteration.

**Decision:** Use Gate-Based Waterfall: all stages are designed up front; implementation proceeds one stage at a time.

**Change locked:** Every stage must define entry criteria, scope, forbidden work, acceptance tests, and exit gate.

## Loop 3: Toss API Boundary

**Plan:** Start Stage 2 with Toss official read-only connector.

**Review:** Current Stage 1 stubs intentionally defer credentials and real account data.

**Research:** Local OpenAPI 1.0.3 has read endpoints and order endpoints. The presence of order endpoints does not justify enabling mutation early.

**Decision:** Stage 2 includes auth, accounts, holdings, prices, orderbook, exchange rate, calendars, stock warnings.

**Change locked:** Stage 2 explicitly forbids create/modify/cancel order calls.

## Loop 4: Unofficial CLI Reference

**Plan:** Decide whether to integrate `tossinvest-cli`.

**Review:** The user flagged it as old or maybe unofficial. The repo itself says it is unofficial and uses web-internal APIs.

**Research:** Its safety model is useful: trading disabled by default, config gates, preview, permission grant TTL.

**Decision:** Use it only as a safety-pattern reference. Do not make it a production dependency.

**Change locked:** Official Toss Open API is the default. Experimental unofficial adapters require a separate change request.

## Loop 5: Commander Agent Architecture

**Plan:** Decide whether the internal orchestrator is necessary.

**Review:** The user insisted an internal agent is needed to command other agents. Current docs already identify `CommanderAgent`.

**Research:** Modern agent orchestration guidance supports multi-agent handoff and guardrails, but sensitive actions still need review.

**Decision:** Commander is a real runtime owner, not a UI router. It gathers context, delegates, supervises, and synthesizes.

**Change locked:** Specialist agents cannot bypass Commander or Order Guard.

## Loop 6: Permission Model

**Plan:** Model permissions like Codex, with user-visible modes.

**Review:** The user provided Codex approval-mode screenshot and asked to do it like that.

**Research:** Codex separates sandbox scope and approval policy. Agent guardrail docs separate automatic checks and human review.

**Decision:** General tool permission and order authority are separate matrices.

**Change locked:** `full_access` for local tools never grants live order permission.

## Loop 7: MiroFish Role

**Plan:** Connect MiroFish to future-price and scenario questions.

**Review:** Current MiroFish doc says Windows-native sidecar, Codex CLI provider, scenario simulation only.

**Research:** Sidecar tools with shell-like execution need sandbox/allowlist controls. Forecasting should be framed as scenario analysis, not guaranteed prediction.

**Decision:** MiroFish produces scenario artifacts and assumptions. It cannot place orders and cannot be the sole trigger for orders.

**Change locked:** Stage 4 introduces MiroFish; Stage 5+ may use its output as an Order Guard signal.

## Loop 8: Data, Memory, And Audit

**Plan:** Decide whether memory begins early or after connectors.

**Review:** User wants memory, weekly review, trade rationale, old price questions, and agent context.

**Research:** Financial AI guidance points toward traceability, data quality, explainability, and security checks.

**Decision:** SQLite + Markdown/JSON artifacts are the system of record. Temporal memory is built from audited events, not untraceable summaries.

**Change locked:** Every agent run, tool call, order review, approval, and artifact link is logged.

## Loop 9: UI And Operating Workflow

**Plan:** Choose main screen and interaction shape.

**Review:** User approved Toss-inspired UI and said right sidebar should be the agent chat panel.

**Research:** The product is operational, not marketing. Users need dense, scannable surfaces and clear risk/action status.

**Decision:** Today Guard dashboard plus persistent Commander panel. Charts are interactive question anchors.

**Change locked:** No landing-page-first app. The first screen is the working terminal/dashboard.

## Loop 10: Release Governance

**Plan:** Decide how stages move to production.

**Review:** Open-source repo is now public with CI and issue/PR templates.

**Research:** Financial AI and agent-tool guidance both favor review gates for sensitive behavior.

**Decision:** Each stage requires a Gate Review Record before merge. Stage 5+ additionally requires refreshed compliance/security research.

**Change locked:** No stage skip. No live order or automation without gate evidence.

## Final Planning Delta

The ten loops produce these changes:

- Replace "MVP" framing with Gate-Based Waterfall.
- Keep all seven stages designed up front.
- Promote Commander Agent to runtime owner.
- Separate general agent permissions from trading authority.
- Make Stage 2 official Toss read-only only.
- Treat unofficial Toss CLI as reference, not dependency.
- Treat MiroFish as scenario/advisory, not execution.
- Require audit, artifacts, and redaction from the beginning.
- Lock Today Guard + right Commander panel as the core UI.
- Require stage exit gates and change-control records.
