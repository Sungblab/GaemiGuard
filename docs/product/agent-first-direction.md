# Agent-First Product Direction

Updated: 2026-06-06

## Decision

GaemiGuard is an agent-first local personal investment workspace for Korean retail investors.

The primary product is the personal investment agent. The investment guard and the small local investment terminal are supporting parts of that agent experience.

Plain product statement:

> GaemiGuard helps a Korean retail investor collect account, market, research, scenario, and personal-rule context before making an investment decision.

Short Korean positioning for public copy:

> 거래는 증권사에서 하고, 판단 정리는 GaemiGuard에서 합니다.

## Product Shape

GaemiGuard should feel like:

- A personal investment agent that knows the user's holdings, watchlist, thesis, rules, reports, and recent decisions.
- A pre-trade guard that checks whether a planned action conflicts with the user's own rules, current exposure, market context, or missing evidence.
- A small local investment terminal that shows the evidence the agent used.

GaemiGuard should not become:

- A Toss Securities screen clone.
- A Bloomberg Terminal or OpenBB clone.
- A news-feed product.
- A recommendation app that pretends to know the future.
- An automation-first live trading bot.

Automation is not banned forever. It is intentionally staged. Live order submission and rule-based automation stay behind later gates until read-only data, memory, order review, audit logging, kill switches, idempotency, and user approval are all proven.

## User Workflow

The expected daily workflow is:

1. The user opens GaemiGuard before or during market hours.
2. The app shows a Today Guard view with account freshness, holdings exposure, market schedule, watchlist changes, warnings, recent research, and pending review items.
3. The user asks Commander a question such as "What should I pay attention to today?", "Is my exposure to this stock too high?", or "What facts changed since my last thesis?"
4. Commander delegates to specialist agents and tools.
5. The UI shows the answer plus the evidence surface: source snapshots, freshness, warnings, research artifacts, scenario artifacts, and order review results.
6. If the user wants to trade, GaemiGuard prepares a review or draft only in the stages where that is allowed. The actual brokerage transaction remains outside GaemiGuard until a later approved live-order stage.
7. After decisions, Memory and Report flows keep the rationale, rule changes, and follow-up checks available for later.

## Agent Model

GaemiGuard should use a primary-agent plus specialist-agent model.

Primary agent:

- `CommanderAgent`: owns the user conversation, intent classification, context assembly, delegation, supervision, final synthesis, and run recording.

Specialist agents:

- `PortfolioAgent`: account snapshots, holdings, exposure, cash, FX, and allocation.
- `BrokerTossAgent`: official Toss Invest API read-only facts first; future order tools only after later gates.
- `ResearchAgent`: news, filings, local docs, Hermes/OpenBB research, and thesis-changing facts.
- `ScenarioAgent`: MiroFish scenario packaging and interpretation.
- `OrderGuardAgent`: order draft review, rule checks, hard blocks, approvals, and audit evidence.
- `MemoryAgent`: thesis, rules, trade journal, recall, and temporal investment memory.
- `ReportAgent`: morning, daily, weekly, and trade-rationale reports.
- `SettingsSecretsAgent`: connector health, provider health, credential setup, disconnect, and secret boundary status.
- `ExternalSignalAgent`: optional later agent for external/community signals. It stays disabled by default until source quality and privacy boundaries are clear.

Not every specialist must start as a separate LLM loop. Early stages can implement specialists as deterministic services or tool-backed tasks. The stable contract matters more than prematurely making every role autonomous.

## Mode Model

GaemiGuard should separate ordinary agent authority from trading authority.

User-facing modes:

- Ask: read data, explain evidence, and answer questions.
- Plan: create scenarios, reports, checklists, and order-review drafts without side effects.
- Guarded Act: perform bounded local writes or approved safe tasks. This mode still cannot bypass trading policy.

Trading authority:

- Read-only account and market access is allowed only after the relevant stage and credential boundary are implemented.
- Order draft and paper trading are later-stage features.
- Live order submit, modify, and cancel require deterministic Order Guard policy, audit logging, kill switch, idempotency, explicit approval, and stage-gate evidence.
- Rule-based automation is a final-stage capability, not a Stage 2 or Stage 3 capability.

## Terminal And News Scope

GaemiGuard may include terminal-like surfaces, but only when they support the agent.

Allowed terminal surfaces:

- Holdings and exposure tables.
- Quote, orderbook summary, FX, calendar, and warning snapshots.
- Source/freshness badges.
- Agent timeline and tool-call records.
- Research and scenario artifact viewers.
- Order review checklists.

Do not build a general market terminal first. Data density is useful only when it helps the user understand the agent's answer or review an investment decision.

News should be a decision-relevant input, not a standalone feed. Prefer:

- News tied to holdings, watchlist, thesis, rules, or user questions.
- Source-backed summaries with timestamps.
- "What changed since my last thesis?" over generic headlines.
- Saved research artifacts over endless scrolling.

## External Reference Lessons

OpenCode shows a useful pattern for GaemiGuard:

- Primary agents and subagents can share one underlying agent model.
- Agents should have descriptions, modes, prompts, models, step limits, and permission rules.
- Subagents are useful for bounded work, exploration, and parallel tasks.
- Permissions belong to the agent and tool boundary, not only to UI buttons.
- Hidden system agents such as compaction, title, or summary can support long-running sessions.

The local `agent-example` reference shows similar high-level architecture:

- Query loop.
- Tool registry.
- Permission checks.
- Task/background work.
- Memory.
- Skills/plugins.
- Coordinator/subagent flows.

Because that reference has unclear source and license status, GaemiGuard must not copy its implementation. It can only use general architectural ideas already common to agent runtimes.

## Stage Implications

Stage 2 remains Toss read-only connector work:

- Finish production credential setup through the OS credential boundary.
- Add real read-only Toss sync using the existing snapshot repository.
- Show data freshness without pretending mock or not-configured state is connected.
- Ground Commander account answers in real read-only snapshots only after source/freshness links exist.

Stage 3 should make the personal investment agent useful:

- Thesis, rules, journals, and research artifacts.
- Source-grounded recall.
- Research that affects the user's own holdings, watchlist, or thesis.

Stage 4 should add scenario analysis:

- MiroFish as a scenario sidecar.
- Scenario outputs labeled as assumptions, not predictions.

Stage 5 and later should handle order preparation:

- Order drafts.
- Paper trading.
- Deterministic guard checks.
- Audit evidence.

Stage 6 and Stage 7 are the only places where live orders and rule-based automation can open.

## Design Rules For Future Work

- Commander is the product surface; terminal panels are evidence surfaces.
- Do not answer account questions as fact unless the snapshot source, freshness, and redaction boundary are known.
- Do not turn generic news into the main product.
- Do not implement broker order mutation paths during read-only stages.
- Do not leak raw secrets, tokens, account numbers, order IDs, or personal identifiers into SQLite, artifacts, logs, tests, API responses, or external agent context.
- Prefer small, staged slices that close one safety boundary at a time.
- When adding a new agent, define its purpose, inputs, outputs, tools, permissions, persistence, and tests before wiring it into Commander.
