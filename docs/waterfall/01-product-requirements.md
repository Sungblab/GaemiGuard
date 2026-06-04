# Product Requirements

Generated: 2026-06-04

## Product Identity

GaemiGuard helps a Korean retail investor ask an agent about their account, market context, research, scenario assumptions, and trade rationale before acting.

The app should feel like a serious investment operations terminal, not a consumer landing page.

## Target User

Primary:

- Korean retail investor using Toss Securities.
- Already comfortable with AI tools such as ChatGPT, Codex, Cursor, or Claude Code.
- Wants agentic workflows, memory, research, and automation, but does not want a reckless trading bot.

Secondary:

- Developer-investor who wants local-first control.
- Open-source contributor interested in agent orchestration, broker APIs, and investment safety.

## Core Jobs

1. Morning guard: "What should I pay attention to today?"
2. Account question: "How exposed am I to this stock or sector?"
3. Chart question: "After this selected range, why did price move like this?"
4. Research synthesis: "Summarize recent thesis-changing facts with sources."
5. Scenario question: "What conditions would make my base case wrong?"
6. Order review: "If I buy this, what rule or risk am I violating?"
7. Memory recall: "Why did I buy this before, and what did I say I would watch?"
8. Weekly review: "What did I do this week, and was it consistent with my rules?"

## Required Capabilities By Stage

| Capability | Stage |
| --- | --- |
| App shell, local API, Commander panel, artifacts | 1 |
| Official Toss read-only account and market data | 2 |
| Thesis, rules, journals, sourced research memory | 3 |
| MiroFish scenario analysis | 4 |
| Paper trading and order draft review | 5 |
| User-approved live order submit/cancel/modify | 6 |
| Rule-based automation | 7 |

## Non-Goals

- Mobile app.
- Social/community signal product.
- Strategy marketplace.
- Full HTS clone.
- Live auto trading before Stage 7.
- Trading through unofficial Toss web-internal APIs by default.
- Claims of guaranteed future price or guaranteed profit.

## User-Facing Safety Copy

Standard sensitive-action copy:

> 이 결과는 투자 판단 보조 정보입니다. GaemiGuard는 수익을 보장하지 않으며, 최종 투자 판단과 책임은 사용자에게 있습니다.

Order approval copy:

> 이 주문은 수익을 보장하지 않습니다. GaemiGuard는 사용자의 원칙과 현재 데이터 기준으로 위험을 점검했으며, 최종 책임은 사용자에게 있습니다.

## Acceptance Of Product Requirements

The product requirements are accepted when:

- Stage docs cover all required capabilities.
- Permission docs separate ordinary agent authority from trading authority.
- UI docs show Today Guard and Commander panel as first-class surfaces.
- Testing docs require gate evidence before any stage opens.
