# Development Workflow

1. Read `AGENTS.md` and `docs/development-status.md`.
2. Run `devflow doctor --json` and `devflow status --json` before command-heavy work.
3. Keep work scoped to the active stage gate and the user's goal.
4. Before finishing, run the relevant gates from `.devflow/config.json`.
5. When Devflow review evidence is required, run `devflow review request --work <id>`, then record the result with `devflow review record --work <id>`.
6. Record completed work with `devflow finish` and include changed files, gates, risks, review evidence, and the next-session prompt.
7. Write next-session prompts in the user's `/goal` format with `CWD`, `Goal`, context, constraints, verification, and completion criteria.
