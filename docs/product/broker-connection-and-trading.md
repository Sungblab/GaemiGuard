# Broker Connection And Trading Direction

Updated: 2026-06-06

## Decision

GaemiGuard is broker-independent at the product and core-runtime level.

Toss, Korea Investment Securities (KIS), Kiwoom, LS, CSV import, and manual portfolio entry should be treated as broker/data adapters. No single broker should define the product identity.

Short rule:

> GaemiGuard owns the investment agent. Broker adapters provide account, market, and trading capabilities.

## Scope Decision

GaemiGuard is not a read-only product.

The product direction includes:

1. Account and market data reading.
2. Manual user-approved trading.
3. Order review and guard checks.
4. Paper trading and dry runs.
5. Rule-based automated trading under strict user-defined limits.

The current code is read-only because Stage 2 is still a foundation stage. Read-only is the current implementation boundary, not the final product boundary.

## Broker Strategy

Core should depend on a `BrokerAdapter` contract, not on Toss-specific or KIS-specific shapes.

```text
CommanderAgent
  -> BrokerAgent
  -> BrokerAdapter Contract
     -> TossAdapter
     -> KisAdapter
     -> KiwoomAdapter
     -> LsAdapter
     -> ManualPortfolioAdapter
     -> CsvImportAdapter
```

The adapter contract should expose common concepts:

- broker identity
- capability flags
- account references
- holdings
- cash and buying power
- quotes
- orderbook summaries
- exchange rates
- market calendars
- stock warnings
- order drafts
- order submission
- order modify/cancel
- order status and fills
- rate-limit metadata
- credential status
- last sync and freshness

Adapters do not need to support every capability. They must report what they can do.

Example capability shape:

| Capability | Meaning |
| --- | --- |
| `accounts.read` | Can read account list or account references. |
| `holdings.read` | Can read holdings or positions. |
| `cash.read` | Can read cash, buying power, or sellable quantity. |
| `quotes.read` | Can read current prices. |
| `orderbook.read` | Can read orderbook or best bid/ask summaries. |
| `orders.draft` | Can create a local order draft. |
| `orders.submit.manual` | Can submit only after explicit user approval. |
| `orders.modify.manual` | Can modify only after explicit user approval. |
| `orders.cancel.manual` | Can cancel only after explicit user approval. |
| `orders.automation` | Can execute bounded user-rule automation after Stage 7 gates. |
| `realtime.market` | Can stream market data. |
| `realtime.order` | Can stream order/fill updates. |

## Initial Broker Candidates

Toss remains useful as the first implemented adapter because existing code already models its official OpenAPI snapshot path.

KIS is a strong next adapter candidate because its official API surface appears broader for account, domestic/overseas trading, and real-time workflows. Before implementation, GaemiGuard needs a local KIS source note equivalent to `docs/toss-invest-openapi.md`.

Kiwoom and LS are later candidates. They should be evaluated after the broker contract exists.

Do not build an external broker aggregation API business now. GaemiGuard needs an internal adapter contract, not a public broker API platform.

## No-Broker Mode

GaemiGuard must be useful without a broker connection.

No-broker mode should support:

- watchlist
- thesis and rule writing
- manual portfolio entry
- CSV import
- research artifacts
- scenario artifacts
- order review checklist without real account execution
- weekly review based on manual data
- sample mode for first-run onboarding

The UI must never imply that real account data exists when no broker is connected.

Required answer pattern:

> No broker account is connected, so this answer cannot verify real holdings, cash, buying power, or order status. I can still review your watchlist, manual portfolio, thesis, rules, and research artifacts.

Current implementation note:

- The first no-broker/manual foundation exists in code.
- Local manual watchlist, holding, and cash inputs use the synthetic `manual:default` account reference.
- The API exposes manual portfolio read/upsert endpoints, but the desktop workflow has not yet been expanded into a full manual portfolio editor.
- Manual mode is local context only. It must not be displayed as a real broker connection.

## Trading Authority

Trading authority must be separate from ordinary agent permission.

| Authority | Product meaning | Stage |
| --- | --- | --- |
| Read account/market | Read connected broker snapshots. | Stage 2+ |
| Draft order | Create a local review object. | Stage 5+ |
| Paper trade | Simulate execution. | Stage 5+ |
| Manual live order | User explicitly approves submit/modify/cancel. | Stage 6+ |
| Rule automation | User-defined rules can trigger bounded live actions. | Stage 7+ |

Manual trading means the user approves a concrete order action. It does not mean the agent can trade freely.

Automatic trading means a user-defined rule can trigger a bounded action without per-order approval. It must require simulation history, limits, kill switches, audit logging, and immediate disable controls.

## Order Path

No live order path may bypass this flow:

```text
User intent or automation rule
  -> CommanderAgent
  -> BrokerAgent capability check
  -> OrderGuardAgent
  -> deterministic risk checks
  -> audit log prewrite
  -> approval or active automation rule
  -> idempotency key
  -> broker adapter mutation call
  -> reconciliation
  -> post-action report
```

Order Guard must check:

- broker capability
- account mapping
- instrument identity
- market status
- data freshness
- cash/buying power
- sellable quantity
- price type
- quantity/amount limits
- fees/taxes estimate
- concentration
- thesis and rule conflicts
- recent loss/revenge-trade signal
- warnings and trading halts
- kill switches
- approval or automation rule authority
- idempotency
- audit log write status

## Credential Boundary

Broker credentials and OAuth tokens must stay behind the connector boundary.

Rules:

- Store secrets only in the OS credential store.
- Store only masked account references in SQLite.
- Do not write raw access tokens, refresh tokens, client secrets, raw account numbers, order IDs, or personal identifiers to artifacts, logs, API responses, tests, or external-agent context.
- Pass sanitized portfolio context to external tools such as Hermes, MiroFish, OpenBB, or remote models.
- Keep credential setup and disconnect explicit and reversible.

## Stage 2 Reinterpretation

The existing Stage 2 file remains `docs/stages/stage-2-toss-readonly-connector.md` to avoid breaking current references.

Its product meaning is now:

> Stage 2 is the Broker Connection Foundation. The current implemented slice is the Toss read-only adapter and safe snapshot persistence.

Stage 2 should exit only after:

- the broker adapter contract exists,
- at least the current Toss read-only path is represented as one adapter,
- credential setup/disconnect is safe,
- real read-only sync is grounded with freshness/source links,
- no order mutation path is opened prematurely.

KIS implementation should not be mixed into the same small code slice unless the goal explicitly asks for it. KIS should first get a source note, capability mapping, and fixture plan.

Current code status:

- `BrokerAdapter` and capability metadata are implemented in shared/core packages.
- Toss read-only is represented as the first adapter.
- API health distinguishes no-broker/manual, Toss not-configured, Toss mock replay, and future read-only availability.
- Order create, modify, and cancel remain disabled/unavailable in Stage 2.
- Production credential setup, disconnect, and real Toss sync remain future Stage 2 work.

## Future Work Order

Recommended next direction:

1. Add credential setup/disconnect and real read-only Toss sync.
2. Add production account sequence mapping behind the credential boundary.
3. Add user-facing freshness and account/holdings surfaces that never imply connection before credentials and sync exist.
4. Add KIS source note and capability mapping.
5. Implement KIS read/account sync only after the contract is stable.
6. Add order draft and paper trading.
7. Add user-approved live orders.
8. Add rule-based automation.
