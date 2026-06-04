# Operating Model

Generated: 2026-06-04

## Roles

| Role | Responsibility |
| --- | --- |
| Product owner | Product promise, stage scope, user workflow |
| Architecture owner | Runtime boundaries, sidecar contracts, module design |
| Security owner | Secrets, sandbox, data egress, redaction |
| Investment safety owner | Advice boundary, order guard, risk copy |
| QA owner | Tests, gate evidence, regression checks |
| Release owner | CI, PR, branch protection, changelog |

For now, one maintainer may hold all roles, but every gate review must still answer from each role's perspective.

## Meeting Equivalents

Because this is an open-source solo-led project, documents replace many meetings.

| Company meeting | Repo equivalent |
| --- | --- |
| Product requirements review | Waterfall PRD and stage spec |
| Architecture review | Architecture doc and PR review |
| Security review | Permission/safety doc and security checklist |
| QA signoff | Gate Review Record |
| Release readiness | CI, changelog, README update |
| Postmortem | Issue or review doc with root cause |

## Stage Review Checklist

1. Product value is specific.
2. Non-goals are explicit.
3. External dependencies are named.
4. Data classification is updated.
5. Permission matrix is updated.
6. Test plan is executable.
7. UI states are specified.
8. Failure modes are specified.
9. Docs are linked.
10. Next stage dependency is clear.

## Branching

- `main`: accepted stage output.
- `stage-N-*`: stage implementation branch.
- `docs/*`: planning and documentation branches.
- Dependabot branches: dependency maintenance only.

## PR Rules

Every PR should include:

- Change summary.
- Stage affected.
- Verification commands.
- Security/investment impact.
- Remaining risks.

Stage PRs should not mix unrelated product changes.
