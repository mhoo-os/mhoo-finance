# Finance App migration record

## Decision and scope

Accepted ADR-0015 selects `mhoo-os/finance-investigation-workspace` as the
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
| Destination repository | `mhoo-os/finance-investigation-workspace` |
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

## Standalone Finance continuation checkpoint — 2026-09-23

The owner requested a standalone Cloudflare Pages/Workers, D1 and R2 Finance
app with the existing React Finance screen and a first Plaid bank/card
connector. No Linear issue is assigned to this new result yet. This work starts
from migration PR #4 head `ba8cf9854cf7654ef399dd54f5ebc6c72e93e9a7` on
`codex/finance-standalone-plaid` in
`/Users/mhoooo/.codex/worktrees/finance-standalone-plaid/finance-investigation-workspace`.
The implementation-owning repository remains `mhoo-os/finance-investigation-workspace`.
The coordinating checkout remains the `codex/finance-app-migration` head at that
same source commit; PR #4 is open with successful CI on its own head.

The original migration's source worktrees remain owned and dirty in
`mhoo-twenty-next`: `codex/finance-approved-insights` for MHO-7 UI/Clover work
and `codex/finance-chase-pdf-controls` for MHO-228 bank/card imports. Their
Delivery Room missions remain in review/active status. No custody transfer was
acknowledged, so neither worktree was removed or copied into this first slice.
The unmerged local investigation-methods commit `7e3af2e` remains in review.
Local `codex/finance-setup-docs` and `codex/mho231-reconcile` refs were removed
after verifying their respective PRs #3 and #2 were merged; no remote branch
or worktree was deleted.

The first standalone slice and official Plaid source links are recorded in
[`standalone/README.md`](../standalone/README.md) and
[`docs/plaid-connector.md`](plaid-connector.md). Local checks on the candidate
branch: immutable Yarn install, 310 Finance tests, Finance lint and native
typecheck, 54 root tests, 100% line/99.09% branch/100% function coverage,
syntax checks, legacy staging packaging dry run, standalone Vite build and
typecheck, four focused Plaid tests, and local Pages Functions compilation.
The local Pages API returned 503 without Access configuration as intended.
Desktop visual inspection showed the reused React Accounts screen and explicit
synthetic preview. These checks do not prove a live Plaid Item or deployment.

Delivery Room mission registration for `finance-standalone-plaid-20260923`
returned `MISSION_EDIT_SESSION_REQUIRED` on 2026-09-23. This is the pending
registration update; do not create a duplicate job on retry. Remaining gates:
reviewed Pages/D1/R2 and Access ownership, Plaid Sandbox account and secrets,
OAuth and webhook support, bounded-sync recovery beyond five pages, the
statement/follow-up standalone writer, live browser proof and owner approval
before any provider or deployment action.

## App contract checkpoint — 2026-09-25

The standalone slice now follows the Mhoo app contract (`mhoo-shell/APP-CONTRACT.md`,
mhoo-shell PR #16). Pages Functions were replaced by one Worker, `mhoo-finance`,
with static assets at `mhoo.dev/00/finance/`. It verifies the shared `/00`
Access token for pages and API alike, requires `ALLOWED_EMAILS`, and publishes
`/.well-known/mhoo-app.json` for Shell. `schema.sql` became
`standalone/migrations/0001_init.sql`; the API handler is unchanged. This
supersedes the "Pages/D1/R2 and Access ownership" gate above: sign-in is the
existing shared Access app, and the remaining setup is a new D1 database, a new
private R2 bucket and the Plaid Sandbox secrets. The other gates stand.
