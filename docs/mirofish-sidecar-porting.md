# MiroFish Sidecar Porting

GaemiGuard should run MiroFish as a local CLI sidecar, not as a Docker-only service.

## Current Decision

- Use `external/mirofish-cli`, not the original web/Docker app.
- Run it with Windows-native Python 3.11 via `uv`.
- Use Codex CLI as the LLM provider.
- Treat MiroFish output as scenario simulation only. It must not place orders directly.
- Treat the sidecar as optional. GaemiGuard must start and all Stage 1-3 flows must keep working when MiroFish is missing, not configured, or failed.

## Stage 4 Boundary

The first Stage 4 implementation slice should add the GaemiGuard-side contract before depending on a live sidecar:

- report sidecar status as `not_configured`, `available`, or `failed`
- package source/freshness-grounded scenario inputs from portfolio, memory, research, and weekly review context
- write scenario input/output artifacts under GaemiGuard's configured artifact directory
- redact secrets, raw account identifiers, order identifiers, and personal identifiers before any sidecar input is written
- block order placement, scheduling, drafting, and mutation
- surface safe failure messages when the sidecar is missing or fails

Do not install, vendor, or run MiroFish automatically during normal repo verification. Use the local setup below only when the user explicitly asks to configure or validate the sidecar on this machine.

## Optional Local Setup

Historical local defaults used on this machine:

- `external/mirofish-cli/.python-version`: `3.11`
- `external/mirofish-cli/.env`: `LLM_PROVIDER=codex-cli`

Smoke check:

```powershell
cd C:\Users\Sungbin\Documents\GitHub\GaemiGuard\external\mirofish-cli
uv run mirofish doctor
```

Expected result:

```text
[PASS] LLM_PROVIDER set
[PASS] LLM_PROVIDER valid
[PASS] codex binary on PATH
doctor: all checks passed
```

## Windows Fixes Applied

- `uv` must use Python 3.11 because the current dependency lock fails on Windows Python 3.12 for `rapidfuzz`.
- The provider named `codex-cli` maps to the actual Windows executable `codex.cmd`.
- Codex calls use a temporary Windows-safe working directory instead of `/tmp`.
- Codex response parsing reads `--output-last-message` instead of scraping mixed stdout logs.

## Optional Sidecar Verification

When explicitly validating the optional sidecar, the historical smoke commands were:

```powershell
uv run mirofish doctor
uv run pytest -q
```

Also previously verified: a direct MiroFish `LLMClient(provider="codex-cli")` call returned through Codex CLI.

These commands are not part of the normal GaemiGuard verification gate unless the active task is sidecar configuration or sidecar implementation.
