# Finance App migration record

## Decision and scope

Accepted ADR-0015 selects `mhoo-os/mhoo-finance` as the
dedicated Finance product repository. This migration extracts the native
`@mhoo/finance` Twenty App while keeping the existing MHO-229 synthetic
prototype and MHO-231 staging contract as separate, bounded legacy components.

This change moves source ownership. It does not install or deploy the App,
change a Twenty Workspace, import real data, grant provider access, or delete
the transitional source copy.

## Exact provenance

| Field | Value |
| --- | --- |
| Source repository | `mhoo-os/mhoo-twenty-next` |
| Source branch | local `codex/finance-approved-insights` |
| Source commit | `29436a21fc23f7f8119e80c4ea4014439dc31117` |
| Source path | `packages/twenty-apps/internal/mhoo-finance` |
| Destination repository | `mhoo-os/mhoo-finance` |
| Destination path | `apps/mhoo-finance` |
| Extraction method | Exact Git tree archive of the source path |
| Package identity | `@mhoo/finance` version `0.1.0`, private, `UNLICENSED` |
| Twenty compatibility | Twenty `2.37.0`, Node `^24.5.0`, Yarn `4.13.0` |

The source commit is the latest clean committed head of the reviewed insights
line at extraction time. It includes the accepted five-surface Finance UI,
question and evidence review, follow-up workflow, deterministic synthetic
fixtures, source contracts and focused tests.

Two destination adaptations make the extracted subtree independently runnable:

- the package declares ESM explicitly because it no longer inherits the Twenty
  monorepo root module setting;
- the exact `packages/twenty-apps/.oxlintrc.base.json` restricted-import rule is
  retained at the destination root so the package lint configuration resolves;
- `monaco-editor` `0.52.2`, the version used by the Twenty 2.37 host, is declared
  directly to satisfy `twenty-ui`'s portable peer dependency;
- the Workspace GraphQL response receives a local read-only result contract so
  strict standalone typechecking does not depend on monorepo-generated inference.

The root prototype test command is scoped to `test/*.test.js` so Node's default
test discovery does not treat the nested Vitest TypeScript suite as root tests.

## Preserved work outside the extraction

Two dirty worktrees existed at migration time and remain untouched:

- `codex/finance-approved-insights` contained uncommitted Clover read and UI
  integration changes.
- `codex/finance-chase-pdf-controls` contained uncommitted Chase PDF/XLSX import
  and control changes.

Those changes are not represented as migrated or accepted. Their existing
owners must reconcile them onto this repository in separate, reviewed commits.
The transitional source subtree must remain available until that reconciliation
and the consumer switch are complete.

## Portability boundary

The App depends on the published `twenty-sdk`, `twenty-client-sdk` and
`twenty-ui` packages pinned in its manifest. App objects, views, navigation,
logic functions, components, tests and fixtures move together. Host integration
tests stay with the Twenty distribution because they exercise installation,
authentication, Remote DOM and Workspace behavior.

## Validation and cutover

The destination package is ready for review when these commands pass:

```sh
npm run finance:install
npm run finance:fixtures
npm run finance:test
npm run finance:lint
npm run finance:typecheck
npm test
npm run coverage
npm run check
npm run deploy:check
```

Cutover still requires a separate host change that consumes this repository's
package or build artifact, repeats the installed browser acceptance checks, and
records rollback evidence. Only after that change is accepted may the old
`mhoo-twenty-next` subtree be removed. Active dirty worktrees must be reconciled
or explicitly retired by their owners before removal.

## Extraction validation receipt

- Observed at: `2026-09-22T04:56:05Z`
- Source commit: `29436a21fc23f7f8119e80c4ea4014439dc31117`
- Source subtree: `14c86d1d92dbd78687608e457d1e61aec423f0ca`
- Environment: local macOS checkout, Node `24.16.0`, Yarn `4.13.0`
- Package manifest SHA-256: `3d3ad2be9496f19bd17da7c287adaa2ca5c9cf31d20aee7dbb5445b2779d54f8`
- Package lock SHA-256: `1226b7bcb3c16886c2cf9cb422efc227051438605843229cd6ff4ad50959310d`
- Result: `npm ci`, immutable Finance install, fixture generation, 310 Finance
  unit tests, Finance lint, Finance build/typecheck, 54 prototype tests, 95%
  coverage gates, syntax checks and the Wrangler staging dry run all passed.
- Proved scope: extracted source installs and validates independently while the
  root synthetic prototype remains intact. The dry run changed no Cloudflare
  resource.
- Remaining gaps: host consumer switch, installed allowed/denied browser proof,
  reconciliation of the two retained dirty source worktrees, and eventual
  transitional source removal remain separate owner-reviewed work.
- Delivery Room: new mission registration was attempted and returned
  `DELIVERY_ROOM_REQUEST_UNCONFIRMED`; this migration record is the retained
  pending checkpoint for later reconciliation.
