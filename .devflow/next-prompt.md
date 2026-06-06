/goal CWD: C:\Users\Sungbin\Documents\GitHub\GaemiGuard

Goal:
Start Stage 3 Research And Memory with a narrow source-grounded thesis/rule/journal persistence slice that builds on the accepted Stage 2 broker/manual snapshot boundaries.

Context:
- Stage 1 Foundation Runtime is complete.
- Stage 2 Broker Connection Foundation is complete and exited.
- Toss read-only production sync, freshness/source metadata, no-broker/manual portfolio, and Commander production snapshot grounding are implemented.
- Stage 3 should make Commander useful for research, thesis, rules, journals, recall, and reports without exposing credentials or raw broker identifiers.

First read:
- AGENTS.md
- docs/agent-index.md
- docs/development-status.md
- docs/product/agent-first-direction.md
- docs/product/broker-connection-and-trading.md
- docs/stages/stage-3-research-memory.md
- docs/architecture/agent-runtime.md
- docs/architecture/maps/README.md
- docs/testing/strategy.md
- docs/contributing/workflow.md

Do not:
- Do not implement Toss/KIS order mutation, live trading, paper trading, or automation.
- Do not add KIS implementation before a KIS source note and capability map.
- Do not store or expose raw secrets, tokens, account numbers, account sequence values, order IDs, or personal identifiers.
- Do not send broker-private data to external agents or sidecars.

Implementation scope:
1. Inspect current Stage 3 gate and code paths.
2. Design the smallest thesis/rule/journal data contract with source/freshness references.
3. Add tests first for persistence, Commander context assembly, redaction, and stale-source behavior.
4. Implement only the first local persistence/API/Commander slice needed to answer a source-grounded memory question.
5. Update docs and regenerate docs HTML.

Verification:
- pnpm docs:agent-check
- pnpm docs:html
- pnpm verify
- pnpm smoke:desktop if the desktop workflow changes

Completion criteria:
- Stage 3 first slice is implemented behind local-only persistence and source/freshness references.
- Commander can cite saved thesis/rule/journal context without treating stale broker data as fresh.
- Security/redaction tests cover external-agent context boundaries.
- Changes are committed, opened as a PR, CI passes, and the PR is merged to main with main CI verified.
