# GaemiGuard Planning Research

Generated: 2026-06-04

This research note supports the waterfall planning package. It is not legal, tax, or investment advice. It records product-planning evidence and constraints that should be revisited before Stage 5, Stage 6, and Stage 7.

Current note: later product decisions treat Toss as the first broker adapter slice, not as the product center or permanent default. See `docs/product/broker-connection-and-trading.md`.

## Source Summary

| Source | Date checked | Product implication |
| --- | --- | --- |
| Toss Invest Open API docs, `https://developers.tossinvest.com/docs` | 2026-06-04 | Official Toss integration is available through browser-rendered docs; repo keeps `vendor/tossinvest/openapi-1.0.3.json` for agent-readable work. |
| Local Toss OpenAPI snapshot, `vendor/tossinvest/openapi-1.0.3.json` | 2026-06-04 | Version 1.0.3 has 20 REST paths, OAuth2 client credentials, read APIs, order APIs, order-history APIs, buying-power/sellable/commission APIs. |
| `JungHoonGhae/tossinvest-cli`, `https://github.com/JungHoonGhae/tossinvest-cli` | 2026-06-04 | Useful reference for CLI command surface and safety patterns, but it says it is unofficial and uses web-internal APIs, so it must not become the default connector. |
| OpenAI Codex CLI docs, `https://developers.openai.com/codex/cli` | 2026-06-04 | Codex is a local coding agent that can read, change, and run code in the selected directory; GaemiGuard should treat Codex CLI as a provider/tool adapter, not as the trading authority. |
| OpenAI Codex approvals/security, `https://developers.openai.com/codex/agent-approvals-security` | 2026-06-04 | Codex-style policy separates sandbox scope from approval policy; GaemiGuard should mirror this pattern for non-trading tools while keeping trading authority separate. |
| OpenAI Agents guardrails/human review, `https://developers.openai.com/api/docs/guides/agents/guardrails-approvals` | 2026-06-04 | Sensitive actions should pause for human or policy approval; this supports an Order Guard interruption before live orders. |
| OpenAI local shell guidance, `https://developers.openai.com/api/docs/guides/tools-local-shell` | 2026-06-04 | Local tool execution should be sandboxed or protected by allow/deny lists; GaemiGuard sidecars and shell-like providers need explicit policy. |
| Korean Financial Services Commission AI guidance press release, `https://www.korea.kr/briefing/pressReleaseView.do?newsId=156460777` | 2026-06-04 | Financial AI services should be planned around trust, explainability, and governance; GaemiGuard should keep auditability and user responsibility visible. |
| Korean policy briefing on financial AI AX and guideline revision, `https://m.korea.kr/briefing/pressReleaseView.do?newsId=156736204` | 2026-06-04 | Recent official direction emphasizes AI governance, legality, supplementary role, reliability, financial stability, good faith, and security. |
| Financial AI security guideline page, `https://www.korea.kr/archive/expDocView.do?docId=40456` | 2026-06-04 | AI security planning should include data/model security, validation/evaluation, poisoning/extraction/inversion/evasion risks, and chatbot security checks. |

## Toss API Findings

The local OpenAPI snapshot says:

- API title: `토스증권 Open API`
- OpenAPI version: `3.1.0`
- API document version: `1.0.3`
- Base server: `https://openapi.tossinvest.com`
- Authentication: OAuth2 client credentials
- REST paths: 20

Planning consequences:

- Stage 2 must be official broker read-only first; the current implemented slice is Toss.
- Account-scoped calls must preserve account headers and never leak account identifiers to external LLMs or sidecars.
- Money, share quantity, and FX values must stay decimal strings through core accounting paths.
- Rate-limit headers and retry guidance must be first-class in the connector contract.
- Order paths exist in the OpenAPI snapshot, but Stage 2 must not call mutation endpoints.

## Unofficial CLI Findings

The `tossinvest-cli` repo is useful as a safety-pattern reference because it:

- Separates read commands from trading commands.
- Keeps trading disabled by default.
- Requires explicit config and permission tokens for order execution.
- Provides order preview before place/cancel/amend.
- Documents that it is not an official Toss product and may violate terms because it uses web-internal APIs.

Planning consequences:

- GaemiGuard may reuse the safety ideas, not the unofficial API dependency.
- Official broker APIs are the default integration policy. Toss is the first adapter slice, not the whole broker strategy.
- Unofficial CLI integration remains research-only unless the user explicitly enables a local experimental adapter.

## Agent And Permission Findings

Codex-like behavior is useful, but GaemiGuard cannot copy it blindly.

General tools:

- Can use Codex-style modes: read-only, workspace-write, approval on request, full local developer mode.
- Shell/sidecar execution needs sandboxing or allow/deny lists.
- Tool calls need trace records, cost/time metadata, and error states.

Trading tools:

- Must use a separate order authority.
- Must have Order Guard checks, audit log, kill switch, approval, and idempotency before live mutation.
- Must never treat `full_access` developer mode as trading permission.

## Financial AI Planning Findings

Official Korean financial AI guidance points toward:

- Governance and responsibility
- Legality and periodic checks
- AI as a supplementary tool
- Reliability, data quality, model performance, explainability
- Financial stability, emergency stop, backup controls
- Consumer protection and clear notice
- Security controls for AI-specific threats

Planning consequences:

- Product copy must say decision support, not guaranteed profit.
- Stage gates must include model/data validation and user-facing uncertainty.
- High-risk functions must have kill switch and fallback states.
- Security test gates must cover prompt/tool injection, secret leakage, and artifact redaction.

## Research Risks To Revisit

- Broker API terms and production approval processes may change.
- OpenAPI 1.0.3 may be superseded; every Toss adapter stage needs version check, and every new broker adapter needs its own source note and capability map.
- Korean AI/financial guidance is evolving; Stage 5+ must refresh legal/compliance research before implementation.
- MiroFish license and sidecar boundary must be checked before distribution.
- OpenAI Codex CLI behavior and approval modes change frequently; provider adapter must detect version and expose capability health.
