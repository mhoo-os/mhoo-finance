# Mhoo Finance repository

This repository owns the canonical `@mhoo/finance` Twenty App under
`apps/mhoo-finance`, the preserved synthetic Finance Investigation Workspace,
and its protected MHO-231 Cloudflare staging contract. Start with
`docs/finance-app-migration.md`. Keep every committed fixture synthetic: never
add provider credentials, OAuth secrets, real Plaid/Clover/client data,
production deployment steps or production resource identifiers.

The evidence contract is append-safe: raw fixture bytes are preserved in the R2-compatible binding, SHA-256 receipts are stored in D1, and normalized rows always retain an exact artifact key and row pointer. Do not change the fixtures without updating their focused tests.

Run `npm test`, `npm run coverage`, `npm run check`, and `npm run deploy:check` before opening a pull request. `npm start` seeds and serves the local in-memory synthetic workspace. Only an explicitly authorized `--env staging` operation may change Cloudflare resources; never deploy the root configuration.

For changes under `apps/mhoo-finance`, also run `npm run finance:fixtures`,
`npm run finance:test`, `npm run finance:lint`, and `npm run finance:typecheck`.
The App remains a Twenty App and uses pinned public Twenty SDK packages. Host
installation, consumer switching, provider access and deployment require their
own reviewed changes and evidence.
