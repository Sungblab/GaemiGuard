# Stage 6 Gate: Guarded Live Orders

Generated: 2026-06-04

## Objective

Enable limited user-approved live order submit/modify/cancel through official Toss API with Order Guard, kill switch, idempotency, and audit evidence.

## Entry Criteria

- Stage 5 paper trading accepted.
- External compliance/security review refreshed.
- Toss production access and terms reviewed.
- Emergency rollback and kill switch tested.

## In Scope

- User-approved live order submit.
- User-approved live cancel.
- User-approved live modify.
- High-value confirmation handling if required by Toss.
- Idempotency key handling.
- Order result reconciliation.
- Order status polling.
- Audit log and artifact record.
- Manual rollback/cancel guidance.

## Out Of Scope

- Unattended rule automation.
- Derivative automatic orders.
- Loss-recovery automation.
- External social-signal-driven orders.

## Live Order Preconditions

All must be true:

- Stage 6 trading authority enabled.
- Global kill switch off.
- Market/account/instrument verified.
- Fresh account and market data.
- Order Guard hard checks pass.
- User approval recorded.
- Approval not expired.
- Idempotency key generated and unused.
- Audit log write succeeds.
- Toss mutation request uses official API only.

## UI Contract

Live order approval must require explicit user action and show:

- full order summary
- risks and blocks
- data freshness
- final responsibility copy
- approval expiration
- idempotency key
- kill switch status

## Exit Gate

Stage 6 exits when:

- Live-order code path is tested with mock/replay before real execution.
- Real execution, if performed, uses tiny controlled order and records evidence.
- Cancel/modify failure modes are tested.
- Kill switch blocks live requests.
- Audit log is complete.
- No unattended automation path exists.
