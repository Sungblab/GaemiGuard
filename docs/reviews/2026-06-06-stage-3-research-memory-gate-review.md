# Stage 3 Research And Memory Gate Review

Date: 2026-06-06

Status: accepted

## Scope Reviewed

- Thesis, rule, journal, and research memory persistence/API.
- Commander MemoryAgent source/freshness-gated recall.
- Desktop memory/research authoring and review surface.
- Explicit local Markdown/CSV import as source-backed research memory.
- Weekly review Markdown/JSON artifact generation and desktop visibility.
- Secret, token, raw account, raw path, and order sentinel redaction boundaries.

## Accepted Evidence

- Desktop can author selected-symbol thesis, rule, journal, and research memory and refresh `/memory/recall` immediately.
- Authored memory uses `local_manual` source/freshness metadata and does not imply broker account facts.
- `/memory/import/local` accepts explicit user Markdown, CSV, and already-extracted PDF text imports, stores safe file names, and does not persist original local paths.
- Imported local research is persisted as source-backed research memory and participates in recall.
- Commander uses only usable source/freshness memory and reports stale or missing-source memory as skipped.
- `/reports/weekly-review` generates persisted `weekly_review_markdown` and `weekly_review_json` artifacts through `ReportAgent`.
- Weekly review artifacts combine usable memory/research recall with local manual holding/watchlist context and list skipped memory.
- Desktop smoke verifies memory authoring recall, local import recall, weekly review artifact visibility, Commander review card rendering, run-log toggle, composer re-enable, and clean browser console.
- Local and CI verification passed for the Stage 3 exit branch before merge.

## Deferred

- Binary or scanned PDF parsing/OCR.
- Hermes/OpenBB adapter implementation.
- Daily report scheduling.
- Any order draft, paper trading, live trading, or automation authority.

## Decision

Stage 3 exits. The next stage is Stage 4 MiroFish Scenario, keeping the Stage 3 source/freshness and redaction boundaries when scenario inputs reference memory, imports, or weekly review artifacts.
