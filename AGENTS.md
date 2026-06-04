# GaemiGuard Agent Instructions

This file is for coding agents that are asked to set up, modify, or verify GaemiGuard.

## Setup Contract

When the user asks you to set up this repository:

1. Inspect the current OS, shell, `package.json`, `pnpm-workspace.yaml`, and `.gitignore`.
2. Verify Node.js 22+ and pnpm 10+.
3. Run `pnpm install`.
4. Run `pnpm docs:html`.
5. Run `pnpm verify`.
6. Report exact failures if any command fails.

Do not ask the user to manually copy commands unless a runtime, permission, or network blocker prevents you from continuing.

## Safety Rules

- Do not create, request, print, or commit Toss API secrets, OAuth secrets, tokens, account numbers, order IDs, or personal identifiers.
- Do not create `.env` files with real credentials.
- Do not enable live trading.
- Do not call Toss order mutation endpoints.
- Do not install optional sidecars such as Hermes, MiroFish, OpenBB, or Graphiti unless the user explicitly asks.
- Keep generated build output such as `apps/desktop/dist` out of commits.

## Verification

Before claiming completion, run the narrow command that proves the claim. For normal repo work, use:

```powershell
pnpm verify
```

For documentation bundle updates, also run:

```powershell
pnpm docs:html
```

When a user-visible desktop UI workflow changes, run the Windows-safe Playwright smoke instead of hand-rolling a Vite preview session:

```powershell
pnpm smoke:desktop
```

This command builds the desktop bundle, starts the local API, serves `apps/desktop/dist` with Python, verifies `/favicon.svg`, drives the Commander chat flow through Playwright CLI, checks that the composer input is re-enabled, and writes artifacts under `output/playwright/`.

Do not use `pnpm --dir apps/desktop exec vite preview` as a background smoke server on Windows. It is prone to `Command "vite" not found` and silent process shutdowns when launched through `Start-Process`. Use `pnpm smoke:desktop` or serve the built `dist` folder directly.

## Product Boundary

GaemiGuard is an investment guard and local-first agent orchestrator. It is not a profit bot, generic brokerage clone, or unofficial broker API wrapper.
