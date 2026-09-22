# @mhoo/finance

For the current Hass product scope, capability/gap map and acceptance contract,
start with [HASS_FINANCE_PRODUCT_DEFINITION.md](HASS_FINANCE_PRODUCT_DEFINITION.md).
The private welcome-guide handoff copy is in
[HASS_WELCOME_GUIDE_COPY.md](HASS_WELCOME_GUIDE_COPY.md).
The research-to-code evidence map and explicit remaining professional-method
gaps are in
[PROFESSIONAL_METHOD_ACCEPTANCE.md](PROFESSIONAL_METHOD_ACCEPTANCE.md).

`@mhoo/finance` is the native Twenty Finance workspace for permission-aware
accounts, transactions, statements and bounded evidence review. Its installed
screens read current Workspace records. The deterministic synthetic pack is an
explicit local test/preview source only. The App remains provider-credential-free.

## Current boundary

- Canonical source: `mhoo-os/finance-investigation-workspace`, under
  `apps/mhoo-finance`
- Extracted source: `mhoo-os/mhoo-twenty-next` commit
  `29436a21fc23f7f8119e80c4ea4014439dc31117`; see the repository
  [migration record](../../docs/finance-app-migration.md)
- Port seed: `mhoo-os/mhoo-twenty` PR #45 at
  `6bef8da9004ea67607315422454a6aa52a65dfd3`
- Committed data: deterministic synthetic fixtures only; no customer records
  or credentials are stored in Git
- Installed UI data source: current-Workspace Finance objects through Twenty's
  generated client; no demo fallback
- Mutation: append-only evidence-link decision events and receipt-verified
  Finance review-state/email-approval updates on native Twenty Tasks through
  the user-scoped REST client; source records and classifications are not mutated
- Provider calls, new OAuth grants, live imports and deployment remain separate
  gates

## What the fixture pack proves

`yarn fixtures:generate` materializes a deterministic fixture pack containing
bank, card, Toast, and Clover-shaped _synthetic_ periods; duplicate artifacts
and rows; a correction revision; pending-to-posted activity; a refund, void,
discount, transfer, card payment, missing period, zero-activity period, stale
source, resolved control total, and open reconciliation exception.

Native Finance navigation opens Overview, Accounts, Transactions, Statements
and Follow-ups as single-tab designed surfaces. Follow-ups extend native Twenty
Tasks with validated Finance context; they are not a parallel task system.
Components inherit Twenty's `--t-*` theme
tokens and expose loading, empty, denied, failed and bounded-result states. An
isolated synthetic preview exercises direction, multi-year selection and
evidence review without becoming a real-Workspace fallback. No screen makes an
assurance, fraud or tax conclusion.

Follow-up lists stay concise: question, state, owner and next action. Evidence,
People and approval-first email previews open progressively on a full detail
surface. No send action, contact invitation, membership grant, mailbox scope or
provider call is implemented. `Approved, not sent`, reply receipt, Task Done and
financial reconciliation remain separate states.

## Focused checks

The installed five-page browser and visual suite remains a host integration
check in `mhoo-twenty-next/twenty-e2e-testing/tests/mhoo-finance`. It is not
copied into this package because it exercises the Twenty host rather than the
portable App source.

```text
yarn install --immutable
yarn fixtures:generate
yarn test:unit
yarn lint
yarn typecheck
```

The local fixture preview is development evidence only. A single source-level
fixture adapter maps generated packs, native-object-shaped records, and
dashboard selection. Its explicit synthetic Workspace/role gate fails closed
for a missing role or another Workspace, but it is not runtime UI proof:
Workspace installation, server role and cross-workspace enforcement, and
client-visible proof remain separate Phase B gates. Real source adapters must
later write through these same objects and lineage contracts; no dashboard-only
authority is allowed.

See [PORTING.md](./PORTING.md) for the exact carry-forward/discard matrix.

See [BENCHMARK.md](./BENCHMARK.md) for bounded six-year synthetic population
generation. It prepares raw inputs at twice a hypothetical count; actual source
counts, native performance/recovery evidence and a storage verdict remain open.

## Shared logical contracts

See [Finance contract v1](src/contracts/README.md) for exact money, dataset
manifests, immutable observation/snapshot identities and synthetic golden proof
(MHO-257). These source contracts do not install or migrate native records.

## Governed statement-import source slice

MHO-126 adds deterministic QFX/OFX and a documented **synthetic-only** CSV
profile, immutable byte receipts, row lineage, correction revisions, bounded
hash-bound checkpoints, and native-record projection through this App’s merged
object vocabulary. See [INGESTION.md](./INGESTION.md) for supported semantics,
fixture commands, and the remaining real-source acceptance gaps.

## Client workspace preparation

See [PREPARATION.md](PREPARATION.md) for the native account model, exact-money
projection and bounded Plaid export validation function. Current-Workspace reads
are implemented; installation, durable provider import and hosted acceptance
remain separate.
