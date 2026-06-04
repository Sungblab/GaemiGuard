# UI And Workflows

Generated: 2026-06-04

## UI Direction

GaemiGuard uses a Toss-inspired, dense operational UI.

It should be clean and fast to scan, but it is not a marketing landing page. The first screen is the product.

## First Screen

The first screen is **Today Guard**:

- Market pulse.
- Portfolio exposure.
- Watchlist and interested stocks.
- Current risk alerts.
- Scheduled research/report tasks.
- Recent agent runs.
- Order Guard status.
- Persistent Commander panel on the right.

## Right Sidebar

The right sidebar is the Commander Agent panel.

It must show:

- User message input.
- Current run state.
- Agent delegation timeline.
- Tool calls.
- Blocked actions.
- Artifact links.
- Approval requests.
- Data freshness warnings.

## Primary Workflows

### Morning Guard

1. User opens app.
2. App checks connector health and data freshness.
3. Commander summarizes market/account risk.
4. Research tasks are suggested or run depending on permission mode.
5. Output is saved as a daily guard artifact.

### Account Question

1. User asks about account exposure.
2. PortfolioAgent fetches holdings snapshot.
3. Commander explains concentration, cash, FX, and relevant risks.
4. Answer links to source snapshot.

### Chart Question

1. User selects a chart range.
2. User asks why price moved or what scenario matters.
3. Commander passes selected range, holdings, thesis, and research context.
4. ScenarioAgent or ResearchAgent produces artifact.
5. Commander answers with uncertainty and next checks.

### Order Review

1. User asks about a potential order.
2. OrderGuardAgent creates order draft.
3. Deterministic checks run.
4. UI shows pass/block/warn list.
5. Stage 5 shows paper result; Stage 6 can request user approval for live action.

### Weekly Review

1. ReportAgent summarizes trades, thesis changes, rules violated, and missed notes.
2. User can annotate.
3. MemoryAgent stores updated thesis/journal artifacts.

## UI Copy Rules

Avoid:

- 수익 보장
- 확정 상승/하락
- 무조건 매수/매도
- 안전한 자동매매
- 원금 보장
- AI가 책임짐

Prefer:

- 조건부 시나리오
- 현재 데이터 기준
- 불확실성
- 사용자 원칙과의 일치/불일치
- 추가 확인 필요
- 최종 판단은 사용자 책임

## UI Gate

No stage exits until:

- Primary workflow is represented in UI.
- Sensitive actions show approval or block state.
- Data freshness is visible.
- Agent run timeline is visible.
- Artifact links are reachable.
