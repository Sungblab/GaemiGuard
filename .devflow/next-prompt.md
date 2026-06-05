/goal
CWD: C:\Users\Sungbin\Documents\GitHub\GaemiGuard

Goal:
Continue GaemiGuard Stage 2 Broker Connection Foundation after the shared BrokerAdapter/manual foundation slice. Implement the next production-safe credential and real Toss read-only sync slice only if the active docs still list it as next work.

Context:
- Stage 2 now has a shared BrokerAdapter contract, Toss read-only as the first adapter, manual no-broker watchlist/holding/cash DB/API foundations, API broker adapter health aggregation, and Commander BrokerAgent metadata.
- Manual mode uses the synthetic `manual:default` account reference.
- Order create/modify/cancel remain disabled/unavailable.
- Free-form manual notes are accepted by the API schema for forward compatibility but are not persisted or echoed in this Stage 2 slice.
- Latest local evidence for the completed broker adapter/manual foundation slice: `pnpm docs:agent-check`, `pnpm docs:html`, `pnpm verify`, and `pnpm smoke:desktop`.

First read:
- AGENTS.md
- docs/agent-index.md
- docs/development-status.md
- docs/product/broker-connection-and-trading.md
- docs/stages/stage-2-toss-readonly-connector.md
- docs/architecture/agent-runtime.md
- docs/architecture/maps/README.md

Constraints:
- Do not create, request, print, store, or commit real broker secrets, OAuth tokens, account numbers, order IDs, or personal identifiers.
- Do not call unofficial broker web/internal APIs.
- Do not enable live trading, automatic trading, or broker order mutation endpoints.
- Keep Toss as one adapter, not the product center.
- Preserve no-broker/manual mode as an honest local context path.

Verification:
- pnpm docs:agent-check
- pnpm docs:html
- pnpm verify
- pnpm smoke:desktop only if a user-visible desktop workflow changes

Completion criteria:
- The next Stage 2 slice is implemented within the active stage gate.
- Docs and `docs/gaemiguard-all-docs.html` match code.
- Raw secret/token/account/order identifiers remain absent from DB/API/artifacts/Commander/external context.
- Order mutation remains hard-blocked/unavailable.
- PR CI and main CI pass before claiming completion.
