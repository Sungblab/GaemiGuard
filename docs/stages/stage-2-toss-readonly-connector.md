# Stage 2 Gate: Toss Readonly Connector

Generated: 2026-06-04

## Objective

Connect official Toss Invest Open API read-only data to GaemiGuard so Commander can answer account-aware and market-aware questions.

## Entry Criteria

- Stage 1 exit gate is accepted.
- Toss OpenAPI version is checked against `vendor/tossinvest/openapi-1.0.3.json`.
- Secrets storage plan is implemented or mocked with explicit non-production boundary.

## In Scope

- OAuth2 client credentials token issuance.
- Account list.
- Holdings.
- Current prices.
- Orderbook.
- Exchange rate.
- KR/US market calendars.
- Stock warnings.
- Rate-limit and retry handling.
- Connector health check.
- Read-only portfolio and market snapshots in SQLite.
- Commander/Portfolio/BrokerToss tool calls for read-only data.

## Out Of Scope

- `POST /api/v1/orders`.
- `POST /api/v1/orders/{orderId}/modify`.
- `POST /api/v1/orders/{orderId}/cancel`.
- Buying-power/sellable/commission as order-authority actions, unless read-only display is explicitly separated.
- Automatic trading.
- Unofficial Toss web-internal API use.

## Data Contract

Store:

- masked account reference
- connector account sequence mapping locally
- holdings snapshot
- quote snapshot
- orderbook snapshot summary
- exchange-rate snapshot
- market calendar snapshot
- stock warning snapshot
- sync log and rate-limit metadata

Do not store:

- raw client secret in SQLite
- raw access token in artifact
- unmasked account number in external artifacts

## UI Contract

UI must show:

- Toss connector status.
- Last sync time.
- Data freshness warnings.
- Account/holdings table.
- Market data source label.
- Read-only mode badge.

## Agent Contract

Commander can answer:

- "내 계좌 요약해줘"
- "이 종목 내 비중이 얼마나 돼?"
- "삼성전자 현재가와 내 보유 비중 같이 봐줘"

Commander cannot:

- create order drafts unless Stage 5 API exists
- submit/modify/cancel orders
- infer missing account data as fact

## Exit Gate

Stage 2 exits when:

- OpenAPI contract tests pass for included endpoints.
- Mock replay tests cover 200, 401, 403, 429, and unknown enum cases.
- Token storage does not write secrets to DB/artifacts.
- UI read-only data flow works.
- Commander read-only account question works with source links.
- Mutation endpoints remain unavailable or hard-blocked.
