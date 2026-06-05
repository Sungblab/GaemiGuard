# Toss Invest Open API Local Notes

Source: `vendor/tossinvest/openapi-1.0.3.json`

The official browser docs are JavaScript-rendered, so this repository keeps the OpenAPI document locally for agent-readable reference.

## Snapshot

- Title: 토스증권 Open API
- OpenAPI: 3.1.0
- Version: 1.0.3
- Base server: `https://openapi.tossinvest.com`
- Auth: OAuth 2.0 Client Credentials Grant
- Account-scoped APIs require both `Authorization: Bearer {access_token}` and `X-Tossinvest-Account: {accountSeq}`
- Transport: REST only
- WebSocket: not currently supported; official tag description says future support is planned

## API Groups

| Group | Purpose | Account header |
| --- | --- | --- |
| Auth | Issue OAuth2 access tokens. | No |
| Market Data | Orderbook, prices, trades, price limits, candles. | No |
| Stock Info | Stock master data and stock warnings. | No |
| Market Info | KRW/USD exchange rate and KR/US market calendars. | No |
| Account | Account list. | Token only for account discovery |
| Asset | Holdings and account asset summary. | Yes |
| Order | Create, modify, and cancel orders. | Yes |
| Order History | List and inspect orders. | Yes |
| Order Info | Buying power, sellable quantity, commissions. | Yes |

## Endpoints

| Method | Path | Operation | Summary |
| --- | --- | --- | --- |
| POST | `/oauth2/token` | `issueOAuth2Token` | OAuth2 access token issuance |
| GET | `/api/v1/orderbook` | `getOrderbook` | Orderbook |
| GET | `/api/v1/prices` | `getPrices` | Current prices |
| GET | `/api/v1/trades` | `getTrades` | Recent trades |
| GET | `/api/v1/price-limits` | `getPriceLimit` | Price limits |
| GET | `/api/v1/candles` | `getCandles` | Candles, 1 minute and daily |
| GET | `/api/v1/stocks` | `getStocks` | Stock master data |
| GET | `/api/v1/stocks/{symbol}/warnings` | `getStockWarnings` | Stock warnings |
| GET | `/api/v1/exchange-rate` | `getExchangeRate` | Exchange rate |
| GET | `/api/v1/market-calendar/KR` | `getKrMarketCalendar` | KR market calendar |
| GET | `/api/v1/market-calendar/US` | `getUsMarketCalendar` | US market calendar |
| GET | `/api/v1/accounts` | `getAccounts` | Account list |
| GET | `/api/v1/holdings` | `getHoldings` | Holdings |
| GET | `/api/v1/orders` | `getOrders` | Order list |
| POST | `/api/v1/orders` | `createOrder` | Create order |
| GET | `/api/v1/orders/{orderId}` | `getOrder` | Order detail |
| POST | `/api/v1/orders/{orderId}/modify` | `modifyOrder` | Modify order |
| POST | `/api/v1/orders/{orderId}/cancel` | `cancelOrder` | Cancel order |
| GET | `/api/v1/buying-power` | `getBuyingPower` | Buying power |
| GET | `/api/v1/sellable-quantity` | `getSellableQuantity` | Sellable quantity |
| GET | `/api/v1/commissions` | `getCommissions` | Commissions |

## Rate Limits

The overview text in the pasted docs describes rate limits by client and API group. The current limit is also returned in response headers.

| Header | Meaning |
| --- | --- |
| `X-RateLimit-Limit` | Current per-second burst capacity |
| `X-RateLimit-Remaining` | Remaining bucket tokens |
| `X-RateLimit-Reset` | Seconds until one token refills |
| `Retry-After` | Retry delay for 429 responses |

Client behavior:

- Respect `Retry-After` on 429.
- Apply exponential backoff with jitter.
- Slow down preemptively when `X-RateLimit-Remaining` is low.
- Keep separate buckets by API group.

## Error Model

Most API errors use this envelope:

```json
{
  "error": {
    "requestId": "01HXYZABCDEFG123456789",
    "code": "invalid-request",
    "message": "주문 방향이 올바르지 않습니다.",
    "data": {
      "field": "side",
      "allowedValues": ["BUY", "SELL"]
    }
  }
}
```

Important implementation notes:

- Preserve `requestId` in logs and user-visible troubleshooting cards.
- Treat unknown enum values as forward-compatible where the OpenAPI descriptions request it.
- Use decimal strings as decimal strings; do not coerce money or share quantities through JavaScript floating point in core accounting code.
- Order creation supports `clientOrderId` as an idempotency key with a documented 10 minute validity window.
- High-value orders may require `confirmHighValueOrder`.

## GaemiGuard Connector Policy

Use official Open API as the only Toss connector. Toss is the first implemented broker adapter slice, not the product center.

Do not pass Toss credentials, access tokens, or account identifiers to Hermes, MiroFish, OpenClaw, OpenBB, or other external agents. External tools should receive sanitized portfolio context only.

Stage 2 first-slice connector scope:

1. `issueOAuth2Token`
2. `getAccounts`
3. `getHoldings`
4. `getPrices`
5. `getOrderbook`
6. `getExchangeRate`
7. `getKrMarketCalendar`
8. `getUsMarketCalendar`
9. `getStockWarnings`

The first implementation slice excludes order history and order-info reads (`getOrders`, `getOrder`, `getBuyingPower`, `getSellableQuantity`, `getCommissions`) until they are separated from order authority in product and UI copy.

Mutation operations remain forbidden:

- `createOrder`
- `modifyOrder`
- `cancelOrder`

Defer live order mutation until GaemiGuard has:

- Broker adapter capability checks
- Stage 2 read authority complete
- Separate Stage 6 manual order permission
- Separate Stage 7 automation permission
- Order Guard preview
- User confirmation
- Global kill switch
- Audit log
