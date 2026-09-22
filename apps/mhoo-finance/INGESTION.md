# Governed statement-import source contract

This source-only implementation reuses the merged `SourceArtifact`,
`ImportReceipt`, and `FinanceFact` object vocabulary. It does not create a
parallel ledger, store evidence outside those records, or install a workspace.

## Supported deterministic inputs

- QFX and OFX use a strict bank-statement subset: one account per artifact,
  exactly one `ACCTID` bound to an expected account-key/SHA-256 identifier,
  unique `FITID`, `DTPOSTED`, signed `TRNAMT`, `NAME`, and statement period
  controls. `DTUSER`, when present, is retained as transaction date; `DTPOSTED`
  remains posting date. The amount sign, not `TRNTYPE`, determines normalized
  direction. `CORRECTFITID` and `CORRECTACTION` are rejected visibly until a
  separately versioned correction contract exists.
- The versioned `statement-summary-controls-v1` captures a supplied source
  control and, when QFX/OFX provides all four supported tags, its parsed
  observation: `DEPANDCREDIT`, `CHKANDDEB`, `TOTALFEES`, and `TOTALINT`.
  `DEPANDCREDIT` includes interest and `CHKANDDEB` includes fees, so totals are
  compared individually and never double-counted. Account-bound adjacent
  periods compare a prior closing balance only to the next calendar day's
  opening balance; cross-account and non-adjacent comparisons are rejected.
- `synthetic-bank-csv-v1` is a documented **synthetic-only** profile. It
  requires `Date`, `Posted Date`, `Description`, `Amount`, and `Transaction
  ID`, uses `MM/DD/YYYY`, and maps a signed USD amount with positive=inflow and
  negative=outflow. No actual bank or card institution profile is claimed.
- PDFs are retained as immutable byte receipts only. Missing-page metadata can
  keep coverage incomplete, but this implementation does not extract PDF text
  or use OCR. That evaluation remains MHO-254 ownership.

## Custody and import rules

Every retained artifact receipt includes account scope, original filename, MIME
kind, byte length, SHA-256 over the exact bytes (including BOM and newlines),
immutable existing `SourceArtifact.originalFiles` identifier, acquisition
time/actor, source format, and parser profile/version. Reusing one Files
identifier for different bytes is rejected. Duplicate acquisition receipts keep
their own filename, actor, time, and immutable Files identifier while pointing
to the canonical hash. A changed artifact needs an explicit retained
predecessor. A mapping-profile reparse uses the same retained artifact identity
and does not create a second original receipt.

Rows retain their unmodified source values, file-row/QFX location, normalized
minor-unit amount, transaction/posting dates, and account/artifact-scoped
revision lineage. They remain `UNCLASSIFIED` and `SOURCE_UNRECONCILED`, so a
parser result cannot assert an expense, revenue, or reconciled coverage total.

Imports use integer row offsets bound to account, SHA-256, and parser profile
version. A partial import persists no completed artifact receipt; only the
matching persisted checkpoint can resume it. Normalized mapping changes create
a linked row revision even when raw source values are unchanged; retrying that
same version is idempotent. Duplicate artifacts, rejected rows, partial work,
and imports with row rejections have distinct receipt statuses. No importer
outcome can assert `PROVEN_COMPLETE`.

## Synthetic fixture proof

`yarn fixtures:validate-ingestion` reads the committed CSV/QFX/PDF fixtures,
prints reproducible receipts, verifies the QFX period equation, and records a
synthetic missing-page condition. Its output is source proof only.

## Explicit remaining acceptance gaps

No real or redacted institution CSV profile has been received or verified. No
customer/provider artifact, account number, credential, PDF extraction/OCR,
installation, deployment, or live import was used. The committed controls and
continuity proof are synthetic-only; first-party source evidence and client
release acceptance remain gated by MHO-183, MHO-227, and MHO-228.
