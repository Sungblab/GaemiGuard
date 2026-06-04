# Playwright Smoke Workflow

Generated: 2026-06-04

GaemiGuard uses a fixed Windows-safe Playwright smoke command for user-visible desktop UI changes.

```powershell
pnpm smoke:desktop
```

## What It Proves

The smoke command verifies:

- desktop bundle builds
- local API `/health` responds on `127.0.0.1:4317`
- built UI responds on `127.0.0.1:4173`
- `/favicon.svg` returns `image/svg+xml`
- home screen shows `실주문 차단`
- Commander textbox can be filled
- send button can be clicked
- structured review card renders
- `실행 로그 보기` is present
- composer input is re-enabled after response
- entering the next message enables the send button again
- browser console has `Errors: 0, Warnings: 0`

Artifacts are written to:

```text
output/playwright/
output/ui-smoke/
```

These outputs are ignored by Git and should not be committed.

## Why This Exists

On Windows/PowerShell, ad-hoc Playwright smoke checks were repeatedly failing for reasons unrelated to the product UI:

- launching `pnpm --dir apps/desktop exec vite preview` through `Start-Process` can print a URL and still fail with `Command "vite" not found`
- Vite preview child processes can exit before the smoke flow starts
- `run-code` snippets can hide selector mistakes when their output is not checked strictly
- hard-coded Playwright refs such as `e257` break after layout changes
- piping CLI output to `Out-Null` without checking `$LASTEXITCODE` makes failed steps look successful

The smoke script avoids those failure modes by:

- building the desktop app first
- serving `apps/desktop/dist` with `python.exe -m http.server`
- using Playwright CLI snapshot output to dynamically resolve the textbox and send button refs
- polling snapshots until the review card appears
- failing loudly on every non-zero Playwright CLI exit code
- cleaning up the API and static server listeners in `finally`

## Agent Rule

For desktop UI work, coding agents should use:

```powershell
pnpm smoke:desktop
```

Do not invent a new Playwright smoke command unless this script itself is the thing being debugged.

If the script fails, inspect:

```powershell
Get-Content output/playwright/gaemiguard-desktop-smoke.console.txt
Get-Content output/playwright/gaemiguard-desktop-smoke.after.txt
Get-Content output/ui-smoke/desktop-smoke-api.err.log
Get-Content output/ui-smoke/desktop-smoke-static.err.log
```

Then fix the exact failure before claiming the UI workflow is verified.
