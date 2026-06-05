# GaemiGuard Development History

Updated: 2026-06-06

이 문서는 GaemiGuard가 어떤 순서로 만들어졌는지 PR 기준으로 정리한다. 새 에이전트가 “왜 현재 구조가 이렇게 되었는지”를 빠르게 이해할 때 사용한다.

현재 상태의 사실 확인은 항상 `docs/development-status.md`와 최신 `git log`를 우선한다. 이 문서는 개발 흐름을 보는 보조 문서다.

## 한눈에 보는 흐름

1. PR #1에서 로컬 앱, API, DB, Commander, 주문 차단까지 Stage 1 뼈대를 만들었다.
2. PR #2-#4에서 GitHub 자동 검사 도구를 최신화했다.
3. PR #5-#7에서 Waterfall 개발 방식, 문서 허브, 설치/기여 문서를 정리했다.
4. PR #8-#9에서 첫 화면과 Windows 데스크톱 화면 검증을 보강했다.
5. PR #10-#11에서 Toss 읽기 전용 연결의 첫 뼈대와 가짜 응답 기반 저장/동기화 구조를 만들었다.

## PR별 기록

| PR | Merge commit | 날짜 | 한 일 | 다음 작업에 남긴 의미 |
| --- | --- | --- | --- | --- |
| [#1](https://github.com/Sungblab/GaemiGuard/pull/1) | `f34d948` | 2026-06-04 | Stage 1 Foundation 구현. Electron/React 화면, Fastify API, SQLite, artifact 저장, Commander runtime, specialist stub, 권한 엔진, Order Guard dry-run, 실주문 차단을 추가했다. | GaemiGuard가 단순 화면이 아니라 로컬 agent runtime이라는 기준을 만들었다. |
| [#2](https://github.com/Sungblab/GaemiGuard/pull/2) | `bb9a36a` | 2026-06-04 | GitHub Actions `actions/checkout` 업데이트. | 자동 검사 기반을 최신 상태로 맞췄다. |
| [#3](https://github.com/Sungblab/GaemiGuard/pull/3) | `16224c6` | 2026-06-04 | GitHub Actions `actions/setup-node` 업데이트. | Node 설치 단계의 자동 검사 안정성을 맞췄다. |
| [#4](https://github.com/Sungblab/GaemiGuard/pull/4) | `c3aa5c3` | 2026-06-04 | GitHub Actions `pnpm/action-setup` 업데이트. | pnpm 설치 단계의 자동 검사 안정성을 맞췄다. |
| [#5](https://github.com/Sungblab/GaemiGuard/pull/5) | `f765cfb` | 2026-06-04 | Waterfall 개발 기준 문서 추가. 단계, 금지 범위, 검증 기준, 위험 목록, 요구사항 추적을 문서화했다. | “작은 MVP”가 아니라 단계별 문 닫기 방식으로 개발한다는 원칙을 고정했다. |
| [#6](https://github.com/Sungblab/GaemiGuard/pull/6) | `664543b` | 2026-06-04 | 문서 허브와 단일 HTML 문서 생성 추가. | 에이전트와 사람이 한 파일에서 전체 문서를 검색할 수 있게 했다. |
| [#7](https://github.com/Sungblab/GaemiGuard/pull/7) | `5eaf8dc` | 2026-06-04 | 라이선스, 설치 안내, 에이전트 보조 설치 문서를 정리했다. | 저장소를 공개/협업 가능한 형태로 맞췄다. |
| [#8](https://github.com/Sungblab/GaemiGuard/pull/8) | `1e70036` | 2026-06-04 | Stage 1 홈 화면을 제품 화면에 가깝게 개선했다. | 첫 화면이 “데모”가 아니라 Today Guard 대시보드 방향을 갖게 되었다. |
| [#9](https://github.com/Sungblab/GaemiGuard/pull/9) | `a31655c` | 2026-06-04 | Windows-safe desktop Playwright smoke 명령을 추가했다. | Windows에서 화면 변경 검증은 `pnpm smoke:desktop`로 한다는 기준을 만들었다. |
| [#10](https://github.com/Sungblab/GaemiGuard/pull/10) | `c97bbee` | 2026-06-05 | Toss 읽기 전용 연결 첫 뼈대 추가. 공식 OpenAPI 작업 목록, fetch client, mock replay, health 표시, Commander/BrokerTossAgent 읽기 도구 계약, 주문 변경 차단 테스트를 추가했다. | Stage 2가 시작됐지만 실제 credential store와 실제 동기화는 아직 없다는 선을 그었다. |
| [#11](https://github.com/Sungblab/GaemiGuard/pull/11) | `479faba` | 2026-06-05 | Toss 가짜 응답 기반 SQLite 저장/동기화 구조 추가. 계좌, 보유 종목, 현재가, 호가, 환율, 장 일정, 경고, 동기화 기록, 호출 제한 정보를 저장하고 freshness를 health/Commander에 안전하게 연결했다. | 실제 토스 연결 전에도 저장 구조와 민감정보 비저장 규칙을 테스트로 고정했다. |

## 현재까지 완성된 큰 덩어리

### Stage 1 Foundation

완료됐다. 로컬 앱, 로컬 API, SQLite, artifact 저장, Commander runtime, specialist stub, 권한 엔진, Order Guard dry-run, 실주문 차단이 있다.

### Stage 2 Toss Readonly Connector

진행 중이다. 읽기 전용 연결의 뼈대와 가짜 응답 기반 저장/동기화는 들어갔다.

아직 남은 일:

- 실제 비밀값 저장 경계
- 토스 credential setup/disconnect
- 실제 토스 읽기 동기화
- 호출 제한에 맞춘 실행 간격과 재시도
- 계좌/보유/자료 freshness UI
- Commander가 실제 읽기 자료와 출처를 근거로 답하는 흐름
- Stage 2 보안 검토와 gate 기록

## 문서 위치

- 현재 상태: `docs/development-status.md`
- 에이전트 작업 인덱스: `docs/agent-index.md`
- Stage 2 기준: `docs/stages/stage-2-toss-readonly-connector.md`
- 전체 문서 허브: `docs/README.md`
- 단일 HTML 문서: `docs/gaemiguard-all-docs.html`

