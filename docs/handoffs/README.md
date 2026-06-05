# Handoff Specs

Updated: 2026-06-06

긴 목표는 `/goal` 프롬프트에 모두 넣지 말고 이 폴더에 문서로 작성한다. `/goal`은 이 문서를 읽고 실행하라고 짧게 지시한다.

## 사용 시점

- 목표가 4천자를 넘을 때
- 금지 사항이 많을 때
- 완료 기준을 자세히 적어야 할 때
- 여러 세션이나 에이전트가 같은 기준을 봐야 할 때

## 작성 형식

```markdown
# <작업 이름>

## Goal

## Context

## First Read

## Do Not

## Implementation Scope

## Verification

## Completion Criteria
```

## 규칙

- 문서 안의 기준이 `/goal`보다 자세한 기준이다.
- 작업이 끝나면 `docs/development-status.md`에 결과와 다음 작업을 반영한다.
- Stage 문서의 완료/남은 gap도 같이 업데이트한다.
- 문서 변경 뒤에는 `pnpm docs:agent-check`와 `pnpm docs:html`을 실행한다.

