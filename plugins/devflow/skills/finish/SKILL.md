---
name: devflow-finish
description: Finish work with review, gate evidence, risks, and a next-session prompt.
---

# Devflow Finish

Run or record relevant gates, evaluate review findings as evidence, and call `devflow finish`.
If review is required, run `devflow review request --work <id> --target <codex|claude-code|reviewer> --persona strict-reviewer`, hand the prompt to the reviewer, then record the outcome with `devflow review record --work <id> --reviewer <name> --status <passed|changes-requested> --summary <text>`.
If `devflow finish` returns `review.nextAction.command` or `review.nextAction.recordCommand`, follow both commands before claiming completion.
