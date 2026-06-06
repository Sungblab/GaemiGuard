# Stage 3 Gate: Research And Memory

Generated: 2026-06-04

## Objective

Make investment rationale, rules, research, and trade-review memory queryable with source-backed artifacts.

## Entry Criteria

- Stage 2 broker connection foundation accepted, or no-broker/manual data mode explicitly accepted for research-only workflows.
- Data classification and redaction tests cover account-sensitive fields.
- Artifact schema can link source snapshots.

## In Scope

- Thesis entity with version history.
- Rule entity with version history.
- Trade journal.
- Research report artifacts.
- Local Markdown/PDF/CSV ingestion.
- Hermes/OpenBB research adapter contracts.
- MemoryAgent recall/update flows.
- Daily and weekly report generation.
- Source citations and uncertainty labels.

## Out Of Scope

- Forecast-based order execution.
- Community/social signal ingestion.
- Remote sync.
- Strategy marketplace.

## Data Contract

Store:

- thesis versions
- rule versions
- journal entries
- research source metadata
- report artifacts
- memory links to account/market snapshots

Do not store:

- raw secrets
- unredacted broker tokens
- source files outside user-approved workspace without explicit import

## First Slice Status

Implemented:

- Local-only thesis, rule, and journal memory records in SQLite.
- Versioned thesis and rule writes.
- Journal entry writes.
- Source metadata with freshness status and optional broker snapshot reference.
- API endpoints:
  - `PUT /memory/theses`
  - `PUT /memory/rules`
  - `POST /memory/journal`
  - `GET /memory/recall`
- Commander `MemoryAgent` context for memory-oriented questions.
- Recall filtering that uses only records with usable source/freshness metadata and skips stale broker-snapshot records.
- Redaction tests proving raw secret, token, account, and order sentinel values are not persisted, returned, or used in Commander context.

Remaining:

- Desktop thesis/rules/journal/recall UI.
- Research report artifacts.
- Local Markdown/PDF/CSV ingestion.
- Hermes/OpenBB adapter contracts.
- Daily/weekly report generation and UI visibility.

## Connector Policy

OpenDART and KRX are optional public-data connectors, not Stage 3 entry requirements.

Stage 3 may add them only when the workflow needs Korean filings, financial statements, listing metadata, or official market reference data. The default implementation should work with local documents, broker snapshots, watchlists, thesis/rules, and Hermes/OpenBB-style research adapters.

## UI Contract

UI must include:

- Investment thesis view.
- Rules view.
- Memory/artifact search.
- Research report inbox.
- Weekly review surface.

## Agent Contract

Commander can answer:

- "내가 이 종목 왜 샀지?"
- "지난주 매매가 내 원칙이랑 맞았어?"
- "이 리서치가 내 투자 논리를 바꾸는지 봐줘"

## Exit Gate

Stage 3 exits when:

- Thesis/rule/journal CRUD and version tests pass.
- Research artifacts include source metadata.
- Memory recall returns source links.
- Secret/account redaction snapshots pass.
- Weekly review flow writes artifacts and is visible in UI.
