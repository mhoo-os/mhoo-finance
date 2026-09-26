# Plaid connector source notes

Checked against Plaid's official documentation on 2026-09-23. These notes describe
the connector contract for the standalone Finance app. They are not a copy of
Plaid's documentation and do not establish a live bank connection.

## Authoritative references

| Topic | Official source | Implementation consequence |
| --- | --- | --- |
| Link Web SDK | [Link for web](https://plaid.com/docs/link/web/) | Load the SDK from `cdn.plaid.com`; create a fresh server-issued Link token per session; exchange the public token on the server. |
| Link token | [Link API](https://plaid.com/docs/api/link/) | Request only `transactions` for the first connection, with an opaque `client_user_id` and an explicit 90-day history request. The client secret never reaches the browser. |
| Exchange and Item lifecycle | [Items API](https://plaid.com/docs/api/items/) | Exchange `/item/public_token/exchange` on the server; keep the returned access token encrypted; use `/item/get` for institution identity and `/item/remove` on disconnect. |
| Account scope | [Accounts API](https://plaid.com/docs/api/accounts/) | `/accounts/get` returns active linked accounts. A missing account is not proof that an old or closed account had no history. |
| Incremental transactions | [Transactions API](https://plaid.com/docs/api/products/transactions/) | Use `/transactions/sync` with `added`, `modified`, `removed`, `next_cursor` and `has_more`. It supports depository, credit and some loans, not investment transactions. Historical availability is at most 24 months and varies by institution. |
| Pagination and initial call | [Transactions Sync migration guide](https://plaid.com/docs/transactions/sync-migration/) | Fetch the full paginated update before committing any changes or cursor. Restart from the first cursor if pagination mutates. Make an initial sync call; a webhook alone does not initialize Sync. |
| Update notifications | [Transactions webhooks](https://plaid.com/docs/transactions/webhooks/) | `SYNC_UPDATES_AVAILABLE` is the relevant event after the initial sync. It signals that the cursor should be read; it does not itself carry the transaction changes. |
| Webhook authenticity | [Webhook verification](https://plaid.com/docs/api/webhooks/webhook-verification/) | A future receiver must verify the `Plaid-Verification` ES256 JWT, fetch its JWK by `kid`, check the five-minute age, and compare `request_body_sha256` to the exact raw body. Do not expose an unauthenticated webhook route before this exists. |
| OAuth return | [Link OAuth guide](https://plaid.com/docs/link/oauth/) | A registered redirect URI and Link reinitialization are needed for the strongest mobile webview coverage. This first slice has no redirect flow yet. |

## Repository mapping

- The existing React screens and Finance contracts remain in
  `apps/mhoo-finance/src`. The standalone entry point is
  `apps/mhoo-finance/standalone-web`; it renders `FinanceWorkspace` with a
  Worker-backed read adapter.
- One Worker serves the page and its API from the same origin under
  `mhoo.dev/00/finance`. `standalone/worker/app.js` applies the Mhoo app
  contract (routing, shared Access, allow-list, Shell manifest);
  `standalone/worker/index.js` owns Plaid requests, encrypted tokens, bounded
  sync and evidence custody.
- `standalone/migrations/0001_init.sql` defines a new D1 store. The MHO-231 synthetic D1 and
  R2 bindings are separate and must not be reused for client data.
- R2 keeps the exact Plaid JSON response bytes under a SHA-256 key. D1 records
  the pointer and hash, with transaction revisions and an excluded current view.
  Amounts use signed integer minor-unit strings: Plaid's positive outflow maps
  to negative Finance amount.

## Current first slice and remaining gates

The source implements Link token creation, server exchange, `/accounts/get`,
manual bounded Sync, read-only Finance screens, and disconnect. A single Sync
attempt accepts at most five pages of 100 changes. It commits all pages and the
cursor in one D1 batch; larger updates fail without moving the cursor and need
a separately reviewed background recovery path. All Plaid rows start
`UNCLASSIFIED` and excluded from totals. This is not statement completeness.

Before a live connection, the owner must configure a new D1 database and
private R2 bucket, confirm the Worker's `ALLOWED_EMAILS`, and set the Plaid
environment secrets. Sign-in already comes from the shared `mhoo.dev/00` Access app. Verify the expected Cloudflare account,
Plaid account, domain and allowed people. Sandbox Link, OAuth return, webhook
verification and delivery, reauthentication, full pagination recovery, source
overlap, and the standalone statement/follow-up writes need focused proof.
No production provider connection or deployment is authorized by this note.
