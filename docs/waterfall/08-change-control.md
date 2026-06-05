# Change Control

Generated: 2026-06-04

## Purpose

Because GaemiGuard is stage-gated, scope changes must be recorded. This prevents accidental agile drift into unsafe trading behavior.

## Change Request Template

Every material change request must record:

```text
Change ID:
Requested by:
Date:
Affected stage:
Affected documents:
Affected code modules:
Reason:
Decision:
Risk impact:
Security impact:
Trading authority impact:
Data/artifact impact:
Test impact:
Rollback plan:
Approver:
```

## Change Classes

| Class | Examples | Approval |
| --- | --- | --- |
| Editorial | typo, wording, broken link | maintainer |
| Scope clarification | refine acceptance criteria | maintainer |
| Architecture change | new sidecar, DB schema shift | architecture review |
| Security change | secrets, sandbox, provider egress | security review |
| Trading authority change | order submit/cancel/automation | explicit stage gate review |
| Legal/compliance change | advice boundary, data policy | external/legal review if needed |

## Non-Negotiable Controls

These cannot be relaxed through a minor change:

- Stage 2 remains broker-read only and must not open order mutations.
- Stage 4 MiroFish cannot execute orders.
- Stage 5 cannot submit live orders.
- Stage 6 is manual user-approved live orders only and cannot run unattended automation.
- Stage 7 automation must remain bounded by user rules and kill switch.
- `full_access` local developer mode cannot imply trading permission.

Clarification: Stage 2 being read-only is an implementation gate, not the final product boundary. The final product direction includes manual trading and rule-based automation after their approved stages.

## Change Log Location

Stage-specific changes go in the stage document under `Change Log`.

Cross-stage or product-level changes go in:

- `docs/waterfall/00-master-plan.md`
- `docs/waterfall/08-change-control.md`
- `CHANGELOG.md` if public behavior changed

## Change Gate

No change is accepted until:

- Affected docs are updated.
- Tests or gate criteria are updated.
- Review owner is named.
- Risk impact is explicit.
