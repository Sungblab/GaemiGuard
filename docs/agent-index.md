# GaemiGuard Agent Index

Updated: 2026-06-06

이 문서는 에이전트가 GaemiGuard 작업을 시작할 때 보는 짧은 안내서다. 자세한 내용은 여기서 링크한 원문 문서를 따른다.

## 먼저 읽을 문서

| 순서 | 문서 | 이유 |
| --- | --- | --- |
| 1 | `AGENTS.md` | 짧은 규칙, 금지 사항, 검증 명령 |
| 2 | `docs/agent-index.md` | 에이전트용 문서 길잡이 |
| 3 | `docs/development-status.md` | 현재 완료/진행/다음 작업 |
| 4 | `docs/stages/stage-2-toss-readonly-connector.md` | 현재 Stage 2 작업 기준 |
| 5 | `docs/architecture/maps/README.md` | 문서와 코드 소유 위치 |

필요할 때만 읽을 문서:

| 필요 | 문서 |
| --- | --- |
| 전체 계획 | `docs/waterfall/00-master-plan.md` |
| 개발 과정 | `docs/development-history.md` |
| 토스 API | `docs/toss-invest-openapi.md`, `vendor/tossinvest/openapi-1.0.3.json` |
| Commander/runtime | `docs/architecture/agent-runtime.md` |
| 화면 테스트 | `docs/setup/playwright-smoke.md` |
| 작업 절차 | `docs/contributing/workflow.md` |

## 현재 사실

- 현재 개발 방식은 단계별 문 닫기 방식이다.
- Stage 1은 완료됐다.
- Stage 2는 진행 중이다.
- Stage 2는 아직 완료가 아니다.
- 토스 주문 생성/수정/취소는 아직 금지다.
- 실제 토스 비밀값, 토큰, 계좌번호, 주문번호는 코드/문서/DB/artifact/API 응답에 넣으면 안 된다.

## 현재 구현된 것

- 로컬 앱과 로컬 API
- SQLite 저장소
- Commander runtime
- 결과 artifact 저장
- 권한 엔진과 실주문 차단
- Toss 읽기 전용 연결 뼈대
- Toss 가짜 응답 기반 snapshot 저장/동기화
- snapshot freshness health 표시

자세한 목록은 `docs/development-status.md`를 따른다.

## 다음 작업을 잡는 법

긴 목표는 `/goal` 안에 전부 넣지 않는다. 4천자를 넘는 목표는 먼저 문서로 만든다.

권장 방식:

1. `docs/handoffs/` 아래에 긴 작업 명세를 만든다.
2. `/goal`에는 짧은 목표와 그 문서 경로만 넣는다.
3. 완료 기준은 문서에 쓴다.
4. 작업이 끝나면 `docs/development-status.md`와 관련 stage 문서를 업데이트한다.

짧은 `/goal` 예시:

```text
/goal CWD: C:\Users\Sungbin\Documents\GitHub\GaemiGuard

Goal:
docs/handoffs/<file>.md에 정의된 Stage 2 다음 작업을 코드/테스트/문서/PR/CI/main 확인까지 완료한다.

First read:
- AGENTS.md
- docs/development-status.md
- docs/agent-index.md
- docs/handoffs/<file>.md

Verification:
- pnpm docs:agent-check
- pnpm docs:html
- pnpm verify
```

## 하네스 명령

작업 시작 전에:

```powershell
devflow doctor --json
devflow status --json
```

문서만 바꿔도:

```powershell
pnpm docs:agent-check
pnpm docs:html
```

일반 작업 완료 전:

```powershell
pnpm verify
```

화면 흐름을 바꿨다면:

```powershell
pnpm smoke:desktop
```

## 하네스 점검 기준

`pnpm docs:agent-check`는 에이전트가 반드시 알아야 하는 문서와 연결이 빠졌는지 검사한다. 새 핵심 문서를 추가하면 `scripts/check-agent-docs.mjs`에도 기대 항목을 추가한다.

Devflow gate는 `.devflow/config.json`에 있다. 새 에이전트가 보는 기본 gate는 다음이다.

- `agent-docs`: `pnpm docs:agent-check`
- `docs-html`: `pnpm docs:html`
- `verify`: `pnpm verify`

GitHub CI는 `.github/workflows/ci.yml`에 있다. 기본 원칙은 다음이다.

- GitHub token 권한은 읽기만 허용한다.
- 같은 브랜치의 오래된 CI는 취소한다.
- 작업 시간이 비정상적으로 길어지면 자동으로 멈춘다.
- `pnpm` 캐시를 사용한다.
- PR과 main 검사에서 `pnpm docs:agent-check`, `pnpm docs:html`, `pnpm verify`를 모두 실행한다.

## 금지

- Stage 2에서 토스 주문 기능을 만들지 말 것.
- 실제 비밀값을 만들거나 저장하지 말 것.
- mock 상태를 실제 연결처럼 말하지 말 것.
- 문서만 바꾸고 `docs/gaemiguard-all-docs.html` 재생성을 빼먹지 말 것.
