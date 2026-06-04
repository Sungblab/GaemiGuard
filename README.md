# GaemiGuard

GaemiGuard는 한국 개인투자자를 위한 로컬 우선 투자 가드이자 에이전트 오케스트레이터입니다.

토스증권처럼 빠르게 매매하는 화면을 그대로 복제하려는 프로젝트가 아닙니다. 핵심 약속은 **거래 전 한 번 더 생각하게 하는 투자 가드**입니다. 계좌, 리서치, 시나리오 분석, 주문 초안을 하나의 대화형 터미널로 연결하되, 실주문은 명시적인 안전 장치가 갖춰지기 전까지 차단합니다.

> Toss는 거래를 쉽게, GaemiGuard는 판단을 안전하게.

## 현재 상태

현재 코드는 Stage 1 기반 구조입니다.

- Electron + React 데스크톱 셸
- Fastify 로컬 API
- SQLite 영속성
- Markdown/JSON 아티팩트 저장소
- 오른쪽 사이드바 Commander Agent 채팅 패널
- Portfolio, Research, Scenario, Order Guard specialist 스텁
- 실주문을 차단하는 deterministic permission policy

아직 실계좌 주문, 자동매매, 수익 예측, Toss 실사용 인증 연동은 켜져 있지 않습니다. 이 저장소는 단계별로 확장하는 프로젝트이며, 작은 MVP로 닫는 방향이 아닙니다.

## 왜 필요한가

개인투자자가 매매 직전에 놓치는 것은 보통 버튼이 아니라 판단 기록입니다.

- 지금 보는 가격과 내 계좌의 노출을 함께 봐야 합니다.
- 과거 가격, 리서치, 뉴스, 시나리오를 같은 맥락에서 물어볼 수 있어야 합니다.
- 에이전트가 분석 도구를 실행하더라도 권한, 감사 로그, 승인 흐름이 먼저 있어야 합니다.
- 자동매매는 가능성으로 열어두되 기본값은 보수적이어야 합니다.

GaemiGuard는 이 흐름을 로컬 앱 안에서 묶습니다. Commander Agent가 전체 작업을 지휘하고, 전문 에이전트가 계좌 분석, 리서치 정리, 시나리오 분석, 주문 검토를 맡습니다.

## 빠른 시작

필요한 런타임:

- Node.js 22 이상
- pnpm 10 이상

설치:

```powershell
pnpm install
```

개발 서버 실행:

```powershell
pnpm dev
```

기본 주소:

- API: `http://127.0.0.1:4317`
- Desktop UI dev server: `http://127.0.0.1:5173`

검증:

```powershell
pnpm verify
```

또는 단계별로 실행:

```powershell
pnpm test
pnpm typecheck
pnpm build
```

## 저장소 구조

```text
apps/
  api/       Fastify 로컬 API
  desktop/   Electron + React 데스크톱 앱
packages/
  core/      Commander runtime, permission engine, order guard, artifacts
  db/        SQLite schema/repository
  shared/    API와 UI가 공유하는 타입
docs/
  architecture/  설계 인덱스와 런타임 설계
  design/        설계 설문과 초기 화면 자료
vendor/
  tossinvest/    Toss Invest Open API 로컬 사본
prototypes/      초기 UI 프로토타입
```

`external/`은 의도적으로 Git에서 제외합니다. MiroFish, Hermes, OpenBB 같은 로컬 참고 구현이나 대형 sidecar는 이 폴더에 두고, GaemiGuard 저장소에는 경량 wrapper와 문서화된 경계만 남깁니다.

## 주요 설계 문서

| 문서 | 용도 |
| --- | --- |
| `gaemiguard-design-spec.md` | 제품/아키텍처 설계 결정 원본 |
| `docs/architecture/design-index.md` | 현재 설계 자료의 인덱스 |
| `docs/architecture/stage-1-foundation.md` | Stage 1 범위와 수용 기준 |
| `docs/architecture/agent-runtime.md` | Commander/specialist 에이전트 런타임과 권한 모델 |
| `docs/roadmap.md` | 단계별 개발 로드맵 |
| `docs/waterfall/00-master-plan.md` | 회사식 Gate-Based Waterfall 마스터 플랜 |
| `docs/reviews/2026-06-04-ten-loop-planning-review.md` | 10회 기획/리뷰/리서치 루프 결과 |
| `docs/research/2026-06-04-planning-research.md` | Toss/API/에이전트/금융 AI 리서치 근거 |
| `docs/toss-invest-openapi.md` | Toss Invest Open API 요약 |
| `vendor/tossinvest/openapi-1.0.3.json` | Toss Invest Open API 원본 사본 |

## 개발 단계

GaemiGuard는 다음 순서로 넓힙니다.

1. Stage 1: 로컬 앱, API, DB, 아티팩트, 에이전트 패널, 권한 엔진
2. Stage 2: Toss Invest Open API 읽기 전용 커넥터
3. Stage 3: 계좌/종목/리서치 메모리와 출처 기반 답변
4. Stage 4: MiroFish sidecar를 통한 시나리오 분석
5. Stage 5: 주문 초안, paper trading, 리스크 리포트
6. Stage 6: 명시 승인 기반 제한적 실주문
7. Stage 7: 사용자 원칙 기반 자동매매 오케스트레이션

각 단계는 이전 단계의 감사 로그, 권한 모델, 실패 모드가 검증된 뒤에만 열립니다.

개발 방식은 Gate-Based Waterfall입니다. 각 Stage는 `docs/stages/`의 게이트 계약을 통과해야 다음 단계로 넘어갑니다.

## 보안과 투자 고지

GaemiGuard는 투자 판단을 돕는 도구입니다. 특정 수익률, 미래 가격, 매매 성과를 약속하지 않습니다.

현재 기본 정책은 실주문을 차단합니다. 향후 자동매매나 실주문 기능을 추가하더라도 다음 조건이 먼저 필요합니다.

- 사용자 승인 흐름
- 주문 idempotency key
- 감사 로그
- kill switch
- 계좌/종목/금액별 제한
- 실패 시 rollback 또는 명확한 중단 상태
- 민감 정보 저장/마스킹 정책

API 키, OAuth client secret, 계좌 식별자, 토큰, 로그 원본 같은 민감 정보는 이슈나 PR에 올리지 마세요. 보안 문제는 `SECURITY.md`를 따라 비공개로 제보해 주세요.

## 기여하기

기여 방식은 `CONTRIBUTING.md`를 따릅니다.

좋은 기여 방향:

- 권한 모델과 감사 로그를 더 명확하게 만드는 변경
- Toss Invest Open API의 공식 문서 기반 커넥터
- 투자 판단 근거를 저장하고 재현하기 쉬운 아티팩트
- UI의 정보 밀도와 사용성을 높이는 변경
- 테스트 가능한 작은 런타임 개선

피해야 할 방향:

- 비공식 웹 내부 API 의존
- 승인 없는 실주문 실행
- 수익 보장처럼 보이는 문구
- 계좌/토큰/로그 원본이 포함된 테스트 fixture
- 앱 전체를 Docker 실행에 묶는 구조

## 라이선스

MIT License입니다. 자세한 내용은 `LICENSE`를 확인하세요.
