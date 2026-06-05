# Testing And Release Gates

Generated: 2026-06-04

## Testing Strategy

GaemiGuard uses contract-first testing for external and sensitive behavior.

| Area | Required tests |
| --- | --- |
| Core policies | unit tests, table tests, property-style boundary tests |
| Broker adapters | adapter capability contract tests, OpenAPI contract tests for official API adapters, mock replay, rate-limit behavior |
| DB | migration tests, repository tests |
| Artifacts | schema tests, redaction snapshots |
| Agents | golden trace tests and tool-call timelines |
| UI | Playwright core workflow smoke tests through `pnpm smoke:desktop` |
| Sidecars | per-run contract and health tests |
| Order path | dry-run and paper-trade tests before live |
| Security | secret masking, injection, sandbox/allowlist tests |

## Stage Exit Evidence

Every stage exit requires:

- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- UI smoke where user-visible workflow changed
- For desktop UI work, use `pnpm smoke:desktop`; do not hand-roll a Vite preview background server on Windows.
- Stage-specific contract tests
- Updated docs
- Gate Review Record
- CI success on PR and main

## Manual Gate Evidence

For user-facing workflows, capture:

- Scenario.
- Exact command or UI path.
- Expected result.
- Actual result.
- Screenshot path if UI.
- Logs/artifact IDs.
- Known residual risk.

## Release Rules

- No direct merge without CI.
- No stage exit without gate record.
- No live order code path without separate security review.
- No automation code path without separate rule-authority review.
- No external provider/sidecar without health check and data-egress documentation.

## Failure Handling

If a gate fails:

- Keep stage open.
- Record failure in the Gate Review Record.
- Decide whether to fix, defer, or change scope through change control.
- Do not relabel incomplete work as accepted.

## Quality Bar

The goal is not only passing tests. The gate must prove:

- The intended workflow works.
- Forbidden behavior is blocked.
- Sensitive data is protected.
- User-facing explanation is clear.
- The next stage can safely depend on this stage.
