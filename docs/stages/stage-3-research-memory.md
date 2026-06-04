# Stage 3 Gate: Research And Memory

Generated: 2026-06-04

## Objective

Make investment rationale, rules, research, and trade-review memory queryable with source-backed artifacts.

## Entry Criteria

- Stage 2 read-only Toss data accepted.
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
