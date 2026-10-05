# Finance logical contract v1 — MHO-257

This source-only contract extends the native Finance artifact, import receipt,
financial fact and coverage identities introduced by MHO-146. It adds no object,
database, App, API, migration or publication path. Twenty remains the authority.
The pinned framework/SDK is Twenty v2.37.0. ARCHITECTURE IMPACT: LOCAL.

## Ownership and compatibility

| Existing primitive | Contract field | Compatibility rule |
| --- | --- | --- |
| `sourceArtifact.artifactKey` | `artifacts[].artifactId` | Retain original bytes and SHA-256; hash alone proves neither completeness nor authorization. |
| `importReceipt.receiptKey`, artifact relation | `receiptId`, `artifactId`, acquisition controls | Receipt must bind actual retrieval/control evidence in a future governed importer. Strings here are references, not authorization tokens. |
| `financeFact.factKey`, source row, revision | `Observation.factKey`, `sourceRowKey`, `revision` | Retain every observation, including pending and removed revisions. v1 requires contiguous local revisions starting at 1 and stable source event/account identity. |
| `financeFact.amount`, source description/category | `sourceAmount`, `currency`, `signConvention`, original description/category | Preserve raw decimal text; compute signed minor-unit text without floating-point conversion. |
| `coveragePeriod.coverageKey` | `coverage[].coverageKey` | Legacy COMPLETE must not become verified source completeness. Missing pagination/control evidence stays UNKNOWN. |
| Reconciliation exception evidence | `links`, rejected-candidate reason | Explicit revision links and evidence; mismatches reject the candidate and preserve the prior baseline. No fuzzy matching. |

The Phase A number-based fixture adapter remains a presentation demo. `legacyCents`
accepts only safe integers and explicit two-decimal currency. It cannot recover
already-rounded values. Do not convert this contract's money strings through
`Number`, CSV type inference, or a floating-point notebook column. Do not map the
full signed 64-bit range to native CURRENCY/NUMBER fields without proving their
actual database and API limits. A future MHO-128 migration must preserve old
parser/schema identities, originals and hashes, supply the missing fields and
verify runtime persistence, relations, Workspace isolation and recovery. Existing
nullable relations are not proof of immutable custody. Supersede versions and
rebuild derivatives; never rewrite originals to fit v1.

## Exact money and dates

Amounts and aggregate results are bounded to ±9,223,372,036,854,775,807 minor units.
JSON uses `{ "currency": "USD", "minor": "9007199254740993" }`. CSV uses a header
`currency,minor` with both columns read as text. Python notebooks use `int(minor)`;
never float or a default pandas numeric inference. `moneyCsv`/`readMoneyCsv` provide
a strict lossless two-column interchange. The golden test crosses 2^53 and proves
JSON, CSV and exact addition. Supported v1 currencies are USD/THB/EUR/GBP (2), JPY
(0), KWD (3); all other codes and extra precision reject pending a version update.
No FX conversion or rounded discrepancy tolerance exists.

`INFLOW_POSITIVE` and `OUTFLOW_POSITIVE` describe account movement, including a
card liability's payment/charge convention. Source text is retained separately.
Ambiguous formatting/signs reject. DATE remains YYYY-MM-DD. INSTANT requires an
explicit UTC timestamp (up to milliseconds); other formats need a declared parser
and raw-source custody, not a fabricated midnight timestamp. Date selection uses
the supplied source calendar day; v1 does not convert business time zones.

## Population, revision and metrics

The manifest states requested and observed periods separately. Empty population
has null observed period. Nonempty observed bounds must equal received row dates.
Every artifact count and acquisition total reconciles to observations, including
duplicate acquisitions and superseded revisions. An artifact duplicate requires
an explicit original, identical hash/count and identical revision contents. Equal
amounts/descriptions on different source event identities remain separate facts.
No category, amount or fuzzy similarity establishes an identity or transfer.

A baseline selects explicit same-currency BANK accounts and one exact evidenced
coverage window per selected account. NO_ACTIVITY needs evidence and zero rows;
MISSING cannot become zero. Larger/multiple coverage windows require a future
explicit composition contract. Latest posted revisions inside scope are eligible;
pending, removed, superseded, duplicates and out-of-scope observations remain
visible in the population/exclusion receipt. CARD/POS rows are not bank cash.

`bank-movement/v1` sums positive movement as `observed_bank_inflows`, absolute
negative movement as `observed_bank_outflows`, and subtracts for `bank_cash_change`.
Transfers within scope cancel, transfers outside scope still move selected bank
cash, and bank-side card payments remain cash outflows. Explicit transfer/card
pairs require different accounts, equal/opposite same-currency values and evidence.
Refunds oppose their linked movement; reversals also balance exactly. Owner flows,
refunds and transfers are not automatically revenue/expense. Recognized revenue
and business expense are **only selected-bank observations** with explicit
classification/procedure references; they are not a complete P&L, accrual result
or approved finding. Unknown observations retain IDs and exact amounts in the
snapshot. Evidence-reference existence/authority must be checked by the future
Workspace-authorized caller, not inferred from these source tests.

## Snapshot, replay and scenario boundaries

`buildSnapshot` clones, validates and deep-freezes input, builds eligible/excluded
revision lists and hashes canonical manifest, facts and baseline content. Object
key order is normalized; observation order uses code-point identity ordering.
Manifest array order is part of its identity. Whole received artifacts are hashed
by the custody layer: the contract validates a digest's format, not possession of
those bytes. Golden source bytes and their digest are fabricated together.

COMPLETE retrieval/pagination, VERIFIED source controls plus references, no
truncation/rejects, and selected coverage are required. UNKNOWN/PARTIAL/FAILED
and derived conversational exports cannot mint an eligible baseline. These states
remain available on the caller's rejected manifest. `retainOrReplace` returns the
same prior verified object on rejection and has no persistence side effect.
A WeakSet prevents forged/deserialized snapshots from entering the local
replacement/scenario path: rehydrate by rebuilding and checking the expected hash.
This is local validation, **not** a signature, authorization check, transaction,
server tool or production publication gate. Synthetic eligibility never means
real-source eligibility. MHO-128 retains storage/security/recovery obligations.

Scenarios refer to baselineHash, have separate scenarioHash and immutable
assumptions, return hypothetical metrics and UNREVIEWED_HYPOTHESIS, and cannot
mutate observed facts or enter the baseline path as verified snapshots. Scenario
money deltas require the baseline currency and remain within the same bounds.

## Focused proof

Run from this App directory:

```
corepack yarn install --immutable
corepack yarn test:unit
corepack yarn typecheck
corepack yarn lint
```

`src/fixtures/contract-golden.ts` uses only fabricated accounts/events. Tests cover
large exact values, unsupported signs/dates/precision, legitimate repeats, duplicate
acquisition, corrections, pending/posting/removal, zero versus missing coverage,
transfer/card pairs, refunds/reversals/owner flows, deliberate reconciliation
mismatch, unknown source controls, immutable replay and scenario separation.
No source/fixture result establishes an installed App, real financial finding,
provider authority, reviewer approval, scale verdict or completed MHO-128.

## Read-contract parity fixture — MHO-258

`read-fixture.ts` consumes this same snapshot and its artifact/receipt identities.
It is a local synthetic harness, not an installed tool, public endpoint, second
identity service or persistent cache. `ui`, `tool` and `dataset` are adapters to
one deterministic read function. No LLM, polling, SQL or export capability exists.
The future production binding must use Twenty's canonical role-aware tool surface,
the triggering person's role intersected with the App role, and durable verified
snapshot publication. Do not expose this fixture factory as a server handler.

The authoritative caller resolves permission on every invocation before cached
results or metadata can be returned. The supplied identity is opaque to the
fixture. Resolved subject, permission revision, Workspace, engagement, permitted
accounts/actions and approved snapshot set bind cache/query identity. Request
scope never grants authority. Revocation denies cached reads and invalidates old
cursors. Unknown fields (including scope-expansion prompts), export actions,
wrong scopes, unsupported page sizes and malformed/mismatched cursors deny.
The maximum page size is 50. Cursors are local issued handles bound to the entire
query and permission boundary; a runtime implementation needs durable, expiring
handles or authenticated cursors and current authorization, not this process map.

Summary results use the whole eligible baseline, independent of page size.
Coverage and unresolved lists are filtered before delivery. Source traces expose
only eligible selected-bank observations after verifying the one referenced
artifact's locator/bytes/SHA-256. They repeat this targeted check even on repeated
reads; unrelated artifacts are not loaded. Non-trace reads reuse detached results,
and no read rehashes the entire corpus. Snapshot construction validates once at
fixture creation; this is not performance or atomic-publication proof. Returned
objects cannot mutate the internal scope or cached result.

Every read supplies scope, source-date basis, requested period, as-of value (null
when unavailable), snapshot/manifest/fact hashes, exact currency/metric convention,
selected eligible/excluded/unresolved counts, coverage/reconciliation limitations,
procedure version/receipt, stable ordering and pagination metadata. Neither a
complete page nor an exhausted cursor establishes source completeness. READY is
only readiness of the synthetic baseline, not PROVEN_COMPLETE. PARTIAL/STALE/FAILED
can answer from the prior baseline with explicit limitations; missing-evidence
procedures remain withheld. EMPTY returns null totals, never fabricated zero cash.
A missing or corrupted target artifact withholds the trace; permission denial
returns no dataset metadata. Scenario results retain their separate baseline hash,
assumptions and unreviewed result identity and never replace observed reads.

The source-only end-to-end tests run coverage → unresolved item → source trace
with the agent disabled. They cover UI/tool/notebook parity, transfer/card/unknown
populations inherited from the golden fixture, access revocation, row/field
restriction, page/cursor boundaries, evidence corruption, missing/partial/stale/
failed/denied states, output-mutation isolation and scenario separation. These
checks cannot establish installed Workspace RLS, actual reviewer permissions,
provider consent, durable cache behavior, live evidence custody or a storage SLO.
MHO-135 retains its procedure/case/privacy/runtime gates; MHO-124 owns scale and
recovery proof. A later production adapter must supply those proofs before use.

## Saved-question adapter — MHO-135, September 9 source increment

`investigation/saved-question-reader.ts` adds a bounded async read adapter for
observed bank outflows and unresolved-evidence counts. It rebuilds and compares
the published logical snapshot using this contract, excludes duplicate artifact
acquisitions from chart arithmetic, and uses exact money strings. The whole
selected population drives the chart; rows are stable identity-sorted pages of
at most 50. Excluded counts stay inside selected accounts/dates. Freeform
manifest limitations and descriptions are not forwarded to avoid exposing
unrelated account text. Static scope/completeness limitations are always shown.

Every chart, page and trace resolves current permission; the adapter has no
response cache. Workspace, engagement, allowed snapshot, account set and explicit
field projection must match. The chosen question requires its own summary or
unresolved action; a trace additionally requires trace permission. Cursor query
identity includes subject/permission revision, scope, snapshot/publication,
question, month and limit; a cursor is navigation, never authorization. Current
publication and permission are checked again after I/O. Missing/stale/unverified
snapshots return no rows or totals. Derived partial CSV exports cannot become an
eligible baseline. Inputs above 10,000 observations withhold rather than truncate;
this bound is not the six-year storage or latency acceptance verdict.

A trace reads only the referenced artifact through the authorized port and
compares exact bytes to its manifest digest. It returns the receipt, digest and
recorded row locator, not raw source bytes or a newly parsed/verified excerpt.
Parser-to-row provenance and statement completeness remain separate evidence.

`investigation/saved-question-session.ts` is a UI-side sequencing adapter: question
submission, chart-month selection and selected row each call the reader anew.
It clears prior results before loading and ignores late responses after reset or
supersession. Reset must be called by the host on Workspace/identity changes;
this is presentation isolation and never substitutes for server authorization.
Focused tests drive this session through the actual read adapter using synthetic
stand-ins for the native dependencies, including in-flight revocation.

**Not yet wired or shipped to the Workspace:** no logic function, MCP tool,
front-component entry, object, role, grant or metadata is registered by this
increment. The current saved-sample component and c1ab/534982 synthetic question
UI remain unchanged. Required next integration is an authenticated native host
client binding this session to the reader, a Twenty person/App permission resolver
including field/account visibility, durable authorized snapshot publication and
current-revision checks, and the authorized artifact read port. MHO-128/135 own
the missing persistence/runtime proof. The installed CSV samples currently lack
that verified publication; never wrap the synthetic fixture factory or invent a
snapshot/authority to make them render financial totals. Actual installed
allowed/denied roles and Workspace switching remain acceptance gates after
separately authorized installation. Production freeze stays intact.

Historical source repository before ADR-0015 extraction: mhoo-twenty-next. Retained worker
01a075f0-61f8-7f12-a4bc-392bc251a108; successor native head
01a07f5b-736e-7512-952e-f6f5e7a1ea7e. MHO-146/258 stay completed dependencies.
Source base 902537a8162988528409cc917afa17a9884aff36. Reuse PR36 installed evidence,
c1ab question UI and 534982 native local proof; these files do not invalidate
those unchanged journeys or establish new installed behavior.
