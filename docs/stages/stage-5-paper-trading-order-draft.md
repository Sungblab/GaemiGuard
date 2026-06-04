# Stage 5 Gate: Paper Trading And Order Draft

Generated: 2026-06-04

## Objective

Create order drafts and paper-trading simulations that prove Order Guard, audit logs, idempotency, and approval surfaces before live orders.

## Entry Criteria

- Stage 4 scenario artifacts accepted.
- Compliance/security research refreshed.
- Order Guard deterministic rule table approved.

## In Scope

- Order draft builder.
- Buying power/sellable/commission read checks.
- Paper trade execution.
- Order Guard rule table.
- Risk report.
- Approval modal design.
- Audit log for draft and paper action.
- Idempotency key generation and local validation.

## Out Of Scope

- Live order submission.
- Live cancel/modify.
- Unattended automation.
- High-risk derivative automation.

## Required Order Guard Checks

- instrument identity
- market status
- account mapping
- data freshness
- cash/buying power
- sellable quantity
- fees/taxes estimate
- portfolio concentration
- sector concentration
- thesis exists
- rule violations
- cooldown
- repeated loss/revenge trade signal
- stock warning/trading halt
- MiroFish/Hermes risk signal
- kill switch
- approval expiry

## UI Contract

Order draft screen must show:

- side
- symbol
- market
- quantity
- price type
- estimated amount
- fees/taxes estimate
- post-order exposure
- cash impact
- linked thesis/rule
- guard pass/warn/block list
- uncertainty
- approval owner
- idempotency key

## Exit Gate

Stage 5 exits when:

- Order draft tests pass.
- Paper trade simulation tests pass.
- All hard blocks are covered by tests.
- Approval UI can approve/reject paper action.
- Audit log is written before paper action completes.
- Live Toss mutation endpoints remain blocked.
