# Permission And Safety

Generated: 2026-06-04

## Core Rule

General agent permissions and trading authority are separate.

Developer-style `full_access` for local files, shell, or providers never grants permission to submit, modify, cancel, or automate live orders.

Read-only is only the current broker-connection implementation boundary. The long-term product includes manual trading and rule-based automation, but only through separate trading authority levels.

## General Permission Modes

| Mode | User-facing label | Allowed by default | Requires approval |
| --- | --- | --- | --- |
| `ask` | Ask for approval | Read local/project data | External writes, shell, network, sidecars, memory writes |
| `approve_for_me` | Approve for me | Read, safe local writes, low-risk deterministic tools | Unsafe shell, external network, secrets, sidecars |
| `full_access` | Full access | Local developer actions inside configured workspace | Anything outside workspace, secrets, all trading actions |

## Trading Authority Levels

| Level | Name | Allowed |
| --- | --- | --- |
| 0 | No trading | No broker connection, sample data, manual portfolio, watchlist, thesis/rule work |
| 1 | Broker read | Read-only account/market data |
| 2 | Order analysis | Buying-power, sellable quantity, commission checks |
| 3 | Dry-run | Order draft and deterministic review |
| 4 | Paper trade | Simulated execution only |
| 5 | User-approved manual live | Submit/modify/cancel only after explicit approval |
| 6 | Rule-limited automation | Bounded automation under active rule, kill switch, and audit |

## Hard Blocks

Always block:

- Manual live orders before Stage 6.
- Automation before Stage 7.
- Any order while global kill switch is active.
- Any order without fresh account snapshot.
- Any order without idempotency key.
- Any order without audit-log write success.
- Any order with expired approval.
- Any order if instrument identity cannot be verified.
- Any order if account header/account mapping is ambiguous.
- Any broker adapter mutation that does not declare and pass the required capability flag.
- Any external LLM/tool call containing raw secrets.

## Sensitive Action Approval

Approval records must include:

- Run ID.
- User ID/local profile.
- Action type.
- Tool/provider.
- Sanitized payload summary.
- Full local payload artifact reference if safe to store.
- Risk level.
- Expiration time.
- Approval/denial decision.
- Decision source: user, policy, rule, kill switch.

## Kill Switches

Required switches:

- Global trading kill switch.
- Per-rule automation switch.
- Per-market switch.
- Per-account switch.
- Sidecar execution switch.
- External provider switch.

## Security Requirements

- Store secrets in OS credential store.
- Mask account numbers, tokens, order IDs, and direct personal identifiers before external model/tool calls.
- Do not write raw access tokens to logs or artifacts.
- Apply allow/deny lists for shell-like sidecar execution.
- Record data egress decisions.
- Provide a local export that excludes secrets.

## Safety Gate

No stage exits until:

- Permission matrix is updated.
- Hard blocks have deterministic tests.
- User-facing sensitive action copy is present.
- Audit log writes are tested before sensitive completion.
- Secret masking snapshots cover new fields.
