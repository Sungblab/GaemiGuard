# Agent-Assisted Setup

Generated: 2026-06-04

GaemiGuard is designed for an agent-assisted setup flow. The intended install experience is not "read a long README and manually type every command." The intended experience is:

1. Open a coding agent such as Codex, Cursor, Claude Code, or another local repo agent.
2. Give it the setup prompt.
3. Let it inspect the machine, install dependencies, run verification, and report only real blockers.

## Copy-Paste Setup Prompt

Use this prompt in your coding agent:

```text
이 레포를 내 로컬에 설치하고 실행 가능한 상태로 세팅해줘.

목표:
- 현재 OS와 shell을 확인해줘.
- Node.js 22 이상과 pnpm 10 이상이 있는지 확인해줘.
- 없거나 버전이 맞지 않으면 안전한 설치 방법을 제안하거나 설치해줘.
- pnpm install을 실행해줘.
- pnpm docs:html을 실행해서 docs/gaemiguard-all-docs.html을 생성/갱신해줘.
- pnpm verify를 실행해 테스트, 타입체크, 빌드를 확인해줘.
- 빌드 산출물처럼 Git에 넣으면 안 되는 파일은 커밋하지 마.
- API key, OAuth secret, Toss token, 계좌번호 같은 민감 정보는 만들거나 커밋하지 마.
- 막히는 부분이 있으면 정확한 에러와 다음 선택지를 알려줘.

완료 기준:
- pnpm install 성공
- pnpm docs:html 성공
- pnpm verify 성공
- git status로 예상 변경만 남았는지 확인
```

## What The Agent Should Do

The agent should:

- Inspect `package.json`, `pnpm-workspace.yaml`, and `.gitignore`.
- Prefer existing package scripts over ad-hoc commands.
- Run `pnpm install`.
- Run `pnpm docs:html`.
- Run `pnpm verify`.
- Run `pnpm smoke:desktop` when a user-visible desktop UI workflow changed.
- Keep `apps/desktop/dist` and other generated build output out of commits.
- Explain any missing runtime or failed command with exact evidence.

The agent should not:

- Create fake Toss credentials.
- Ask the user to paste secrets into chat.
- Commit `.env` files.
- Enable live trading.
- Install Hermes, MiroFish, OpenBB, or other optional sidecars during the first setup unless the user explicitly asks.

## Manual Fallback

If you are not using an agent:

```powershell
pnpm install
pnpm docs:html
pnpm verify
pnpm smoke:desktop
pnpm dev
```

Default development URLs:

- API: `http://127.0.0.1:4317`
- Desktop UI dev server: `http://127.0.0.1:5173`

## Future Direction

The long-term setup goal is a one-click agent task:

- Detect runtime.
- Install missing prerequisites.
- Set up optional components as hidden managed engines.
- Open the sample portfolio flow.
- Ask for secrets only inside secure local UI, not chat.

This keeps the user experience close to "ask the agent to set it up" while keeping sensitive financial data local and explicit.
