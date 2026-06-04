# GaemiGuard

GaemiGuard is a local-first desktop investment orchestrator for Korean retail investors.

It is intended to connect Toss Invest Open API, Hermes research, MiroFish scenario simulation, OpenBB data, Graphiti temporal memory, and optional remote chat surfaces without turning into a generic trading app or autonomous profit bot.

## Local Reference Docs

This folder keeps crawler-resistant or JavaScript-rendered source material locally so coding agents can work without relying on live documentation pages.

| File | Purpose |
| --- | --- |
| `gaemiguard-design-spec.md` | Locked 65/65 product and architecture decisions. |
| `docs/architecture/design-index.md` | Canonical map of design documents and implementation sources. |
| `docs/architecture/stage-1-foundation.md` | Stage 1 foundation scope, acceptance criteria, and non-goals. |
| `docs/architecture/agent-runtime.md` | Commander/specialist agent runtime and permission model. |
| `docs/gaemiguard-product-context.md` | Product, architecture, security, staged build, and module direction. |
| `docs/toss-invest-openapi.md` | Human-readable local summary of Toss Invest Open API v1.0.3. |
| `vendor/tossinvest/openapi-1.0.3.json` | Exact pasted OpenAPI 3.1 source document for Toss Invest Open API. |
| `vendor/tossinvest/README.md` | Source provenance and usage notes for vendored Toss docs. |
| `prototypes/index.html` | Preserved static UI prototype. |

`external/` is intentionally ignored. Keep local MiroFish/Hermes/OpenBB clones there for development, but do not ship nested git repositories, virtualenvs, or large sidecar checkouts in the GaemiGuard app repository.

## Current Implementation Direction

Start from the official Toss Invest Open API, not unofficial web-internal APIs.

Initial read-only connector slice:

1. OAuth2 client credentials token issuance.
2. Account list.
3. Holdings.
4. Prices and orderbook.
5. Exchange rate and market calendars.
6. Stock warnings.

Trading should stay disabled until GaemiGuard has its own Order Guard, audit log, kill switch, and explicit user approval flow.

## Stage 1 Foundation

The first runnable slice is a vertical runtime spine:

1. Electron + React desktop shell.
2. Fastify local API.
3. SQLite persistence.
4. Markdown/JSON artifact storage.
5. Commander Agent chat panel.
6. Portfolio/Research/Scenario/Order Guard specialist stubs.
7. Deterministic permission policy that blocks live orders.

Run locally:

```powershell
pnpm install
pnpm dev
```

Verification:

```powershell
pnpm test
pnpm typecheck
pnpm build
```
