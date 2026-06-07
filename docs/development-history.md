# GaemiGuard Development History

Updated: 2026-06-07

This document records how GaemiGuard reached its current shape, organized by pull request. Use it when a future agent needs to understand why the current structure exists.

For current truth, always prefer `docs/development-status.md` and the latest `git log`. This file is historical context.

## Timeline Summary

1. PR #1 built the Stage 1 foundation: local app, API, database, Commander runtime, and order blocking.
2. PR #2-#4 updated GitHub Actions dependencies.
3. PR #5-#7 established the waterfall plan, documentation hub, setup, and contribution documents.
4. PR #8-#9 improved the Stage 1 home screen and Windows desktop smoke testing.
5. PR #10-#11 started the Toss read-only connector and added mock replay based snapshot persistence/sync shape.
6. PR #12-#17 added agent-facing docs, Korean README positioning, agent-first product direction, broker-agent product alignment, broker adapter foundation, and clarified in-app trading copy.
7. PR #18 completed Stage 2 with production-safe Toss read-only sync and gate review.
8. PR #19-#24 completed Stage 3 Research And Memory and prepared Stage 4 entry.

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
| [#15](https://github.com/Sungblab/GaemiGuard/pull/15) | `543d12c` | 2026-06-06 | Aligned the broker-agent product design with the Stage 2 Broker Connection Foundation direction. | Clarified that Toss is the first adapter slice, not the product center. |
| [#16](https://github.com/Sungblab/GaemiGuard/pull/16) | `fe83a4d` | 2026-06-06 | Added the shared BrokerAdapter contract, Toss adapter wrapper, manual/no-broker portfolio foundation, broker health aggregation, and broker-independent Commander metadata. | Turned the Toss-only Stage 2 code into a broker adapter foundation while keeping order mutation disabled. |
| [#17](https://github.com/Sungblab/GaemiGuard/pull/17) | `0f596a4` | 2026-06-06 | Clarified in-app trading product copy and live-order direction. | Kept README/product copy aligned with official APIs and later-stage trading boundaries. |
| [#18](https://github.com/Sungblab/GaemiGuard/pull/18) | `db2131f` | 2026-06-06 | Completed Stage 2 Toss readonly foundation with production credential boundary, real read-only sync, freshness metadata, Commander grounding, security tests, and Stage 2 gate review. | Closed Stage 2 and made production account facts usable only with source/freshness grounding. |
| [#19](https://github.com/Sungblab/GaemiGuard/pull/19) | `0e9f2dd` | 2026-06-06 | Added the first local investment memory slice: thesis/rule/journal persistence, memory API, Commander MemoryAgent recall, source/freshness gating, and stale-source exclusion. | Started Stage 3 with local memory that could be queried safely. |
| [#20](https://github.com/Sungblab/GaemiGuard/pull/20) | `4f32ae2` | 2026-06-06 | Added source-backed research memory artifacts, research links, API recall, Commander grounding, missing-source rejection, and stale research exclusion. | Made local research artifacts part of the same source/freshness memory contract. |
| [#21](https://github.com/Sungblab/GaemiGuard/pull/21) | `2d856bc` | 2026-06-06 | Surfaced memory/research recall in the desktop app with source, freshness, links, and skipped memory visibility. | Made Stage 3 grounding review visible to users. |
| [#22](https://github.com/Sungblab/GaemiGuard/pull/22) | `9c547fb` | 2026-06-06 | Added desktop thesis/rule/journal/research authoring with automatic local source/freshness metadata and smoke coverage. | Turned Stage 3 memory from read-only review into a usable authoring flow. |
| [#23](https://github.com/Sungblab/GaemiGuard/pull/23) | `c2c0dae` | 2026-06-06 | Added explicit local Markdown/CSV/PDF-text import as source-backed research memory, safe file-name metadata, redaction tests, and desktop import visibility. | Added the local import path while avoiding original path retention and optional sidecar installs. |
| [#24](https://github.com/Sungblab/GaemiGuard/pull/24) | `d79346b` | 2026-06-06 | Added weekly review Markdown/JSON artifacts, ReportAgent persistence, desktop report visibility, Stage 3 exit docs, and Stage 3 gate review. | Completed Stage 3 and moved the active stage to Stage 4 MiroFish Scenario. |

## Completed Major Blocks

### Stage 1 Foundation

Complete. The repo has the local desktop app, local API, SQLite, artifact persistence, Commander runtime, specialist stub, permission engine, Order Guard dry-run, and live-order blocking.

### Stage 2 Broker Connection Foundation

Complete. The current implemented code includes the Toss read-only adapter skeleton, mock replay based snapshot persistence/sync shape, shared BrokerAdapter contract, Toss adapter wrapper, broker health aggregation, no-broker/manual portfolio DB/API/service foundation, OS credential-store boundary, credential setup/disconnect API, real Toss read-only sync, freshness/failure metadata, desktop freshness status, Commander production snapshot grounding, and Stage 2 security/gate review.

### Stage 3 Research And Memory

Complete. The current implemented code includes thesis/rule/journal/research memory persistence, source-backed research artifacts, explicit local Markdown/CSV import, weekly review artifacts, Commander MemoryAgent source/freshness-gated recall, desktop memory/research authoring/review/report surfaces, redaction tests, and Stage 3 gate review.

Deferred to later stages:

- KIS source note and capability map before any KIS implementation
- Stage 4 MiroFish scenario sidecar integration
- Stage 5 order draft and paper trading
- Stage 6 user-approved manual live orders
- Stage 7 rule-based automation

## Related Documents

- Current state: `docs/development-status.md`
- Agent work index: `docs/agent-index.md`
- Stage 2 contract: `docs/stages/stage-2-toss-readonly-connector.md`
- Stage 3 contract: `docs/stages/stage-3-research-memory.md`
- Stage 4 contract: `docs/stages/stage-4-mirofish-scenario.md`
- Stage 4 first-slice handoff: `docs/handoffs/2026-06-07-stage-4-mirofish-first-slice.md`
- Broker/trading direction: `docs/product/broker-connection-and-trading.md`
- Documentation hub: `docs/README.md`
- Single-file HTML docs: `docs/gaemiguard-all-docs.html`
