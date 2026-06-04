# GaemiGuard Design Survey Result

Generated at: 2026-06-04T06:44:34.850Z
Completion: 65/65 (100%)
Required decisions: 49/49 (100%)

## Locked Direction

- 제품 약속: 거래 전 한 번 더 생각하게 하는 투자 가드
- 초기 증명 가치: 내 계좌 상황을 에이전트에게 바로 물어본다
- 첫 화면: Today Guard 대시보드
- 오른쪽 패널: Commander Agent 채팅 패널
- Toss API: 실주문까지 제한적으로
- Codex 사용: Codex CLI provider/tool adapter
- MiroFish 역할: 가격 예측 엔진
- 자동화 수준: 수동, 반자동, 자동 단계형
- 주문 권한: 주문 분석, 드라이런, 미체결 주문 취소 제안, 사용자 승인 후 제출, 주문 초안 생성, 룰 기반 자동 제출
- 저장소: SQLite + Markdown artifacts
- 데스크톱 shell: Electron + React/Next
- 실행 방식: 앱 하나 실행, Docker 불필요

## 제품 정체성

### 한 문장 제품 약속은 무엇인가?
거래 전 한 번 더 생각하게 하는 투자 가드

내 멘트:
일단 에이전트 가 베이스, 그리고 투자 가드 및 자동 매매, 그리고 메모리

### 명시적으로 하지 않을 것은?
모바일 증권사 앱

내 멘트:
그냥 일반 증권앱이 하지 못하는것 을 에이전트로 풀기 토스 api 가 있으니깐 토스 증권 사용자들 편하게

### 초기 타깃 사용자는 누구인가?
한국 개인 투자자, 토스증권 사용자, ChatGPT/Codex/Cursor를 이미 쓰는 AI 파워 유저

내 멘트:
토스를 쓰면서 코덱스 쓰는사람

### 초기 단계에서 가장 먼저 증명할 가치는?
내 계좌 상황을 에이전트에게 바로 물어본다

내 멘트:
에이전트가 뭐든지 하는거야 매일 아침 리서치 해오고 이번주 매매 복기 하고 4개 다 하는거야

### 앱의 말투와 판단 태도는?
친절한 투자 코치

내 멘트:
이건 정할수 없지 사용자가 선택하게 해야지

## 메인 화면과 사용자 흐름

### 첫 화면의 중심은 무엇인가?
Today Guard 대시보드

### 오른쪽 사이드바의 역할은?
Commander Agent 채팅 패널

내 멘트:
에이전트 채팅 패널 cursor 같이

### 매일 켰을 때 가장 중요한 행동은?
관심 종목 리서치 실행

내 멘트:
그냥 개인 투자자가 아침에 일어나서 뭘 할까에 대해서 생각해봐

### 필요한 주요 탭은?
홈, 투자 논리, 내 계좌, 원칙/룰, 리서치, 주문 가드, 설정, 시나리오, 메모리

내 멘트:
모두 다인거같아 기본세팅있고 hts 처럼 입맛대로 할수도 있고

### 차트에서 사용자가 해야 하는 핵심 상호작용은?
구간 선택 후 에이전트 질문

내 멘트:
인터렉티브 하게 대화

## 데이터와 외부 커넥터

### Toss Invest Open API의 초기 사용 범위는?
실주문까지 제한적으로

내 멘트:
핵심이야 이게 api를 full 하게 사용해 ap문서 기반으로

### 초기 지원 시장은?
국내 주식, 미국 주식, ETF, 파생상품

### 연결할 외부 도구/데이터는?
Toss Invest Open API, MiroFish sidecar, Graphiti/temporal memory, 로컬 PDF/Markdown/CSV, Hermes Agent, OpenBB, OpenClaw remote chat

내 멘트:
커뮤니티는 일단 정하지마 그냥 헤르메스 리서치가 할듯

### 커뮤니티/소셜 데이터 정책은?
초기에는 사용하지 않음

### 데이터 최신성 기대치는?
데이터별 혼합

내 멘트:
실시간으로 가져올 데이터는 실시간, 리서치는 뭐 어쩔수 없지 뉴스 api 이런거 있음 좋음 그래도 리서치 하기전에

## 에이전트 오케스트레이션

### 최상위 오케스트레이터의 책임은?
리서치부터 주문까지 직접 실행

내 멘트:
모두 해야지 정해진 tool 과 mcp 를 바탕으로

확정:
오른쪽 에이전트 패널 뒤에는 별도 내부 Commander Agent를 둔다. Commander Agent는 사용자의 질문을 받아 컨텍스트를 모으고, specialist agent를 호출하고, 작업을 중단/재지시하고, 최종 판단을 합성한다. 단, 실주문 제출은 Commander가 직접 우회하지 않고 반드시 Order Guard와 권한/킬스위치/감사 로그를 통과한다.

### 초기 에이전트 역할은?
Commander Agent, Portfolio Agent, Scenario Agent, Memory Agent, Settings/Secrets Agent, Report Agent, Order Guard Agent, Research Agent, Broker/Toss Agent, External Signal Agent(기본 비활성)

내 멘트:
모두 해야해

### Codex CLI는 어디에 쓰나?
Codex CLI provider/tool adapter

내 멘트:
내 에이전트 api? 헤르메스 미로피쉬 등등 llm 이 필요한 모든 부분 개발은 알아ㅏ서 내가 할거야

확정:
Codex CLI는 GaemiGuard 런타임 자체가 아니라 provider/tool adapter로 붙인다. GaemiGuard의 오케스트레이터, 권한 모델, 주문 감사 로그는 자체 구현한다.

### 에이전트 권한 모델은?
신뢰 에이전트 자동 실행

내 멘트:
수동 반자동 자동 이런식

### 에이전트 실행 내역에 무엇을 보여줄까?
호출한 도구, 가정, 사용한 데이터 소스, 확신도/불확실성, 비용/시간, 차단된 액션, 원본 artifact 링크

내 멘트:
모두

## MiroFish와 예측/시나리오

### MiroFish의 제품 내 역할은?
가격 예측 엔진

내 멘트:
시나리오 및 가격 예측

### 미래 가격 요청에 어떻게 답할까?
조건부 시나리오 범위

### MiroFish에 넘길 입력 묶음은?
가격/거래량 CSV, 투자 논리, Hermes 리서치 요약, 환율/금리/시장 컨텍스트, 사용자 질문/가정, 투자 원칙/룰, 내 보유/비중 스냅샷, 선택적으로 외부 신호 요약

내 멘트:
모두 웬만하면 full context 를 넘겨주는게 좋을듯

### MiroFish 결과가 주문에 미치는 영향은?
주문 가드의 참고 신호

내 멘트:
일단 참고 뭐 에이전트가 기억하고 있다가 주문 할수도 있고 뭐 그래

### 시나리오 결과 화면에 보여줄 artifact는?
결론/판정, 에이전트/소셜 그래프, 리스크 요인, 주문 가드 연결 요약, 원문 리포트, 예상 전개 타임라인, 가정 목록

내 멘트:
이것도 뭐 상황에 따라서

## 자동매매와 주문 가드

### 초기 자동화 수준은?
수동, 반자동, 자동 단계형

내 멘트:
이것도 뭐 수동 반자동 자동

### 허용할 주문 관련 액션은?
주문 분석, 드라이런, 미체결 주문 취소 제안, 사용자 승인 후 제출, 주문 초안 생성, 룰 기반 자동 제출

내 멘트:
모두

### 주문 전 필수 검사는?
종목/섹터 비중 한도, 투자 논리 존재 여부, 충동 매매 쿨다운, 거래정지/투자경고 등 종목 경고, MiroFish/Hermes 리스크 신호, 연속 손실/복수매매 감지, 내 투자 원칙 위반, 현금/환율 조건

내 멘트:
다 봐야지

### 킬스위치 정책은?
전체/룰별 킬스위치

### 주문 승인 화면에 반드시 보여줄 문구/정보는?
주문 종류, 종목, 수량, 예상 주문가/시장가 여부, 예상 체결 금액, 수수료/세금 추정, 주문 후 보유 비중, 현금 잔고 변화, 연결된 투자 논리/룰, Order Guard 통과/차단 항목, MiroFish/Hermes 참고 신호, 주요 불확실성, 승인 주체, 만료 시간, idempotency key

추천 문구:
"이 주문은 수익을 보장하지 않습니다. GaemiGuard는 사용자의 원칙과 현재 데이터 기준으로 위험을 점검했으며, 최종 책임은 사용자에게 있습니다."

## 리스크, 책임, 컴플라이언스

### AI 답변의 투자 조언 경계는?
의사결정 보조

내 멘트:
그것도 사용자 하기 나름이지

### 감사 로그에 남길 것은?
사용자 질문, 데이터 스냅샷, 승인/거부 기록, 룰 검사 결과, 모델/provider 정보, 주문 요청 payload, 에이전트 결론, 도구 호출

### 기본값으로 꺼둘 고위험 기능은?
라이브 자동 주문 제출, 파생상품 자동 주문, 레버리지/인버스 자동 주문, 장외/시간외 자동 주문, 미체결 자동 정정, 손실 회복 목적의 자동 물타기, 외부 소셜/커뮤니티 신호 기반 주문, 원격 동기화, 원격 명령 실행, full access provider mode, API 키 평문 저장, 자동 전략 코드 실행

### 주문 차단 민감도는?
기본은 보수적. 주문 차단보다 경고가 많은 상태를 허용하되, 원칙 위반/킬스위치/계좌 한도/거래 가능 상태/식별자 불일치/데이터 최신성 실패/승인 만료는 hard block으로 처리한다.

### 상시 고지 방식은?
민감 액션에서만 명확히

## 메모리와 데이터 모델

### 로컬 저장소의 중심은?
SQLite + Markdown artifacts

### 반드시 모델링할 엔티티는?
Account, Instrument, Rule, Scenario Run, Trade Journal, Artifact, Agent Run, Order Review, Research Report, Thesis, Position

### Graphiti/temporal memory는 언제 도입할까?
1단계부터

### 투자 논리의 생명주기는?
버전 관리

### 데이터 보관 정책은?
사용자가 지울 때까지 보관

## 앱 아키텍처

### 데스크톱 shell은 무엇으로 갈까?
Electron + React/Next

### 백엔드 프로세스 구조는?
Local API + sidecar processes

### sidecar 운영 원칙은?
uv-managed Python, run별 격리 작업폴더, AGPL 도구는 process boundary 유지, 헬스체크/버전 표시

### 장기 작업 실행 방식은?
로컬 작업 큐

### GaemiGuard와 sidecar 사이의 계약에서 꼭 필요한 필드는?
run_id, request_id, sidecar_name, sidecar_version, working_dir, input_artifact_paths, output_artifact_paths, model/provider, started_at, finished_at, status, error, warnings, source_snapshot, assumptions, seed/config_hash, cost/time metrics, cancellation_token, health_status, license_boundary

## 보안과 시크릿

### API 키와 토큰은 어디에 저장할까?
OS credential store

### 원격 동기화는?
기본 꺼짐

### LLM/tool 호출 전에 마스킹할 데이터는?
계좌번호/식별자, 주문번호, API 키/토큰

### 도구 실행 sandbox 수준은?
workspace scoped

### 절대 유출되면 안 되는 데이터나 제약은?
Toss API 키/토큰, 계좌번호/고객 식별자, 주문번호, 체결번호, 원본 access token/refresh token, OS credential handle, 개인 포트폴리오 전체 스냅샷, 주민등록번호/전화번호/주소 등 직접 식별자, 로컬 파일 절대경로 중 민감 경로, LLM provider secret, 승인 전 주문 payload 원문. 외부 LLM/sidecar 전송 전 마스킹/최소화가 기본이다.

## UI 디자인 시스템

### 전체 시각 방향은?
토스 inspired + 촘촘한 업무형

### 정보 밀도는?
5

### 초기 UI 컴포넌트는?
Agent Panel, Rule/Risk Badges, Artifact Viewer, Order Approval Modal, Settings/Secrets Form, Chart Annotations, Run Timeline, Holdings Table

### 알림 방식은?
오른쪽 Commander 패널의 run timeline, 상단 상태 배지, 주문/킬스위치/오류만 modal 또는 system notification. 일반 리서치 완료는 조용한 inbox 알림으로 처리한다.

### 화면 문구에서 피해야 할 표현은?
수익 보장, 확정 상승/하락, 무조건 매수/매도, AI가 책임짐, 안전한 자동매매, 리스크 없음, 원금 보장, 내부자 정보처럼 보이는 표현, 사용자의 판단을 대체한다는 표현

## 단계별 범위와 로드맵

### 1단계에 반드시 들어갈 모듈은?
Toss read-only connector, Thesis/Rules, Order Guard dry-run, Hermes research, Settings/secrets, Audit log, MiroFish scenario, Context agent chat, Portfolio view

### 2단계로 미룰 모듈은?
라이브 자동매매, 파생상품 주문 자동화, 커뮤니티/소셜 신호, 원격 동기화, 모바일 앱, 다중 브로커, 전략 마켓플레이스, 복잡한 백테스트 UI, 협업/공유 기능

### 1단계 성공 기준은?
앱 하나로 실행되고, Toss read-only 계좌/보유/주문 조회가 연결되며, Commander Agent가 현재 계좌와 선택 차트 구간을 이해하고 답한다. MiroFish scenario run이 artifact를 남기고, Order Guard dry-run이 주문 초안에 대해 통과/차단 사유를 생성하며, 모든 agent/tool/order-review 이벤트가 SQLite와 Markdown/JSON artifact에 남는다.

### 1단계에서 과감히 자를 것은?
실주문 제출, 라이브 자동매매, 파생상품 주문 실행, 커뮤니티/소셜 데이터, 모바일, 원격 sync, 전략 공유/마켓, 과도한 HTS급 커스터마이징, 멀티 브로커, 완전한 백테스트 엔진

### 1단계에서 꼭 보고 싶은 데모 시나리오는?
사용자가 삼성전자 차트 구간을 선택하고 "이 구간 이후 왜 떨어졌고 지금 사도 되는지, 내 계좌 기준으로 봐줘"라고 묻는다. Commander가 Research/Portfolio/Scenario/Order Guard Agent를 호출하고, MiroFish 시나리오 artifact와 보유 비중/원칙 위반 여부를 합쳐 주문 초안을 만들되, 실제 제출은 막고 dry-run review만 보여준다.

## 운영, 테스트, 배포

### 사용자가 앱을 켤 때 기대하는 실행 방식은?
앱 하나 실행, Docker 불필요

### 헬스체크에 포함할 항목은?
Toss API 인증/권한/잔여 호출 상태, 시세 데이터 최신성, SQLite read/write, artifact dir write, OS credential store 접근, MiroFish sidecar version/health, Hermes/OpenBB connector health, LLM provider health, Codex CLI adapter availability, 작업 큐 상태, kill switch 상태, 마지막 감사 로그 기록 성공 여부

### 테스트 전략은?
계약 테스트 우선. Toss API는 schema/codegen 계약 테스트와 mock replay, Order Guard는 rule table 기반 unit/property test, Commander/agent는 fixture 기반 golden trace test, sidecar는 per-run artifact contract test, UI는 Playwright 핵심 플로우, DB는 migration test, 보안은 secret masking snapshot test, 주문 경로는 live submit 없이 dry-run/e2e만 1단계에서 검증한다.

### 백업/내보내기 방식은?
로컬 zip export. SQLite dump, artifacts, 설정 JSON, rule/thesis/trade journal Markdown을 포함하되 OS credential store의 원본 secret은 제외한다. 가져오기는 secret 재연결을 요구한다.

### 아직 확정 못 한 것, 불안한 것, 내가 더 물어봐야 할 것
없음. 미선택 항목은 보수적 추천값으로 잠갔다. 이후 구현 중 Toss Open API 실제 제약, MiroFish 입력 계약, Windows credential store 구현 세부는 코드/문서 기준으로 갱신한다.

## Implementation Prompt

GaemiGuard 설계를 이어서 확정/구현해줘.

현재 제품 방향:
제품 약속: 거래 전 한 번 더 생각하게 하는 투자 가드
초기 증명 가치: 내 계좌 상황을 에이전트에게 바로 물어본다
첫 화면: Today Guard 대시보드
오른쪽 패널: Commander Agent 채팅 패널
Toss API: 실주문까지 제한적으로
Codex 사용: Codex CLI provider/tool adapter
MiroFish 역할: 가격 예측 엔진
자동화 수준: 수동, 반자동, 자동 단계형
주문 권한: 주문 분석, 드라이런, 미체결 주문 취소 제안, 사용자 승인 후 제출, 주문 초안 생성, 룰 기반 자동 제출
저장소: SQLite + Markdown artifacts
데스크톱 shell: Electron + React/Next
실행 방식: 앱 하나 실행, Docker 불필요

답변 진행률: 65/65, 필수 결정: 49/49

아직 비어있는 필수 결정:
없음. 비어 있던 항목은 보수적 추천값으로 확정함.

중요한 설계 원칙:
- Toss Invest Open API는 공식 API 우선.
- MiroFish는 Docker 필수가 아니라 Windows-native CLI sidecar로 사용.
- MiroFish 결과는 직접 주문 트리거가 아니라 scenario/advisory signal로 취급.
- 자동매매는 Order Guard, audit log, kill switch, explicit approval 전에는 실주문 금지.
- Commander Agent는 내부 지휘 에이전트이며, specialist agent를 감독한다.
- 일반 에이전트 권한과 주문 권한은 분리한다.
- 제품은 local-first desktop investment guard/orchestrator이지 수익 보장 봇이 아님.
