# Handoff Specs

Updated: 2026-06-06

Use this directory for long development goals. Do not put very large specs directly into the `/goal` prompt. The `/goal` prompt should stay short and point at the handoff document.

## When To Use

- The goal would exceed about 4,000 characters.
- The task has many safety constraints.
- Completion criteria need detailed wording.
- Multiple sessions or agents need the same source of truth.

## Template

```markdown
# <Work Name>

## Goal

## Context

## First Read

## Do Not

## Implementation Scope

## Verification

## Completion Criteria
```

## Rules

- The handoff document is the detailed contract; the `/goal` prompt is only the launcher.
- After the work is complete, update `docs/development-status.md`.
- Also update the active stage document when completed work or remaining gaps change.
- After documentation changes, run `pnpm docs:agent-check` and `pnpm docs:html`.
