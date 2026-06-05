# Stage 2 Gate: Broker Connection Foundation

Generated: 2026-06-04
Updated: 2026-06-06

File name note: this file keeps the original `stage-2-toss-readonly-connector.md` path because current code, docs, and history already reference it. The product meaning is now broader: Stage 2 is Broker Connection Foundation, and the currently implemented slice is the Toss read-only adapter.

## Objective

Establish the broker connection foundation for GaemiGuard.

Stage 2 proves that an official broker adapter can safely authenticate, sync account/market data, persist sanitized snapshots, report freshness, and feed Commander without leaking secrets or implying unsupported connection state.

The first implemented adapter is Toss read-only. Future adapters such as KIS should use the same broker contract after their source notes, capability mapping, and fixtures are prepared.

## Entry Criteria

- Stage 1 exit gate is accepted.
- Current Toss OpenAPI version is checked against `vendor/tossinvest/openapi-1.0.3.json`.
- Secrets storage plan is implemented or mocked with explicit non-production boundary.
- Product direction is aligned with `docs/product/broker-connection-and-trading.md`.

## In Scope

- Broker adapter contract and capability metadata.
- Toss OAuth2 client credentials token issuance.
- Toss account list.
- Toss holdings.
- Toss current prices.
- Toss orderbook.
- Toss exchange rate.
- Toss KR/US market calendars.
- Toss stock warnings.
- Rate-limit and retry handling.
- Connector health check.
- Read-only portfolio and market snapshots in SQLite.
- Commander/Portfolio/BrokerAgent/BrokerToss tool calls for read-only data and freshness.
- No-broker/manual data mode can be introduced in this stage if the implementation slice includes first-run workflow.

## First Implementation Slice

Implemented on 2026-06-05 as the first Stage 2 slice:

- TypeScript read-only connector contract and official OpenAPI operation constants.
- Fetch-based `TossInvestReadonlyClient` skeleton with injected credential provider and in-memory token cache.
- Mock replay connector for tests and local health wiring.
- API `/health` exposes `toss_read_only` status with OpenAPI version `1.0.3`, included operations, forbidden mutation operations, and read-only tool names.
- Commander adds a `BrokerTossAgent` timeline event only for the read-only tool contract; it does not claim that Toss is connected when credentials are absent.
- Live order submission remains blocked by the permission engine in Stage 1 and Stage 2 read-only mode.
- Tests cover 200 replay, 401, 403, 429, unknown enum values, mutation exclusion, health wiring, and mock secret/token non-persistence to SQLite/artifacts.

First-slice official data operations:

| Operation | Method | Path | Notes |
| --- | --- | --- | --- |
| `getAccounts` | GET | `/api/v1/accounts` | Returns masked account references only. |
| `getHoldings` | GET | `/api/v1/holdings` | Requires `X-Tossinvest-Account`; account sequence is passed at request time. |
| `getPrices` | GET | `/api/v1/prices` | Current price lookup by symbol list. |
| `getOrderbook` | GET | `/api/v1/orderbook` | Returned as an orderbook summary with best ask/bid plus levels. |
| `getExchangeRate` | GET | `/api/v1/exchange-rate` | KRW/USD style FX lookup. |
| `getKrMarketCalendar` | GET | `/api/v1/market-calendar/KR` | KR market calendar. |
| `getUsMarketCalendar` | GET | `/api/v1/market-calendar/US` | US market calendar. |
| `getStockWarnings` | GET | `/api/v1/stocks/{symbol}/warnings` | Unknown warning enum values are preserved as forward-compatible unknowns. |

Auth boundary:

- `issueOAuth2Token` is modeled for OAuth2 client credentials token issuance.
- This slice supports static/mock credential providers and an in-memory token cache only.
- Production OS credential-store integration is not implemented yet.
- Raw client secrets and access tokens must not be written to SQLite, artifacts, Commander responses, external agent context, or docs.

Explicitly forbidden mutation operations:

| Operation | Method | Path | Policy |
| --- | --- | --- | --- |
| `createOrder` | POST | `/api/v1/orders` | Hard-blocked in connector policy. |
| `modifyOrder` | POST | `/api/v1/orders/{orderId}/modify` | Hard-blocked in connector policy. |
| `cancelOrder` | POST | `/api/v1/orders/{orderId}/cancel` | Hard-blocked in connector policy. |

Explicitly excluded from this first slice:

- `getOrders`
- `getOrder`
- `getBuyingPower`
- `getSellableQuantity`
- `getCommissions`
- `getTrades`
- `getPriceLimit`
- `getCandles`
- `getStocks`

## Second Implementation Slice

Implemented on 2026-06-05 as the Stage 2 persistence/sync shape slice:

- SQLite snapshot tables and repository APIs for read-only Toss mock replay data:
  - `toss_readonly_accounts`
  - `toss_holdings_snapshots`
  - `toss_quote_snapshots`
  - `toss_orderbook_summary_snapshots`
  - `toss_exchange_rate_snapshots`
  - `toss_market_calendar_snapshots`
  - `toss_stock_warning_snapshots`
  - `toss_sync_logs`
  - `toss_rate_limit_metadata`
- `syncMockTossReadonlySnapshots` calls only the included Stage 2 read-only operations and persists a bounded snapshot bundle.
- Mock replay connector fixture coverage now includes accounts, holdings, prices, orderbook summary, FX, KR/US market calendars, and stock warnings.
- Account persistence uses masked account references only. Connector account sequence is used only during the in-memory sync call and is not stored by this slice.
- API `/health` can expose `snapshotFreshness` after an explicit mock replay sync. The metadata identifies `mock_replay_snapshot`, freshness, last successful sync time, snapshot counts, and rate-limit scopes.
- Commander/BrokerTossAgent can receive snapshot availability/freshness metadata only; it still cannot state holdings, balances, or account facts as true connector-grounded answers.
- Tests cover snapshot persistence, sync logs, rate-limit metadata, raw secret/token/account/order-id non-storage, health freshness wiring, Commander redaction, and mutation hard-block preservation.

Explicitly excluded from this second slice:

- Production OS credential store.
- User credential setup or disconnect UI.
- Real Toss API sync jobs.
- Production account sequence mapping.
- UI account/holdings/data freshness views.
- Commander account answers grounded in real read-only snapshots with source links.

## Product Direction Update

Accepted on 2026-06-06:

- GaemiGuard is broker-independent at the product level.
- Toss is the first implemented adapter slice, not the product center.
- KIS is a future adapter candidate after source notes and capability mapping.
- No-broker mode must be supported so the app is useful before broker login.
- Read-only is the current Stage 2 implementation boundary, not the final product boundary.
- Manual live orders are Stage 6.
- Rule-based automated trading is Stage 7.

## Third Implementation Slice

Implemented on 2026-06-06 as the Stage 2 broker adapter/manual foundation slice:

- Shared `BrokerAdapter` contract and capability model added in `packages/shared/src/broker-adapter.ts`.
- Common adapter status includes provider identity, display name, authority level, capabilities, connection status, freshness, and disabled order mutation capabilities.
- Toss read-only connector is wrapped as the first adapter implementation in `packages/core/src/broker-adapter.ts`.
- Toss adapter status distinguishes:
  - `not_configured` when credentials are absent
  - `mock_replay` when fixture replay is injected
  - future `readonly_available` for a production read-only credential boundary
- Toss adapter maps Toss-specific account, holding, quote, orderbook, FX, calendar, and warning data into common broker types without exposing account sequence values.
- No-broker/manual portfolio foundation added with local watchlist, manual holding, and manual cash models.
- SQLite tables added for `manual_watchlist_items`, `manual_holdings`, and `manual_cash_balances`.
- Manual portfolio API endpoints added:
  - `GET /portfolio/manual`
  - `PUT /portfolio/manual/watchlist`
  - `PUT /portfolio/manual/holdings`
  - `PUT /portfolio/manual/cash`
- Manual mode uses the synthetic account reference `manual:default`; no raw broker account reference is accepted or stored.
- API `/health` includes a `broker_adapters` check that reports no-broker/manual, Toss not-configured, Toss mock replay, and future read-only availability.
- Commander emits `BrokerAgent` broker-independent availability/freshness/capability metadata before Toss specialist metadata.
- `BrokerTossAgent` remains the Toss adapter specialist and does not answer account facts from availability metadata alone.
- Tests prove raw secret/token/account/order sentinel values are not stored or exposed through DB/API/Commander/manual portfolio paths, and order mutation remains unavailable.

## Out Of Scope

- `POST /api/v1/orders`.
- `POST /api/v1/orders/{orderId}/modify`.
- `POST /api/v1/orders/{orderId}/cancel`.
- Buying-power/sellable/commission as order-authority actions, unless read-only display is explicitly separated.
- Automatic trading.
- Unofficial Toss web-internal API use or any other unofficial broker web/internal API use.
- KIS implementation before a KIS source note, capability map, fixtures, and explicit goal.
- Public broker aggregation API service.

## Data Contract

Store:

- broker adapter ID and capability metadata
- masked account reference
- synthetic manual account reference
- manual watchlist, holding, and cash inputs
- holdings snapshot
- quote snapshot
- orderbook snapshot summary
- exchange-rate snapshot
- market calendar snapshot
- stock warning snapshot
- sync log and rate-limit metadata

Deferred until the production credential/sync slice:

- connector account sequence mapping locally, kept behind the credential boundary
- user-facing credential setup and disconnect flow
- real Toss sync jobs using production credentials

Do not store:

- raw client secret in SQLite
- raw access token in artifact
- unmasked account number in external artifacts
- raw account number in SQLite
- order identifiers in Stage 2 read-only snapshot persistence

## UI Contract

UI must show:

- broker connector status.
- specific Toss adapter status when Toss is selected.
- Last sync time.
- Data freshness warnings.
- Account/holdings table.
- Market data source label.
- Current authority badge, such as no broker, read account, draft-only, paper, manual live locked, or automation locked.

## Agent Contract

Commander can answer:

- "내 계좌 요약해줘"
- "이 종목 내 비중이 얼마나 돼?"
- "삼성전자 현재가와 내 보유 비중 같이 봐줘"
- "증권사 연결 없이 관심종목 기준으로 점검해줘"

Commander cannot:

- create order drafts unless Stage 5 API exists
- submit/modify/cancel orders
- infer missing account data as fact
- present Toss, KIS, or any broker as connected when the adapter is not configured and freshly synced

## Exit Gate

Stage 2 exits when:

- Broker adapter contract and capability metadata are represented in docs and code, or a narrower gate review explicitly defers the code contract while preserving existing Toss behavior.
- OpenAPI contract tests pass for included endpoints.
- Mock replay tests cover 200, 401, 403, 429, and unknown enum cases.
- Token storage does not write secrets to DB/artifacts.
- Mock replay snapshot persistence does not write raw secrets, tokens, raw account numbers, or order identifiers to DB/artifacts/API/Commander context.
- UI read-only data flow works.
- Commander read-only account question works with source links.
- Mutation endpoints remain unavailable or hard-blocked.
- Stage 2 status is shown as broker connection/read authority only, not manual trading or automation.

## Remaining Gaps Before Stage 2 Exit

- Production secret storage using the OS credential store.
- User-facing credential setup and disconnect flow.
- Real Toss sync jobs using the implemented snapshot repository.
- Production account sequence mapping behind the credential boundary.
- Rate-limit scheduler/backoff behavior beyond response metadata normalization.
- UI account/holdings/data freshness views.
- Commander account-aware answers grounded in real connector snapshots with source links.
- Security review for production credential lifecycle and external-agent redaction.
- Gate review record after full read-only workflow verification.
- KIS source note and capability map before any KIS implementation goal.
