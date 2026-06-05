# GaemiGuard Development History

Updated: 2026-06-06

This document records how GaemiGuard reached its current shape, organized by pull request. Use it when a future agent needs to understand why the current structure exists.

For current truth, always prefer `docs/development-status.md` and the latest `git log`. This file is historical context.

## Timeline Summary

1. PR #1 built the Stage 1 foundation: local app, API, database, Commander runtime, and order blocking.
2. PR #2-#4 updated GitHub Actions dependencies.
3. PR #5-#7 established the waterfall plan, documentation hub, setup, and contribution documents.
4. PR #8-#9 improved the Stage 1 home screen and Windows desktop smoke testing.
5. PR #10-#11 started the Toss read-only connector and added mock replay based snapshot persistence/sync shape.
6. PR #12-#14 added agent-facing docs, Korean README positioning, and the agent-first product direction.

## Pull Request History

| PR | Merge commit | Date | Work completed | Meaning for later work |
| --- | --- | --- | --- | --- |
| [#1](https://github.com/Sungblab/GaemiGuard/pull/1) | `f34d948` | 2026-06-04 | Implemented Stage 1 Foundation: Electron/React desktop, Fastify API, SQLite, artifact persistence, Commander runtime, specialist stub, permission engine, Order Guard dry-run, and live-order blocking. | Established GaemiGuard as a local agent runtime, not a simple UI demo. |
| [#2](https://github.com/Sungblab/GaemiGuard/pull/2) | `bb9a36a` | 2026-06-04 | Updated GitHub Actions `actions/checkout`. | Kept CI dependencies current. |
| [#3](https://github.com/Sungblab/GaemiGuard/pull/3) | `16224c6` | 2026-06-04 | Updated GitHub Actions `actions/setup-node`. | Kept the Node setup path current. |
| [#4](https://github.com/Sungblab/GaemiGuard/pull/4) | `c3aa5c3` | 2026-06-04 | Updated GitHub Actions `pnpm/action-setup`. | Kept the pnpm setup path current. |
| [#5](https://github.com/Sungblab/GaemiGuard/pull/5) | `f765cfb` | 2026-06-04 | Added the waterfall development baseline: stages, non-scope, verification gates, risks, and traceability. | Fixed the repo direction as gated stage development rather than a loose MVP. |
| [#6](https://github.com/Sungblab/GaemiGuard/pull/6) | `664543b` | 2026-06-04 | Added the documentation hub and single-file HTML documentation bundle. | Made the full documentation set searchable for humans and agents. |
| [#7](https://github.com/Sungblab/GaemiGuard/pull/7) | `5eaf8dc` | 2026-06-04 | Organized license, setup, and contribution documents. | Prepared the repo for clearer public collaboration and onboarding. |
| [#8](https://github.com/Sungblab/GaemiGuard/pull/8) | `1e70036` | 2026-06-04 | Improved the Stage 1 home screen toward a product surface. | Gave the first screen a Today Guard dashboard direction instead of demo framing. |
| [#9](https://github.com/Sungblab/GaemiGuard/pull/9) | `a31655c` | 2026-06-04 | Added a Windows-safe desktop Playwright smoke command. | Established `pnpm smoke:desktop` as the verification path for desktop workflow changes on Windows. |
| [#10](https://github.com/Sungblab/GaemiGuard/pull/10) | `c97bbee` | 2026-06-05 | Added the first Toss read-only connector slice: official OpenAPI task list, fetch client, mock replay, health status, Commander/BrokerTossAgent read-only tool contract, and mutation blocking tests. | Started Stage 2 while keeping the boundary clear: no production credential store and no real sync yet. |
| [#11](https://github.com/Sungblab/GaemiGuard/pull/11) | `479faba` | 2026-06-05 | Added mock replay based Toss SQLite snapshot persistence and sync shape for accounts, holdings, quotes, orderbook summaries, exchange rates, market calendars, warnings, sync logs, and rate-limit metadata. | Fixed the storage model and sensitive-data rules before real Toss connectivity. |
| [#12](https://github.com/Sungblab/GaemiGuard/pull/12) | `2aae76f` | 2026-06-06 | Added agent documentation index, handoff routing, Devflow gates, and documentation integrity checks. | Made future agent sessions easier to start and finish consistently. |
| [#13](https://github.com/Sungblab/GaemiGuard/pull/13) | `5eccb43` | 2026-06-06 | Refreshed the public Korean README and onboarding copy. | Made the public repo easier for Korean users to understand. |
| [#14](https://github.com/Sungblab/GaemiGuard/pull/14) | `aa12b4c` | 2026-06-06 | Defined GaemiGuard as an agent-first local personal investment workspace and added product direction docs. | Re-centered the product on the personal investment agent rather than a broker clone or terminal clone. |

## Completed Major Blocks

### Stage 1 Foundation

Complete. The repo has the local desktop app, local API, SQLite, artifact persistence, Commander runtime, specialist stub, permission engine, Order Guard dry-run, and live-order blocking.

### Stage 2 Broker Connection Foundation

In progress. The current implemented code is the Toss read-only adapter skeleton and mock replay based snapshot persistence/sync shape. The product direction now treats this as the first slice of a broker-independent adapter foundation.

Remaining work:

- Real secret storage boundary
- Toss credential setup/disconnect
- Real Toss read-only sync
- Shared broker adapter contract and capability model
- No-broker/manual portfolio mode
- KIS source note and capability map before any KIS implementation
- Rate-limit aware scheduling and retry policy
- Account/holding/data freshness UI
- Commander answers grounded in actual read-only data and source references
- Stage 2 security review and gate evidence

## Related Documents

- Current state: `docs/development-status.md`
- Agent work index: `docs/agent-index.md`
- Stage 2 contract: `docs/stages/stage-2-toss-readonly-connector.md`
- Broker/trading direction: `docs/product/broker-connection-and-trading.md`
- Documentation hub: `docs/README.md`
- Single-file HTML docs: `docs/gaemiguard-all-docs.html`
