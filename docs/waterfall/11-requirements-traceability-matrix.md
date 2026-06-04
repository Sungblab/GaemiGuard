# Requirements Traceability Matrix

Generated: 2026-06-04

This matrix maps product requirements to stage contracts and verification evidence.

| Requirement | Source | Stage | Verification evidence |
| --- | --- | --- | --- |
| Product promise is an investment guard, not broker clone | `gaemiguard-design-spec.md`, PRD | all | README, PRD, UI workflow docs |
| Today Guard is first screen | `gaemiguard-design-spec.md` | 1+ | Desktop UI smoke, UI spec |
| Right sidebar is Commander Agent panel | user decision, Stage 1 docs | 1+ | UI smoke, agent runtime docs |
| Internal Commander Agent supervises specialists | user decision, agent runtime docs | 1+ | Agent timeline tests, orchestration docs |
| Codex CLI is provider/tool adapter, not runtime owner | design spec, research | 3+ | provider adapter contract, permission docs |
| Toss official Open API is default | design spec, research | 2+ | connector tests, no unofficial dependency in production path |
| Stage 2 is read-only | roadmap, Stage 2 gate | 2 | mutation endpoint block tests |
| MiroFish is scenario/advisory only | design spec, MiroFish doc | 4+ | sidecar contract tests, order block tests |
| SQLite + Markdown/JSON artifacts are system of record | design spec | 1+ | DB tests, artifact schema tests |
| Secrets use OS credential store | design spec | 2+ | credential-store tests, no secret in SQLite/artifact snapshots |
| Account data is masked before external tools | design spec, security docs | 2+ | redaction snapshot tests |
| General permission and trading authority are separate | design spec, permission docs | 1+ | permission engine tests |
| Live orders disabled until Stage 6 | roadmap, safety docs | 1-5 | hard block tests |
| Automation disabled until Stage 7 | roadmap, safety docs | 1-6 | hard block tests |
| Order approval shows full risk context | design spec | 5+ | UI approval smoke, order review tests |
| Order uses idempotency key | Toss OpenAPI notes, Stage 5/6 | 5+ | idempotency unit/contract tests |
| Kill switch exists globally and per rule | design spec | 5+ | kill switch tests |
| Every sensitive run has audit log | design spec, safety docs | 1+ | audit write tests |
| Financial AI copy avoids profit guarantee | design spec, research | all | UI copy review, docs review |
| Stage cannot exit without gate record | waterfall master plan | all | Gate Review Record in stage PR |

## Gap Policy

If a requirement has no verification evidence, the stage cannot exit.

If a requirement maps to a future stage, earlier stages must still block behavior that would prematurely satisfy it unsafely.
