# Standalone Finance

The standalone app is one Cloudflare Worker, `mhoo-finance`, served at
`mhoo.dev/00/finance/`. It follows the Mhoo app contract (`mhoo-shell/APP-CONTRACT.md`):
it runs on its own and installs into Shell through `/.well-known/mhoo-app.json`.

The web app is built from the **existing** `FinanceWorkspace` React component.
Its shell and Twenty data client are replaced by a small navigation wrapper and
the Worker API. The Accounts and Transactions screens read from the Worker; the
Statements and Follow-ups screens stay visible but have no standalone writer yet.

## Layout

| Path | Purpose |
| --- | --- |
| `worker/entry.js` | Worker entry (handlers only) |
| `worker/app.js` | Contract layer: manifest, `/00/finance` routing, allow-list, static pages |
| `worker/index.js` | Finance API: Plaid Link, exchange, bounded sync, read model, disconnect |
| `migrations/` | D1 schema, applied with `wrangler d1 migrations apply` |
| `dist/00/finance/` | Vite build output, served as Worker static assets |

## Local checks

From the repository root:

```sh
npm run finance:install
npm run finance:standalone:typecheck
npm run finance:standalone:build
npm test                       # includes standalone/test
npm run standalone:deploy:dry  # bundles the Worker without deploying
```

`npm run standalone:dev` builds the pages, applies migrations to a local D1 and
starts `wrangler dev`. Without a Cloudflare Access token every page and API
returns 401 by design; there is no local sign-in bypass.

## Sign-in and configuration

Sign-in comes from the shared "Mhoo /00 Shared Workspace" Access app that covers
`mhoo.dev/00/*`. The Worker verifies that token itself, for pages and API alike,
because requests forwarded by Shell skip the edge, and then requires the email to
be in `ALLOWED_EMAILS`. Service tokens are not accepted yet.

Before a first deploy, create a **new** D1 database and a **new** private R2
bucket and put their names/id in `standalone/wrangler.jsonc`. Never bind the
MHO-231 synthetic resources. Set the secrets with `wrangler secret put`:
`PLAID_CLIENT_ID`, `PLAID_SECRET` and `PLAID_TOKEN_KEY` (32-byte hex). Keep
`PLAID_ENV=sandbox` and `DEPLOYMENT_ENV=staging` until the owner approves live
banks. Provider scope and rollout remain separate owner decisions; see
[Plaid source notes](../docs/plaid-connector.md).
