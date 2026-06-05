# Stage 7 Gate: Rule-Based Automation

Generated: 2026-06-04

## Objective

Allow user-defined investment rules to trigger bounded automated trading actions under strict authority, audit, broker capability, and kill-switch controls.

## Entry Criteria

- Stage 6 guarded live orders accepted.
- Automation risk review complete.
- Rule engine and simulation history approved.
- User has explicit automation setup flow.
- Target broker adapter declares automation capability and has adapter-specific review evidence.

## In Scope

- User-authored automation rules.
- Rule simulation before activation.
- Per-rule limits.
- Per-rule kill switch.
- Schedule/trigger engine.
- Bounded live execution.
- Post-action report.
- Automatic stop on anomaly.

## Out Of Scope

- Unbounded strategy execution.
- Marketplace strategies.
- Social-signal-only trading.
- Leveraged/derivative automation by default.
- Loss-recovery auto averaging.

## Automation Preconditions

Every automated action must satisfy:

- Rule active.
- Rule was previously simulated.
- Rule has limits.
- Rule kill switch off.
- Global kill switch off.
- Account/instrument verified.
- Broker automation capability verified.
- Data freshness valid.
- Order Guard checks pass.
- Automation budget not exceeded.
- Audit log write succeeds.
- Post-action report is generated.

## UI Contract

Automation UI must show:

- rule status
- last simulation
- trigger condition
- max amount/quantity
- max frequency
- cooldown
- allowed market/instrument
- kill switch
- recent executions
- stop reason

## Exit Gate

Stage 7 exits when:

- Rule engine tests pass.
- Simulation/replay tests pass.
- Automation hard blocks pass.
- Kill switches stop scheduled and in-flight actions.
- Post-action reports are generated.
- User can disable automation immediately.
