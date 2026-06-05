# GaemiGuard Agent Instructions

## Read First

For every development goal, read these before changing code:

1. `docs/development-status.md`
2. `docs/waterfall/00-master-plan.md`
3. The active stage gate under `docs/stages/`
4. Any source document named by the user or by the active status entry

`docs/development-status.md` is the handoff map for what is done, what is in progress, what is blocked, and what to do next.

## Setup Contract

When asked to set up or verify the repo:

1. Inspect OS/shell, `package.json`, `pnpm-workspace.yaml`, and `.gitignore`.
2. Verify Node.js 22+ and pnpm 10+.
3. Run `pnpm install`.
4. Run `pnpm docs:html`.
5. Run `pnpm verify`.
6. Report exact failures.

## Safety

- Do not create, request, print, store, or commit Toss secrets, OAuth tokens, account numbers, order IDs, or personal identifiers.
- Do not create `.env` files with real credentials.
- Do not enable live trading, automatic trading, or Toss order mutation endpoints unless a later approved stage explicitly allows it.
- Do not call unofficial Toss web/internal APIs.
- Do not install optional sidecars such as Hermes, MiroFish, OpenBB, or Graphiti unless explicitly asked.
- Keep generated app build output such as `apps/desktop/dist` out of commits.

## Verification

- Normal repo work: `pnpm verify`
- Documentation updates: also run `pnpm docs:html`
- User-visible desktop UI workflow changes: run `pnpm smoke:desktop`

Use `pnpm smoke:desktop` instead of ad-hoc Vite preview servers on Windows.

## Handoff

When writing a next-session prompt, use the `/goal` prompt format with `CWD`, `Goal`, context, constraints, verification, and completion criteria.

## Product Boundary

GaemiGuard is an investment guard and local-first agent orchestrator. It is not a profit bot, brokerage clone, unofficial broker wrapper, or live trading automation tool.
