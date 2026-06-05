# External Tools And Data Direction

Updated: 2026-06-06

## Decision

GaemiGuard should not rebuild every financial tool.

It should use external tools when they clearly help the personal investment agent, but those tools are adapters. They are not the product center.

Priority order:

1. Codex/OpenAI-compatible model login for the agent brain.
2. Broker OAuth/credential connections for account, trading, and automation.
3. Hermes for deep research.
4. MiroFish for scenario analysis.
5. OpenBB for optional financial data and analytics.
6. OpenDART/KRX only as optional public-data connectors when a concrete workflow needs them.

## Default Install Experience

The first install must work without optional tools.

Required first-run state:

- app launches
- no broker mode works
- sample data works
- manual watchlist works
- thesis/rule notes can be created later
- connector status is clear

Optional tools should appear as installable capabilities, not as startup requirements.

## Hermes

Hermes is the deep research tool.

GaemiGuard should use Hermes through `ResearchAgent`.

Use Hermes for:

- deep company research
- thesis-changing fact checks
- overseas-stock research
- news/source synthesis
- long-running investigation
- daily/weekly research briefs

Do not send Hermes:

- raw broker tokens
- raw account numbers
- raw order identifiers
- full sensitive portfolio payloads unless the user explicitly chooses that export class

ResearchAgent should translate GaemiGuard context into a sanitized research brief and store Hermes output as a source-backed artifact.

## MiroFish

MiroFish is the scenario tool.

Use MiroFish for:

- bull/base/bear scenarios
- assumption stress tests
- chart-period scenario questions
- "what would make my thesis wrong?" workflows

MiroFish output is not a forecast guarantee and must not place orders directly.

MiroFish can become a GaemiGuard wrapper or fork if needed, but it should stay outside the main repo unless there is a clear integration reason.

## OpenBB

OpenBB is optional financial data and analytics infrastructure.

Use OpenBB when it provides data or analytics faster than building locally.

Do not turn GaemiGuard into an OpenBB or Bloomberg clone. OpenBB should serve ResearchAgent, PortfolioAgent, or ScenarioAgent when a workflow asks for richer data.

## OpenDART And KRX

OpenDART and KRX are not core first-run requirements.

They should stay optional until a real workflow needs them.

Use OpenDART later for:

- Korean public filings
- company overview
- financial statements
- disclosure-grounded research artifacts

Use KRX later for:

- official market and instrument reference data
- listing metadata
- market statistics where the API terms allow use

Default policy:

- User supplies their own OpenDART/KRX API keys.
- Keys stay in the OS credential store.
- The app works without them.
- Commander must say when public-data connectors are missing.

Do not build a GaemiGuard-hosted public-data proxy until usage, terms, and cost are reviewed.

## FinceptTerminal Reference

FinceptTerminal is a broad open-source financial terminal reference, not GaemiGuard's product target.

It is useful for research into:

- desktop financial terminal packaging
- data connector organization
- broker/trading engine boundaries
- paper/live/automation separation
- portfolio/research/news screen organization
- AI agent placement on top of financial workflows

Do not copy FinceptTerminal code or UI into GaemiGuard without a license review and explicit attribution plan.

GaemiGuard should remain narrower:

> personal investment agent first, evidence surfaces second, broker/data adapters underneath.

## Open-Source Reuse Policy

Use this decision table for every external repo:

| Decision | Meaning |
| --- | --- |
| Dependency | Use the official package or CLI as-is. |
| Adapter | Keep the tool external and write a GaemiGuard wrapper. |
| Fork | Fork only when GaemiGuard needs stable modifications that upstream cannot provide. |
| Pattern only | Study the repo and reimplement the idea in GaemiGuard style. |
| Reject | Do not use because of license, security, maintenance, or product-fit risk. |

Before using a repo, document:

- license
- commercial or trademark restrictions
- install/runtime requirements
- security boundary
- data egress boundary
- whether code can be copied, linked, forked, or only studied
- how updates will be tracked

External source code should live under `external/` during local research and stay out of Git unless intentionally vendored with license notes.
