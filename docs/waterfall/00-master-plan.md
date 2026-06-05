# GaemiGuard Waterfall Master Plan

Generated: 2026-06-04

## Decision

GaemiGuard will use **Gate-Based Waterfall**.

This means all major product stages are planned before implementation. Each stage has a fixed contract: objective, scope, non-scope, architecture impact, data contract, permission contract, UI contract, tests, and exit gate. A later stage can change an earlier decision only through the change-control process.

This is not a small MVP plan. It is a staged build plan for a local-first investment guard and agent orchestrator.

## Product Promise

**거래 전 한 번 더 생각하게 하는 투자 가드**

Toss makes trading easy. GaemiGuard makes judgment safer.

## Strategic Scope

GaemiGuard is:

- A local-first desktop investment guard.
- A Commander Agent terminal for account-aware investing.
- A research, memory, scenario, and order-review orchestrator.
- A stage-gated path toward guarded live orders and rule-based automation.

GaemiGuard is not:

- A generic mobile brokerage app.
- A profit guarantee bot.
- A high-frequency trading system.
- A social trading/community product.
- An unofficial Toss web-internal API wrapper.

## Stage Sequence

| Stage | Name | Primary proof | Hard forbidden until stage exit |
| --- | --- | --- | --- |
| 1 | Foundation Runtime | App/API/DB/artifacts/Commander/Order Guard dry-run work locally | Toss credentials, live orders, automation |
| 2 | Toss Readonly Connector | Official Toss read APIs populate account and market context | Order create/modify/cancel |
| 3 | Research And Memory | Thesis, rules, journal, and sourced research become queryable | Forecast-driven order decisions |
| 4 | MiroFish Scenario | Scenario runs produce auditable artifacts from selected chart/account context | MiroFish-triggered orders |
| 5 | Paper Trading And Order Draft | Order drafts and paper trades pass deterministic guard checks | Live order submission |
| 6 | Guarded Live Orders | User-approved limited live orders with kill switch and audit | Unattended rule automation |
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
- Toss official API first.
- Secrets in OS credential store.
- Sensitive data masked before external model/tool calls.
- Agent runs logged.
- Artifacts written for important analysis and order decisions.
- Live orders disabled until Stage 6.
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

Stage 1 foundation exists in the codebase and passes CI. Stage 2 has started with a first Toss read-only connector slice: official operation constants, connector/client skeleton, mock credential/token boundary, API health wiring, and Commander/BrokerToss read-only tool contract. Stage 2 is not exited until the full read-only workflow, persistence, UI, security review, and gate evidence are complete.
