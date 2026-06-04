# GaemiGuard Roadmap

GaemiGuard는 작은 MVP로 닫지 않고, 안전 장치가 검증된 순서대로 넓힙니다.

Waterfall baseline:

- `docs/waterfall/00-master-plan.md`
- `docs/reviews/2026-06-04-ten-loop-planning-review.md`
- `docs/research/2026-06-04-planning-research.md`

## Stage 1: Foundation Runtime

Gate contract: `docs/stages/stage-1-foundation-gate.md`

목표:

- 로컬 데스크톱 앱을 실행한다.
- API, DB, artifact 저장소, 에이전트 패널을 연결한다.
- 실주문은 deterministic policy로 차단한다.

현재 구현된 범위:

- Electron + React shell
- Fastify local API
- SQLite repository
- Markdown/JSON artifact store
- Commander Agent runtime
- Portfolio/Research/Scenario/Order Guard specialist stub
- Order Guard dry-run

## Stage 2: Toss Readonly Connector

Gate contract: `docs/stages/stage-2-toss-readonly-connector.md`

목표:

- Toss Invest Open API를 공식 문서 기준으로 읽기 전용 연결한다.
- 계좌, 보유 종목, 가격, 호가, 환율, 시장 일정, 주식 경고를 가져온다.

열면 안 되는 것:

- 주문 제출
- 자동매매
- 비공식 웹 내부 API

## Stage 3: Research And Memory

Gate contract: `docs/stages/stage-3-research-memory.md`

목표:

- 리서치, 메모, 계좌 맥락을 출처와 함께 저장한다.
- 사용자가 "이 종목 예전에 왜 샀지?", "그때 가격이 어땠지?" 같은 질문을 할 수 있게 한다.
- Graphiti류 temporal memory는 선택 가능한 구현체로 둔다.

## Stage 4: Scenario Analysis

Gate contract: `docs/stages/stage-4-mirofish-scenario.md`

목표:

- MiroFish sidecar를 통해 과거 가격, 패턴, 시나리오 분석을 실행한다.
- 결과는 예측 보장이 아니라 가정 기반 분석으로 표시한다.
- 분석 결과와 입력 데이터를 artifact로 남긴다.

## Stage 5: Paper Trading And Order Draft

Gate contract: `docs/stages/stage-5-paper-trading-order-draft.md`

목표:

- 주문 초안을 만들고, 리스크 리포트와 승인 체크리스트를 생성한다.
- paper trading으로 권한 모델과 감사 로그를 검증한다.

필수 조건:

- idempotency key
- audit log
- user approval
- kill switch
- account/market/amount limits

## Stage 6: Guarded Live Orders

Gate contract: `docs/stages/stage-6-guarded-live-orders.md`

목표:

- 명시 승인 기반 제한적 실주문을 연다.
- 실패 모드, 재시도, 중복 주문 방지, 주문 취소 경로를 검증한다.

기본 원칙:

- 에이전트 단독 실주문 금지
- 고위험 주문은 항상 사용자 승인
- 로그와 artifact가 남지 않으면 주문 금지

## Stage 7: Personal Rule Automation

Gate contract: `docs/stages/stage-7-rule-based-automation.md`

목표:

- 사용자의 투자 원칙에 기반한 자동매매 오케스트레이션을 실험한다.
- 자동매매는 가장 마지막 단계이며, 강한 권한 격리와 중지 장치가 있어야 한다.

예시:

- 리밸런싱 후보 탐지
- 손실 제한 알림
- 조건 충족 시 주문 초안 생성
- 사용자가 승인한 범위 안에서만 제한적 실행
