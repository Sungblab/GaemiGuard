# GaemiGuard Agent Instructions

This is the first rule file for Codex and other agents working in this repository. Keep it short. Put longer status, history, and handoff details in the linked documents.

## Language Policy

- Keep repository artifacts in English by default: code, comments, tests, commit messages, PR text, documentation, scripts, and CI or harness labels.
- Public-facing Korean documents are allowed when the user explicitly requests them; `README.md` is Korean because the intended audience is Korean.
- Reply to Sungbin in natural Korean in chat unless the user explicitly asks for another language.
- When explaining technical work to the user, prefer plain Korean. If an English technical term is necessary, briefly explain what it means.
- Do not make repository documents Korean just because the chat response is Korean.

## Read First

For every development goal, read these before changing code:

1. `docs/agent-index.md`
2. `docs/development-status.md`
3. The active stage gate under `docs/stages/`
4. Any source document named by the user or by the active status entry

`docs/agent-index.md` is the short routing map. `docs/development-status.md` is the current truth for what is done, what is in progress, what is blocked, and what to do next.

## Setup Contract

When asked to set up or verify the repo:

1. Inspect OS/shell, `package.json`, `pnpm-workspace.yaml`, and `.gitignore`.
2. Verify Node.js 22+ and pnpm 10+.
3. Run `pnpm install`.
4. Run `pnpm docs:agent-check`.
5. Run `pnpm docs:html`.
6. Run `pnpm verify`.
7. Report exact failures.

## Safety

- Do not create, request, print, store, or commit broker secrets, OAuth tokens, account numbers, order IDs, or personal identifiers.
- Do not create `.env` files with real credentials.
- Do not enable live trading, automatic trading, or broker order mutation endpoints unless a later approved stage explicitly allows it.
- Do not call unofficial broker web/internal APIs.
- Do not install optional sidecars such as Hermes, MiroFish, OpenBB, or Graphiti unless explicitly asked.
- Keep generated app build output such as `apps/desktop/dist` out of commits.

## Verification

- Normal repo work: `pnpm verify`
- Documentation updates: also run `pnpm docs:agent-check` and `pnpm docs:html`
- User-visible desktop UI workflow changes: run `pnpm smoke:desktop`

Use `pnpm smoke:desktop` instead of ad-hoc Vite preview servers on Windows.

## Documentation HTML

`pnpm docs:html` rebuilds `docs/gaemiguard-all-docs.html`, the single-file documentation bundle used by humans and agents to inspect the repository context quickly. Regenerate it after documentation changes.

## Handoff

When writing a next-session prompt, use the `/goal` prompt format with `CWD`, `Goal`, context, constraints, verification, and completion criteria.

If the goal would exceed about 4,000 characters, write the full task spec under `docs/handoffs/` and keep the `/goal` prompt short.

## Product Boundary

GaemiGuard is an agent-first local personal investment workspace for Korean retail investors.

The primary product is the personal investment agent. The investment guard and the small local investment terminal are supporting parts of that agent experience.

GaemiGuard is not a profit bot, brokerage clone, unofficial broker wrapper, Bloomberg/OpenBB clone, news-feed product, or automation-first live trading bot.

GaemiGuard is broker-independent at the product level. Toss, KIS, Kiwoom, LS, CSV import, and manual portfolio entry are adapters or data inputs under the broker contract. Read-only is the current Stage 2 implementation boundary, not the final product boundary.
