# Data And Artifacts

Generated: 2026-06-04

## System Of Record

GaemiGuard uses:

- SQLite for structured durable records.
- Markdown artifacts for human-readable reasoning.
- JSON artifacts for reproducible machine-readable runs.

## Core Entities

| Entity | Purpose |
| --- | --- |
| Account | Broker account identity, masked display, connector mapping |
| Instrument | Symbol, market, exchange, identifiers, warnings |
| Position | Holdings snapshot and exposure |
| MarketSnapshot | Quotes, orderbook, candles, exchange rate, market calendar |
| AgentRun | Commander run and specialist timeline |
| ToolCall | Tool request, permission decision, result status |
| Artifact | Markdown/JSON output and source link |
| Thesis | Versioned investment rationale |
| Rule | User investment principle or automation condition |
| ScenarioRun | MiroFish/Hermes/OpenBB scenario request/result |
| OrderReview | Draft order, guard checks, result, approval state |
| TradeJournal | User-visible record of trades, reasons, outcomes |
| AuditEvent | Sensitive action record |

## Data Classification

| Class | Examples | External sharing |
| --- | --- | --- |
| Public | market data, public news, stock warnings | Allowed |
| Local user | thesis, rules, journal, watchlist | User-controlled |
| Account-sensitive | account IDs, positions, cash, order history | Mask or aggregate |
| Secret | API keys, access tokens, refresh tokens | Never |
| Trading-sensitive | order payload, approval token, idempotency key | Local only unless user explicitly exports |

## Artifact Requirements

Every meaningful analysis artifact must include:

- `artifact_id`
- `run_id`
- `created_at`
- `stage`
- `agent`
- source snapshot summary
- assumptions
- uncertainty
- data freshness
- redaction status
- input artifact links
- output artifact links

Order-related artifacts additionally require:

- order draft summary
- checks run
- checks passed
- checks blocked
- approval state
- idempotency key reference
- kill switch state

## Retention

Default: keep local data until the user deletes it.

Required deletion behavior:

- User can delete account snapshots.
- User can delete artifacts.
- User can delete thesis/rules/journal.
- Secrets deletion removes credential-store entries.
- Export excludes raw secrets.

## Data Gate

No stage exits until:

- New data entities are documented.
- Migrations are tested.
- Artifact schema is updated.
- Redaction behavior is tested.
- Export/delete implications are documented.
