# GaemiGuard Project Context

This is a long-running context document. The current product decision sources are `docs/product/agent-first-direction.md`, `docs/product/broker-connection-and-trading.md`, and `docs/product/external-tools-and-data.md`.

Read this document as background and future option context, not as permission to implement every listed external tool or automation feature in the current stage.

## 0. Project Summary

**GaemiGuard** is an agent-first local personal investment workspace for Korean retail investors.

It is not a normal stock trading app, not a simple news summarizer, and not a guaranteed-profit or automation-first trading bot.

GaemiGuard connects:

* Broker adapters such as Toss Invest Open API, KIS, future brokers, manual portfolio entry, and CSV import
* Hermes Agent
* MiroFish / GaemiGuard MiroFish fork
* OpenClaw
* OpenBB
* Graphiti / temporal knowledge graph
* Local LLM providers such as Codex login, OpenRouter, Ollama, and API keys

The goal is to help users manage their investment thesis, rules, research, scenario simulations, trade reviews, and later-stage automation from one local desktop application.

Core positioning:

> Brokerage apps execute trades.
> GaemiGuard helps the user organize judgment, evidence, and trading authority before action.

---

## 1. Product Philosophy

### 1.1 What GaemiGuard is

GaemiGuard is:

* A local-first desktop app
* An investment coach
* An investment research orchestrator
* A thesis and rule management tool
* A trade review and guardrail system
* A decision-relevant external signal viewer when sources and privacy boundaries are clear
* A later-stage rule-based automation layer on top of official broker APIs
* A knowledge/memory system for investment research

### 1.2 What GaemiGuard is not

GaemiGuard is not:

* A brokerage screen replacement
* A stock recommendation app
* A guaranteed-profit AI trading bot
* A Bloomberg/OpenBB clone
* A full financial data terminal
* A crawler-first project
* A self-contained deep research engine
* A generic portfolio tracker only
* A generic trading journal only

### 1.3 Main differentiation

GaemiGuard should focus on things brokerage apps do not deeply solve:

* Why did I buy this stock?
* Does this new trade violate my own rules?
* Did my investment thesis drift?
* Am I being influenced by community panic/FOMO/memes?
* What did past research say?
* What warnings did I ignore before?
* How does Hermes research affect my thesis?
* How does MiroFish scenario output affect my trade decision?
* Can I automate my own deterministic investment rules safely?

---

## 2. Target User

Initial target users:

* Korean retail investors
* People using Toss Invest or similar Korean brokerage apps
* People investing in Korean and US stocks
* AI-heavy users who already use ChatGPT, Codex, Cursor, Claude, OpenRouter, or Ollama
* Developers, students, indie hackers, and advanced retail investors
* Users who want investment journaling but fail to maintain Notion/Excel manually
* Users who read communities such as DCInside, Naver stock boards, Toss discussion boards, Reddit, Stocktwits, etc.

Not initial target users:

* Institutional investors
* High-frequency traders
* Professional quant traders
* Users expecting fully autonomous profit-generating bots
* Users who want a pure mobile-first brokerage app

---

## 3. Core Product Concept

GaemiGuard is a desktop app where the user can ask questions like:

* “AMD 리서치 돌려와”
* “AMD 2주 더 사도 됨?”
* “내 구글 비중 너무 높은가?”
* “오늘 미주갤 분위기 어때?”
* “MiroFish로 추가매수 시나리오 돌려봐”
* “이번 주 내 매매 복기해줘”
* “내 투자 원칙 어긴 주문 있어?”
* “환율 1450원 넘으면 QQQ 매수 보류하게 해줘”

GaemiGuard then:

1. Reads local investment context
2. Reads broker account/portfolio data if connected, or manual portfolio/watchlist data if not connected
3. Looks up thesis, rules, audit logs, and previous reports
4. Delegates deep research to Hermes Agent
5. Delegates scenario simulation to MiroFish
6. Optionally uses OpenBB for financial data
7. Optionally uses OpenClaw for remote chat
8. Stores all results into structured local memory
9. Updates ontology/knowledge graph
10. Produces a final response grounded in the user’s own thesis and rules

---

## 4. Architecture Decision

### 4.1 App type

Build as a **desktop program**, not a web SaaS.

Reason:

* User credentials and investment memory should remain local by default.
* The app must control local CLI/MCP/API tools such as Hermes, MiroFish, OpenBB, and OpenClaw.
* Local process management is central to the product.
* Brokerage tokens and automation policies should not live on our server.
* Open-source desktop distribution fits the product better than SaaS.

### 4.2 Recommended staged-build stack

Use:

* Electron
* React
* TypeScript
* Vite
* SQLite
* Drizzle ORM
* Python sidecar
* Graphiti
* Hermes Agent
* broker adapters such as Toss and KIS
* OpenRouter / Codex login / Ollama providers

Do not start with Tauri unless there is a strong reason. Electron is acceptable because this project depends heavily on process orchestration, CLI calls, MCP, local servers, logs, and Python sidecars.

Tauri may be considered later if the core is shell-independent.

### 4.3 High-level architecture

```txt
GaemiGuard Desktop
│
├─ Electron + React UI
│
├─ TypeScript Core
│  ├─ Orchestrator
│  ├─ Broker Adapter Contract
│  ├─ Toss Adapter
│  ├─ KIS Adapter Candidate
│  ├─ Manual Portfolio Adapter
│  ├─ Thesis Ledger
│  ├─ Rule Engine
│  ├─ Order Guard
│  ├─ Automation Engine
│  ├─ Community Source Router
│  ├─ Research Memory Normalizer
│  └─ Adapters
│     ├─ Hermes Adapter
│     ├─ MiroFish Adapter
│     ├─ OpenClaw Adapter
│     ├─ OpenBB Adapter
│     └─ Paper Trading MCP Adapter
│
├─ SQLite Local DB
│
├─ Python Sidecar
│  ├─ Graphiti
│  ├─ RDFLib / pySHACL
│  ├─ OpenBB optional
│  └─ MiroFish Runner optional
│
└─ External Tools
   ├─ Broker official APIs
   ├─ Hermes Agent
   ├─ gaemiguard-mirofish
   ├─ OpenClaw
   ├─ OpenBB MCP
   ├─ Ollama
   └─ Codex / OpenRouter / API providers
```

---

## 5. External Tools Strategy

Do not rebuild everything. Use existing open-source tools as much as possible.

### 5.1 Hermes Agent

Hermes is required for research.

Use Hermes for:

* Deep research
* News research
* Community research
* Daily brief generation
* Weekly review
* Long-running investigation
* Structured research output
* Possibly scheduled jobs

GaemiGuard should not implement a full deep research engine.

If Hermes is not installed:

* Research features should be disabled.
* Do not implement a fallback deep research engine.
* Show installation/connect instructions.

### 5.2 MiroFish

MiroFish should be forked or wrapped separately.

Create:

```txt
gaemiguard-mirofish
```

Purpose:

* Investment scenario simulation
* Bull/base/bear case generation
* Market psychology simulation
* Hypothetical scenario generation
* Thesis stress testing

Do not mix MiroFish simulation graph with GaemiGuard’s factual long-term knowledge graph.

MiroFish output must be stored as:

```txt
source: simulation
status: hypothetical
engine: mirofish
```

### 5.3 OpenClaw

Use OpenClaw later as an optional remote chat gateway.

Use it for:

* Telegram / Discord / WhatsApp access
* Read-only questions
* Briefing retrieval
* Research report lookup
* Community mood lookup

Do not allow OpenClaw to:

* Execute orders
* Enable automation
* Access broker tokens
* Export sensitive data
* Modify critical settings

### 5.4 OpenBB

Use OpenBB as an optional financial data layer.

GaemiGuard should not build a full financial data platform. OpenBB can provide:

* Financial data
* Economic indicators
* Global market data
* Fundamental data
* Data tools for Hermes

Prefer using OpenBB through MCP/API or as a Python-sidecar tool.

### 5.5 Graphiti

Use Graphiti or a similar temporal knowledge graph library for investment memory.

GaemiGuard should not build a knowledge graph engine from scratch.

Use Graphiti for:

* Temporal investment memory
* Research episodes
* Source provenance
* Entity/relation extraction
* Thesis impact history
* User-specific investment graph

### 5.6 Ghostfolio / TradeNote

Use these mainly as references or optional import/export targets.

Do not clone them directly.

Use Ghostfolio inspiration for:

* Portfolio allocation UI
* Holdings table
* Asset overview

Use TradeNote inspiration for:

* Trade journal UX
* Trade tagging
* Post-trade review

GaemiGuard’s unique layer is:

* Thesis linkage
* Rule linkage
* Research linkage
* Warning history
* Trade guardrails

### 5.7 Open Paper Trading MCP

Potentially use as a paper trading / mock execution engine.

Use case:

* “I wanted to buy AMD but didn’t. Track this as a paper decision.”
* Review after 7/30 days.
* Compare impulse trades against paper outcomes.

---

## 6. Core Modules to Build

### 6.1 Orchestrator

This is the most important custom module.

Responsibilities:

* Parse user intent
* Build investment context
* Select external tools
* Call Hermes / MiroFish / OpenBB / OpenClaw
* Normalize results
* Connect results to thesis/rules/portfolio
* Create final response
* Enforce policy guardrails
* Write audit logs

The orchestrator should be mostly deterministic:

```txt
Rule-based router: 70%
LLM planner: 30%
```

Do not build an uncontrolled autonomous agent.

### 6.2 Broker Connector

Use official broker APIs through a shared broker adapter contract.

Toss is the current implemented read-only adapter slice. KIS is a future adapter candidate after a source note, capability map, and fixtures exist.

Responsibilities:

* OAuth 2.0 connection
* Token storage in OS keychain
* Account list
* Holdings
* Quotes
* FX
* Buying power
* Sellable quantity
* Fees
* Order creation
* Order modification/cancellation
* Order history

Policy:

* Current Stage 2 implementation mode: read-only
* Manual live order permission: separate Stage 6 opt-in
* Automation: separate Stage 7 opt-in
* External agents must never receive broker tokens

### 6.3 Thesis Ledger

Per stock/instrument, store:

* Why the user bought it
* Buy conditions
* Add-buy conditions
* Sell conditions
* Target weight
* Max weight
* Key risks
* Metrics to check
* Linked research reports
* Linked community signals
* Linked scenario results
* History of thesis changes

### 6.4 Rule Engine

User-defined investment rules.

Examples:

* Single stock max weight
* Sector max weight
* Minimum cash ratio
* FX condition for US stocks
* No buying before earnings
* Thesis memo required before buying
* No averaging down within cooldown
* Max orders per day
* Max automation order amount
* Allowed symbols for automation

Rule result types:

```txt
pass
warning
violation
blocked
```

### 6.5 Order Guard

Used before manual or automated orders.

Responsibilities:

* Create order draft
* Calculate post-order portfolio weight
* Check rules
* Check thesis
* Check recent research
* Check recent scenarios
* Produce trade review card
* Require user approval
* Log warnings and ignored warnings

LLM must never directly execute an order.

### 6.6 Automation Engine

Support automation, but do not market as “AI auto-trading.”

Automation modes:

1. Alert only
2. Generate order draft and require approval
3. Rule-based automatic execution

Default: off.

Auto execution must require:

* Explicit opt-in
* Strategy-level enable
* Max amount
* Allowed symbols
* Kill switch
* Rule engine pass
* Audit log

Automation must be deterministic, not LLM-driven.

### 6.7 Research Memory / Ontology

Do not lose Hermes research output.

Store each research run as:

```txt
raw
structured JSON
markdown
html
embeddings
knowledge graph
audit metadata
```

Recommended directory structure:

```txt
~/.gaemiguard/
  db.sqlite
  vault/
    research/
      2026/
        06/
          04/
            report_amd_daily/
              raw/
              structured/
              markdown/
              html/
              embeddings/
              audit/
```

Storage roles:

```txt
Raw = evidence preservation
JSON = program-readable structured data
Markdown = AI-readable knowledge document
HTML = human-readable report
Embeddings = semantic search
Graph = relation and temporal reasoning
```

---

## 7. Community Research

### 7.1 Important principle

Community research should not be treated as pure noise.

It should be classified into:

```txt
Signal
Sentiment
Meme
Rumor
Noise
```

Definitions:

* Signal: potentially useful investment argument
* Sentiment: crowd emotion such as panic, FOMO, capitulation
* Meme: funny posts, jokes, community culture
* Rumor: unverified claims
* Noise: low-value irrelevant content

Meme/noise can be useful for engagement and market mood but must not be used directly for trading decisions.

### 7.2 Domestic sources

Potential Korean sources:

* DCInside 미국주식 갤러리
* DCInside 코스피 갤러리
* DCInside 해외투자 갤러리
* DCInside 숏포지션 갤러리
* Naver stock discussion boards
* Toss discussion boards, only if official/public access is available
* Fmkorea stock board
* Paxnet
* Thinkpool
* 38 Communication
* User-provided links/text

### 7.3 Overseas sources

Potential overseas sources:

* Reddit r/stocks
* Reddit r/investing
* Reddit r/wallstreetbets
* Reddit r/ValueInvesting
* Reddit r/SecurityAnalysis
* Reddit r/options
* Reddit r/Bogleheads
* Stocktwits
* Seeking Alpha, public content only
* TradingView Ideas
* Yahoo Finance conversations
* Investing.com comments
* User-provided links/text

### 7.4 Community Source Router

Do not scan all sources every time.

Build a community source router.

Examples:

For AMD:

```txt
primary:
- DCInside 미국주식 갤러리
- Reddit r/stocks
- Stocktwits

secondary:
- Reddit r/wallstreetbets
- DCInside 숏포지션 갤러리
- Seeking Alpha public content
```

For Samsung Electronics:

```txt
primary:
- DCInside 코스피 갤러리
- Naver stock discussion board

secondary:
- DCInside 미국주식 갤러리, for global semiconductor mood
- DCInside 숏포지션 갤러리
```

For market panic:

```txt
- 미국주식 갤러리
- 코스피 갤러리
- 숏포지션 갤러리
- r/wallstreetbets
- Stocktwits
```

### 7.5 Community Collector vs Hermes

Hermes should analyze and classify community information, but GaemiGuard may need a small Community Collector.

Collector responsibilities:

* Fetch limited public posts
* Respect rate limits and access policy
* Extract title, URL, timestamp, metadata
* Pass cleaned input to Hermes

Hermes responsibilities:

* Analyze
* Summarize
* Classify into Signal/Sentiment/Meme/Rumor/Noise
* Extract claims
* Identify thesis impact
* Generate structured output

Do not use unofficial internal APIs or bypass login/anti-bot mechanisms.

---

## 8. Ontology / Knowledge Graph

Use existing KG libraries. Do not build from scratch.

Recommended:

* Graphiti for temporal knowledge graph
* RDFLib for RDF/JSON-LD export
* pySHACL for validation
* Optional TypeGraph if TypeScript-first local graph becomes preferable

### 8.1 Main graph vs simulation graph

Separate factual memory from hypothetical simulation.

GaemiGuard KG:

```txt
Persistent
User-specific
Temporal
Factual/observational
Research-backed
```

MiroFish graph:

```txt
Ephemeral
Scenario-specific
Hypothetical
Simulation-based
```

Never mix MiroFish outputs as facts.

### 8.2 Entity types

Initial entity types:

```txt
Stock
Company
Sector
Industry
Theme
MacroIndicator
Currency
Event
Source
Community
CommunityPost
Claim
Evidence
SentimentSignal
Rumor
Meme
Thesis
Rule
Strategy
Report
OrderDraft
Risk
Scenario
```

### 8.3 Relation types

Initial relation types:

```txt
mentions
contains_claim
has_evidence
lacks_evidence
supports_thesis
weakens_thesis
contradicts_thesis
updates_thesis
affected_by
exposed_to
competes_with
belongs_to_sector
indicates_sentiment
indicates_meme
indicates_rumor
violates_rule
triggers_alert
derived_from
```

### 8.4 Research ingestion pipeline

When Hermes returns a research result:

```txt
1. Save raw output
2. Normalize into ResearchReport JSON
3. Save sources
4. Generate AI-readable Markdown
5. Generate human-readable HTML
6. Ingest into Graphiti
7. Extract entities and relations
8. Analyze thesis impact
9. Analyze rule relevance
10. Update embeddings/search index
11. Write audit log
```

---

## 9. Data Formats

### 9.1 ResearchReport

```ts
type ResearchReport = {
  id: string;
  createdAt: string;
  engine: "hermes";
  reportType:
    | "daily_brief"
    | "stock_research"
    | "community_sentiment"
    | "earnings_review"
    | "macro_review"
    | "scenario_context";

  scope: {
    symbols: string[];
    themes: string[];
    markets: ("KR" | "US" | "GLOBAL")[];
    timeWindow: string;
  };

  summary: string;

  keyFindings: {
    title: string;
    detail: string;
    sentiment: "bullish" | "bearish" | "neutral" | "mixed";
    confidence: number;
    relatedEntities: string[];
    sources: string[];
  }[];

  thesisImpact: {
    thesisId: string;
    impact: "supports" | "weakens" | "neutral" | "needs_update";
    reason: string;
    confidence: number;
  }[];

  risks: {
    type:
      | "valuation"
      | "competition"
      | "macro"
      | "regulation"
      | "execution"
      | "community_noise"
      | "unknown";
    description: string;
    severity: "low" | "medium" | "high";
    relatedEntities: string[];
  }[];

  communitySentiment?: {
    sources: string[];
    overall: "bullish" | "bearish" | "neutral" | "mixed";
    keywords: string[];
    noiseLevel: "low" | "medium" | "high";
    rumorFlags: string[];
    memeTags: string[];
    summary: string;
  };

  suggestedQuestions: string[];

  sources: {
    id: string;
    title: string;
    url?: string;
    publisher?: string;
    publishedAt?: string;
    accessedAt: string;
    reliability: "official" | "news" | "community" | "unknown";
  }[];
};
```

### 9.2 CommunityPostClassification

```ts
type CommunityPostClassification = {
  id: string;
  sourceId: string;
  url?: string;
  title?: string;
  summary: string;
  category: "signal" | "sentiment" | "meme" | "rumor" | "noise";
  investmentRelevance: number;
  humorScore?: number;
  sentiment?: "panic" | "fomo" | "greed" | "capitulation" | "mockery" | "neutral";
  memeTags?: string[];
  claims?: {
    claim: string;
    evidence?: string;
    confidence: number;
  }[];
  useForTrading: boolean;
};
```

For memes/noise:

```txt
useForTrading must be false.
```

### 9.3 ScenarioResult

```ts
type ScenarioResult = {
  id: string;
  engine: "mirofish";
  status: "hypothetical";
  symbol: string;
  scenarioType:
    | "trade_decision"
    | "buy_more"
    | "sell_review"
    | "earnings_event"
    | "macro_shock"
    | "community_sentiment_shift";

  bullCase: string[];
  baseCase: string[];
  bearCase: string[];
  keyVariables: string[];
  thesisConflicts: string[];
  ruleConflicts: {
    ruleId: string;
    severity: "low" | "medium" | "high";
    reason: string;
  }[];
  uncertainty: "low" | "medium" | "high";
  finalGuardrail: string;
};
```

---

## 10. UI Areas

### 10.1 Home

Show:

* Today’s briefing
* Portfolio summary
* Rule violations
* Research tasks
* Community mood
* Upcoming automation
* Warnings

### 10.2 Agent Chat

Primary interaction surface.

User talks to GaemiGuard.

The orchestrator handles:

* Research
* Trade review
* Thesis lookup
* Scenario requests
* Automation settings
* Community mood
* Portfolio review

### 10.3 Portfolio

Broker-connected or manual portfolio view.

Show:

* Holdings
* Weights
* KR/US allocation
* USD/KRW exposure
* Rule violations
* Concentration risk

### 10.4 Thesis Ledger

Per stock thesis management.

Show:

* Current thesis
* Buy/add/sell conditions
* Risks
* Linked research
* Linked scenarios
* Thesis drift history

### 10.5 Rules & Automation

Show:

* Rules
* Strategy templates
* Automation modes
* Order guard
* Kill switch
* Audit logs

### 10.6 Research

Hermes-powered research reports.

Show:

* Stock research
* Daily briefs
* Community research
* Macro reviews
* Saved reports
* Sources
* Thesis impact

### 10.7 Community

Separate modes:

```txt
Signal
Sentiment
Meme
Rumor
```

Meme area is allowed and should be fun, but clearly marked as not for trading.

Example:

```txt
오늘의 미주갤 온도
- 공포: 72
- 조롱: 63
- 체념: 55
- 광기: 81
```

### 10.8 Scenario Lab

MiroFish-powered.

Show:

* Bull/base/bear cases
* Key variables
* Hypothetical scenarios
* Rule conflicts
* Thesis stress tests

---

## 11. Setup UX

Installation must be simple.

User should not feel like they are assembling five tools manually.

### First-run wizard

Steps:

1. Choose AI provider

   * Codex login recommended
   * OpenRouter
   * Ollama
   * API keys

2. Connect broker or skip

   * Toss adapter when available
   * KIS adapter when implemented
   * no-broker/manual portfolio mode
   * current Stage 2 implementation is broker read-only

3. Connect Hermes

   * required for research
   * detect installation
   * install/connect guide

4. Choose investment style template

   * US big tech investor
   * Korean semiconductor investor
   * ETF DCA investor
   * dividend investor
   * swing trader

5. Add watchlist

6. Create first thesis/rules

MiroFish/OpenClaw can be configured later.

### Component manager

Have a settings area:

```txt
Hermes Agent: installed / connected / update available
MiroFish Runner: not installed / connected
OpenClaw: not installed / connected
OpenBB: optional
Ollama: detected / not detected
Codex: logged in / not logged in
```

---

## 12. Security Rules

Critical:

* Never pass broker tokens to Hermes, MiroFish, OpenClaw, or OpenBB.
* External agents only receive sanitized context.
* Order execution only happens inside GaemiGuard policy layer.
* Remote chat must be read-only by default.
* Automation is off by default.
* Auto execution requires explicit opt-in.
* Every order-related action must be logged.
* There must be a global kill switch.
* API credentials must be stored in OS keychain or encrypted vault.

---

## 13. Staged Build Scope

### Stage 1 Foundation

Build:

* Electron desktop app
* React UI
* Local Fastify API
* SQLite schema
* Markdown/JSON artifact storage
* Commander Agent chat panel
* Portfolio/Research/Scenario/Order Guard specialist stubs
* Permission engine with live-order hard block
* Order Guard dry-run artifact
* Healthcheck surface

Do not build:

* Live order submission
* Live automatic trading
* Full crawler
* Full deep research engine
* Real MiroFish execution
* OpenClaw integration
* Full ontology UI
* Cloud service

### Stage 2 Broker Connection Foundation

Build:

* Broker adapter contract
* Current Toss read-only adapter
* No-broker/manual portfolio mode
* Credential setup and disconnect flow
* Safe broker snapshot freshness

### Stage 3 Research Memory

Build:

* Research report storage
* Thesis ledger
* Rule engine
* Watchlist
* Markdown/JSON report generation
* Optional Graphiti memory ingestion
* Research ontology extraction
* Daily brief with Hermes
* Basic price alert

### Stage 4 Scenario Lab

Build:

* GaemiGuard MiroFish fork/runner
* Scenario Lab
* Scenario result storage
* Thesis stress testing

### Stage 5 Order Guard and Paper Trading

Build:

* Order Guard
* Order preview
* Order draft
* Paper trading
* Audit log

### Stage 6 Guarded Manual Live Orders

Build:

* Manual approval-based order execution
* Broker capability checks
* Idempotency key handling
* Kill switch
* Audit log

### Stage 7 Guarded Automation

Build:

* Rule-based automation
* DCA automation
* Kill switch
* Automation opt-in and limits

---

## 14. Implementation Priority

Start with this order:

1. Workspace and Electron app shell
2. Local API
3. SQLite schema
4. Artifact writer
5. Commander Agent runtime
6. Permission engine
7. Order Guard dry-run
8. Agent chat UI
9. Thesis CRUD
10. Rule CRUD
11. Hermes adapter
12. ResearchReport storage
13. Broker adapter contract and current Toss read-only adapter
14. Graphiti sidecar
15. MiroFish runner

Do not start with auto-trading or a complex crawler.

---

## 15. Core Principle for Codex

When implementing, follow this rule:

> Do not rebuild existing open-source engines.
> Build GaemiGuard’s orchestration, context, memory, rule, and UX layer.

External tools should be used through:

* CLI
* HTTP API
* MCP
* WebSocket
* File-based input/output

Avoid closed-service scraping, GUI automation, and web-internal APIs.

---

## 16. One-Sentence Definition

GaemiGuard is a local-first personal investment agent that connects broker adapters, Hermes research, MiroFish scenarios, optional OpenClaw remote chat, optional OpenBB data, and local memory to help Korean retail investors manage thesis, rules, evidence, trade reviews, manual trading, and later rule-based automation.
