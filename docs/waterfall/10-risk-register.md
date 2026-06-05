# Risk Register

Generated: 2026-06-04

## Risk Scale

| Level | Meaning |
| --- | --- |
| 1 | Low impact or easy recovery |
| 2 | Moderate impact, contained |
| 3 | Significant user trust or data risk |
| 4 | Financial/security impact possible |
| 5 | Live trading, legal, or severe data exposure risk |

## Product And Investment Risks

| ID | Risk | Stage | Impact | Likelihood | Mitigation | Gate owner |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | User treats scenario output as guaranteed prediction | 4 | 4 | 3 | Scenario wording, uncertainty, assumption list, no direct order trigger | Investment safety |
| R-002 | User approves impulsive order despite warnings | 5-6 | 4 | 3 | Cooldown checks, thesis requirement, explicit approval copy | Investment safety |
| R-003 | Product drifts into generic broker UI | all | 2 | 3 | PRD non-goals, Today Guard first screen | Product |
| R-004 | Automation exceeds user intent | 7 | 5 | 2 | Per-rule limits, kill switch, budget, replay tests | Architecture + safety |

## Technical Risks

| ID | Risk | Stage | Impact | Likelihood | Mitigation | Gate owner |
| --- | --- | --- | --- | --- | --- | --- |
| R-101 | Broker API version changes | 2+ | 4 | 3 | Adapter-specific source notes, OpenAPI/version checks, contract tests, mock replay | Architecture |
| R-102 | Rate limits break sync | 2+ | 3 | 3 | Header-aware backoff and sync status | Architecture |
| R-103 | Decimal precision error in money/quantity | 2+ | 5 | 2 | Decimal strings in core, tests for money paths | QA |
| R-104 | Sidecar failure blocks main app | 4+ | 3 | 3 | Health checks, isolated working dirs, graceful degradation | Architecture |
| R-105 | DB/artifact write failure loses audit evidence | 1+ | 5 | 2 | Block sensitive completion if audit write fails | QA |

## Security And Privacy Risks

| ID | Risk | Stage | Impact | Likelihood | Mitigation | Gate owner |
| --- | --- | --- | --- | --- | --- | --- |
| R-201 | Access token written to logs/artifacts | 2+ | 5 | 2 | Secret masking snapshots, credential-store boundary | Security |
| R-202 | Account identifiers sent to external LLM/tool | 2+ | 5 | 3 | Egress classification, redaction, sanitized portfolio summaries | Security |
| R-203 | Prompt/tool injection causes unsafe tool call | 3+ | 4 | 3 | Tool guardrails, allowlists, human review for sensitive actions | Security |
| R-204 | Sidecar shell execution escapes workspace | 4+ | 5 | 2 | Workspace-scoped execution, allow/deny lists, path validation | Security |

## Compliance And Governance Risks

| ID | Risk | Stage | Impact | Likelihood | Mitigation | Gate owner |
| --- | --- | --- | --- | --- | --- | --- |
| R-301 | Financial AI guidance changes before live trading | 5-7 | 4 | 3 | Refresh research before Stage 5, 6, 7 | Product + safety |
| R-302 | Unofficial broker API dependency creates terms risk | 2+ | 5 | 2 | Official broker APIs only; unofficial adapters disabled | Product |
| R-303 | Open-source issue leaks user secrets | all | 4 | 2 | SECURITY.md, issue warning, GitGuardian checks | Security |

## Risk Gate

Before each stage exits:

- New risks are added.
- Existing stage risks are re-scored.
- Mitigations are mapped to tests or docs.
- Impact 5 risks require explicit maintainer signoff.
