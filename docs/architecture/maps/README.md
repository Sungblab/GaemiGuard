# Architecture Maps

Current routing:

| Area | Source docs | Owning paths | Verification |
| --- | --- | --- | --- |
| Current development state | `docs/development-status.md` | repo-wide | `pnpm docs:html`, `pnpm verify` |
| Agent routing and handoff | `AGENTS.md`, `docs/agent-index.md`, `docs/handoffs/README.md`, `docs/development-history.md` | `.devflow/config.json`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `plugins/devflow/`, `scripts/check-agent-docs.mjs` | `pnpm docs:agent-check`, `pnpm docs:html`, `pnpm verify` |
| Documentation routing | `docs/README.md`, `docs/architecture/design-index.md` | `scripts/build-docs-html.mjs`, `docs/gaemiguard-all-docs.html` | `pnpm docs:agent-check`, `pnpm docs:html`, `pnpm verify` |
| Product direction | `docs/product/README.md`, `docs/product/agent-first-direction.md`, `docs/product/broker-connection-and-trading.md`, `docs/product/external-tools-and-data.md`, `README.md` | `docs/waterfall/01-product-requirements.md`, `docs/waterfall/03-agent-orchestration.md`, `docs/waterfall/04-permission-and-safety.md`, `docs/waterfall/06-ui-and-workflows.md`, `apps/desktop/`, `packages/core/src/commander-runtime.ts` | `pnpm docs:agent-check`, `pnpm docs:html`, `pnpm verify` |
| Stage plan | `docs/waterfall/00-master-plan.md`, `docs/stages/` | repo-wide | stage gate evidence |
| Agent runtime | `docs/architecture/agent-runtime.md` | `packages/core/src/commander-runtime.ts`, `apps/api/src/app.ts` | `pnpm verify` |
| Broker connection foundation and Toss read-only adapter | `docs/product/broker-connection-and-trading.md`, `docs/toss-invest-openapi.md`, `vendor/tossinvest/openapi-1.0.3.json`, `docs/stages/stage-2-toss-readonly-connector.md` | `packages/shared/src/toss-readonly.ts`, `packages/core/src/toss-readonly-connector.ts`, `packages/core/src/toss-readonly-sync.ts`, `packages/db/src/schema.ts`, `packages/db/src/sqlite.ts`, `apps/api/src/app.ts` | connector tests, DB snapshot tests, API health tests, mutation hard-block tests, `pnpm verify` |
| Desktop smoke | `docs/setup/playwright-smoke.md` | `apps/desktop/`, `scripts/smoke-desktop-ui.ps1` | `pnpm smoke:desktop` |
