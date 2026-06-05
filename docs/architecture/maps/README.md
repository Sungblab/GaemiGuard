# Architecture Maps

Current routing:

| Area | Source docs | Owning paths | Verification |
| --- | --- | --- | --- |
| Current development state | `docs/development-status.md` | repo-wide | `pnpm docs:html`, `pnpm verify` |
| Stage plan | `docs/waterfall/00-master-plan.md`, `docs/stages/` | repo-wide | stage gate evidence |
| Agent runtime | `docs/architecture/agent-runtime.md` | `packages/core/src/commander-runtime.ts`, `apps/api/src/app.ts` | `pnpm verify` |
| Toss read-only connector | `docs/toss-invest-openapi.md`, `vendor/tossinvest/openapi-1.0.3.json` | `packages/shared/src/toss-readonly.ts`, `packages/core/src/toss-readonly-connector.ts` | connector tests, `pnpm verify` |
| Desktop smoke | `docs/setup/playwright-smoke.md` | `apps/desktop/`, `scripts/smoke-desktop-ui.ps1` | `pnpm smoke:desktop` |
