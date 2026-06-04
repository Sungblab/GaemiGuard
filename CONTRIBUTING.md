# 기여 가이드

GaemiGuard는 투자 자동화보다 안전한 판단 흐름을 먼저 만드는 프로젝트입니다. 기여할 때도 이 기준을 우선합니다.

## 기본 원칙

- 공식 문서와 재현 가능한 테스트를 우선합니다.
- 실주문, 자동매매, 인증/토큰 처리는 보수적으로 다룹니다.
- 에이전트가 실행한 작업은 감사 가능한 형태로 남겨야 합니다.
- 사용자가 명시적으로 승인하지 않은 매매 동작은 추가하지 않습니다.
- 민감 정보가 들어간 로그, fixture, 스크린샷은 커밋하지 않습니다.

## 개발 환경

```powershell
pnpm install
pnpm dev
```

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

## 브랜치와 PR

1. 변경 주제가 하나인 브랜치를 만듭니다.
2. 코드 변경에는 가능한 한 테스트를 함께 추가합니다.
3. README 또는 설계 문서와 맞지 않는 동작을 바꾸면 문서도 같이 업데이트합니다.
4. PR 설명에는 변경 이유, 검증 명령, 남은 리스크를 적습니다.

## 커밋 메시지

가능하면 다음 형식을 사용합니다.

```text
feat: add toss readonly connector skeleton
fix: keep order guard in dry-run mode
docs: document stage 2 api boundary
test: cover permission escalation policy
chore: update ci workflow
```

## 설계 변경

다음에 해당하면 코드보다 설계 문서를 먼저 업데이트하거나 PR에 설계 결정을 명확히 적어 주세요.

- 실주문 또는 자동매매에 영향을 주는 변경
- 에이전트 권한 모델 변경
- Toss/OpenBB/MiroFish/Hermes 같은 외부 시스템 경계 변경
- DB schema 또는 artifact format 변경
- 사용자의 투자 판단 흐름을 바꾸는 UI 변경

## 보안

보안 취약점은 공개 이슈로 올리지 마세요. `SECURITY.md`의 절차를 따릅니다.
