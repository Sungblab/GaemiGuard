# Product Requirements

Generated: 2026-06-04

## Product Identity

GaemiGuard is an agent-first local personal investment workspace for Korean retail investors.

It helps the user ask an agent about their account, no-broker manual portfolio, market context, research, scenario assumptions, personal rules, and trade rationale before acting.

The app may include dense terminal-like data surfaces, but those surfaces support the agent. The product should not become a general financial terminal where the agent is only an add-on.

## Target User

Primary:

- Korean retail investor using Toss Securities.
- Already comfortable with AI tools such as ChatGPT, Codex, Cursor, or Claude Code.
- Wants agentic workflows, memory, research, and automation, but does not want a reckless trading bot.
- May want manual trading and later rule-based automation after safety gates are proven.

Secondary:

- Developer-investor who wants local-first control.
- Open-source contributor interested in agent orchestration, broker APIs, and investment safety.

## Core Jobs

1. Morning guard: "What should I pay attention to today?"
2. Account or manual portfolio question: "How exposed am I to this stock or sector?"
3. Chart question: "After this selected range, why did price move like this?"
4. Research synthesis: "Summarize recent thesis-changing facts with sources."
5. Scenario question: "What conditions would make my base case wrong?"
6. Order review: "If I buy this, what rule or risk am I violating?"
7. Memory recall: "Why did I buy this before, and what did I say I would watch?"
8. Weekly review: "What did I do this week, and was it consistent with my rules?"
9. Manual trade: "Review and submit this order after I approve it."
10. Rule automation: "Only within this rule, amount, market, cooldown, and kill switch."

## Required Capabilities By Stage

| Capability | Stage |
| --- | --- |
| App shell, local API, Commander panel, artifacts | 1 |
| Broker adapter contract, no-broker mode, and current Toss read-only account/market adapter | 2 |
| Thesis, rules, journals, sourced research memory | 3 |
| MiroFish scenario analysis | 4 |
| Paper trading and order draft review | 5 |
| User-approved manual live order submit/cancel/modify | 6 |
| Rule-based automation | 7 |

## Non-Goals

- Mobile app.
- Social/community signal product.
- Strategy marketplace.
- Full HTS clone.
- Bloomberg/OpenBB clone.
- Generic news-feed product.
- Manual live trading before Stage 6.
- Live auto trading before Stage 7.
- Trading through unofficial broker web-internal APIs by default.
- Public broker aggregation API platform.
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
