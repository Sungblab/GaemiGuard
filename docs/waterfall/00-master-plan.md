# GaemiGuard Waterfall Master Plan

Generated: 2026-06-04

## Decision

GaemiGuard will use **Gate-Based Waterfall**.

This means all major product stages are planned before implementation. Each stage has a fixed contract: objective, scope, non-scope, architecture impact, data contract, permission contract, UI contract, tests, and exit gate. A later stage can change an earlier decision only through the change-control process.

This is not a small MVP plan. It is a staged build plan for a local-first personal investment agent, broker adapter runtime, investment guard, and trading authority system.

## Product Promise

**한국 개인투자자를 위한 로컬 개인 투자 에이전트**

GaemiGuard owns the decision-to-order workflow. Official broker APIs are the execution rails; GaemiGuard owns judgment, evidence, trading authority, approval, audit, and automation boundaries.

## Strategic Scope

GaemiGuard is:

- A local-first desktop personal investment agent.
- A broker-independent adapter runtime for Toss, KIS, future brokers, manual portfolio entry, and CSV import.
- A Commander Agent workspace for account-aware and no-broker investing.
- A research, memory, scenario, and order-review orchestrator.
- A stage-gated path toward user-approved manual live orders and rule-based automation.

GaemiGuard is not:

- A generic mobile brokerage app.
- A profit guarantee bot.
- A high-frequency trading system.
- A social trading/community product.
- An unofficial broker web-internal API wrapper.
- A public broker aggregation API business.

## Stage Sequence

| Stage | Name | Primary proof | Hard forbidden until stage exit |
| --- | --- | --- | --- |
| 1 | Foundation Runtime | App/API/DB/artifacts/Commander/Order Guard dry-run work locally | Broker credentials, live orders, automation |
| 2 | Broker Connection Foundation | Broker adapter contract plus current Toss read-only adapter populate account and market context | Order create/modify/cancel |
| 3 | Research And Memory | Thesis, rules, journal, and sourced research become queryable | Forecast-driven order decisions |
| 4 | MiroFish Scenario | Scenario runs produce auditable artifacts from selected chart/account context | MiroFish-triggered orders |
| 5 | Paper Trading And Order Draft | Order drafts and paper trades pass deterministic guard checks | Live order submission |
| 6 | Guarded Manual Live Orders | User-approved limited live orders with kill switch and audit | Unattended rule automation |
| 7 | Rule-Based Automation | User-defined rules can execute within bounded authority | Unbounded automation |

## Governance Model

Every stage must produce:

- Stage specification.
- Design review.
- Implementation plan.
- Test plan.
- Security review.
- Gate review record.
- Updated README/roadmap if public behavior changes.

Every stage must answer:

- What user value is unlocked?
- What actions are forbidden?
- What data is stored?
- What can leave the local machine?
- What agent can do what?
- What must be approved by the user?
- What proves the stage is complete?
- What evidence blocks the next stage?

Cross-cutting planning evidence:

- `docs/waterfall/10-risk-register.md`
- `docs/waterfall/11-requirements-traceability-matrix.md`

## Default Policy

- Local-first by default.
- Remote sync off by default.
- Broker-independent core by default.
- Official broker APIs only.
- Toss read-only is the first implemented adapter slice.
- KIS requires source notes and capability mapping before implementation.
- No-broker/manual portfolio mode must remain possible.
- Secrets in OS credential store.
- Sensitive data masked before external model/tool calls.
- Agent runs logged.
- Artifacts written for important analysis and order decisions.
- Manual live orders disabled until Stage 6.
- Automation disabled until Stage 7.

## Company-Style Review Cadence

For each stage:

1. Product Review: scope, user workflow, non-goals.
2. Architecture Review: module boundaries, sidecar contracts, failure modes.
3. Security Review: secrets, redaction, sandbox, tool permissions.
4. Investment Safety Review: user responsibility, risk copy, guardrails.
5. QA Review: unit, contract, integration, UI, replay, regression tests.
6. Release Review: docs, changelog, version, rollback, telemetry/local logs.

## Current State

Stage 1 foundation exists in the codebase and passes CI.

Stage 2 Broker Connection Foundation is complete: Toss read-only adapter, mock and production snapshot sync, OS credential-store boundary, setup/disconnect API, freshness/failure metadata, desktop freshness status, Commander production snapshot grounding, and security/gate review are implemented.

Stage 3 Research And Memory is complete: thesis/rule/journal/research authoring, explicit local Markdown/CSV import, source/freshness-gated recall, weekly review artifacts, desktop visibility, and gate review are implemented.

Stage 4 MiroFish Scenario is active. The first implementation slice is prepared in `docs/handoffs/2026-06-07-stage-4-mirofish-first-slice.md`.
