# MiroFish Sidecar Porting

GaemiGuard should run MiroFish as a local CLI sidecar, not as a Docker-only service.

## Current Decision

- Use `external/mirofish-cli`, not the original web/Docker app.
- Run it with Windows-native Python 3.11 via `uv`.
- Use Codex CLI as the LLM provider.
- Treat MiroFish output as scenario simulation only. It must not place orders directly.

## Local Setup

The sidecar now includes local defaults:

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

## Verification

Validated on this machine:

```powershell
uv run mirofish doctor
uv run pytest -q
```

Also verified a direct MiroFish `LLMClient(provider="codex-cli")` call returns through Codex CLI.
