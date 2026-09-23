# Standalone Finance first slice

The web app is built from the **existing** `FinanceWorkspace` React component.
Its shell and Twenty data client are replaced by a small navigation wrapper and
Pages Functions API. The current Accounts and Transactions screens read from
the Worker; existing Statements and Follow-ups screens remain visible but have
no standalone writer yet. The synthetic preview stays an explicit button.

## Local source checks

From the repository root:

```sh
npm run finance:install
npm run finance:standalone:typecheck
npm run finance:standalone:build
node --test standalone/test/*.test.js
```

The Pages build output is `standalone/dist`; Functions live in
`standalone/functions`. A static file server can show the React layout, but
the API requires the Pages Functions runtime with configured bindings. Static
preview intentionally reports that the Finance API is unavailable.

## Required bindings and secrets

For an isolated, Access-protected **sandbox** Pages project, bind a new D1
database as `DB` and a new private R2 bucket as `EVIDENCE`. Apply
`schema.sql` only to that new D1 database. Configure `DEPLOYMENT_ENV=staging`,
`ACCESS_TEAM_DOMAIN`, and `ACCESS_AUD` for the exact protected Pages site.
Set `PLAID_ENV=sandbox`, `PLAID_CLIENT_ID`, `PLAID_SECRET`, and a randomly
generated 32-byte hex `PLAID_TOKEN_KEY` as server-side configuration or secrets
as appropriate. Never commit their values. Cloudflare Access must also guard
the Pages assets, not only `/api/*`; the Function independently verifies the
Access assertion for each API call.

Do not bind the MHO-231 synthetic D1/R2 resources. Do not use live Plaid
credentials or client data for a local preview. Provider scope and rollout
remain separate owner decisions. See [Plaid source notes](../docs/plaid-connector.md)
for the precise first-slice behavior and remaining gates.
