# Testing Strategy

Record every verification gate that proves a work item is ready.

## Initial Gate

- `pnpm docs:agent-check`
- `pnpm docs:html`
- `pnpm verify`

GitHub CI also runs these gates on PRs and main pushes. The workflow keeps token permissions read-only, cancels older runs for the same branch, and uses pnpm caching.

For user-visible desktop UI workflow changes, also run:

- `pnpm smoke:desktop`
