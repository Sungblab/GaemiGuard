# Third-Party Notices

Generated: 2026-06-04

GaemiGuard is licensed as AGPL-3.0-only. External tools, APIs, documents, and trademarks keep their own licenses and terms.

## Vendored Or Referenced Material

| Component | Location or reference | Usage | Boundary |
| --- | --- | --- | --- |
| Toss Invest Open API | `vendor/tossinvest/openapi-1.0.3.json`, `docs/toss-invest-openapi.md` | Official API schema/reference for connector development | API/document reference |
| MiroFish | `external/mirofish-*` local ignored folders, `docs/mirofish-sidecar-porting.md` | Optional scenario sidecar | Out-of-process sidecar |
| Hermes | design docs only | Optional research engine | Adapter/sidecar |
| OpenBB | design docs only | Optional market/research data source | Adapter/sidecar |
| Graphiti/temporal memory | design docs only | Optional memory implementation | Adapter |
| Codex CLI | design docs only | Optional provider/tool adapter | Provider adapter |

## Boundary Rules

- Do not copy third-party source into this repository unless its license is reviewed and recorded here.
- Keep optional engines installable as managed components or sidecars.
- Keep API keys, tokens, account identifiers, and credentials outside source control.
- Keep unofficial or experimental adapters disabled by default.
- Do not use closed-service scraping, GUI automation, or web-internal APIs as the production default.

## License Review Gate

Before adding a dependency that is GPL, AGPL, SSPL, BUSL, source-available, or unclear:

1. Record the dependency and license here.
2. Decide whether it is a library dependency, process-bound sidecar, optional adapter, or documentation-only reference.
3. Update README if setup behavior changes.
4. Add tests or health checks if the dependency affects runtime behavior.
