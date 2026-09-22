# MHO-124 synthetic population preparation

This is an offline input generator for the six-year storage benchmark, not the
storage benchmark verdict. It reuses Finance `SourceArtifact` and `SourceRow`
types. No database, runtime connector, dashboard data model or dependency is
added. The two new code paths are a **WRAP** of existing fixture contracts.

From this package, with Node 24:

```sh
yarn benchmark:population 50000 /tmp/mhoo-finance-population-a 1000
yarn benchmark:population 50000 /tmp/mhoo-finance-population-b 1000
cmp /tmp/mhoo-finance-population-a/manifest.json /tmp/mhoo-finance-population-b/manifest.json
```

Both output directories must be absent. Existing directories are rejected;
the generator never overwrites originals. Choose new directories for reruns.
The example assumes 50,000 six-year events solely to demonstrate the harness.
It produces 100,000 distinct events, 20,000 duplicate rows and 10,000 correction
rows, distributed over 72 synthetic months. These are not Hass source counts
or accepted engagement dates. For populations below 72 events, not every month
will contain a row.

Each JSONL artifact retains physical row numbers and SHA-256. Duplicate rows
have distinct physical locations but the same event and revision. Corrections
retain revision one and add revision two with a one-cent change. Manifest
control totals use only the latest revision of each unique event. Artifacts
are multi-period synthetic exports: their period is the explicit six-year range,
while each source row has its exact month. They are benchmark raw inputs, not
monthly statement controls or already-installed native records.

The generator keeps one chunk's rows and serialized artifact in memory. Chunk
size limits unique events; raw rows can be up to **three times** that size when
an event has both a duplicate and a correction (including one-event chunks).
The CLI also retains every chunk descriptor until writing the final manifest;
metadata memory therefore grows with chunk count. It rejects more than 10,000
chunk descriptors **before creating the output directory**. This is an explicit
resource guard, not a measured byte-memory or native performance claim. Increase
chunk size within its existing 10,000-event maximum if the descriptor cap is hit.
The streaming generator itself retains its original option and resume contract.
The manifest is written only after every artifact succeeds. An interrupted
directory without its manifest is incomplete. `generateSyntheticPopulation`
can reproduce a suffix from an exact `nextEvent` boundary under identical
options; the CLI deliberately rebuilds into a new directory instead of trusting
an unverified partial output. There is no persisted ingestion checkpoint or
coverage/snapshot advancement here.

## Evidence still required before the storage decision

- Authorized source capability counts and a documented six-year projection;
  rerun at at least twice that measured projection. Every current manifest
  deliberately labels its input `HYPOTHETICAL_NOT_MEASURED`.
- Native Twenty object ingestion and generated-client query workloads, with
  an index inventory within the ten-index limit per object.
- Measured trace/exception P95 at most two seconds, coverage P95 at most five
  seconds, and background chunks below 900 seconds under concurrency.
- Native commit/checkpoint failure and retry proof, upgrade, backup/restore,
  raw-evidence rebuild and snapshot/coverage non-advancement on failed chunks.
- Query plans, storage growth, write amplification, tuning and signed verdict.

Local generation timing and byte-identical regeneration prove fixture
preparation only. They do not establish any native SLO, backup recovery,
customer-workspace availability or permission to import real data.


## September 9 source closeout

PR25 retains its original 3862c231 population checkpoint. The retained Finance
worker is now explicitly assigned by Native successor 01a07f5b to complete the
3x-row-bound documentation and CLI descriptor guard; historical original
implementation-worker identity is unknown. Main integration preserves existing
Finance contracts, ingestion/preparation scripts and all deployment guards.
Focused changed-input checks cover descriptor boundaries and CLI rejection before
filesystem mutation. Prior deterministic generation receipts remain attributable;
no unchanged large population or native/runtime benchmark is repeated.

A native benchmark still requires an accepted six-year projection from source
capability counts (the supplied 3,432 Plaid IDs do not supply that projection),
an explicitly scoped disposable native execution target, and the declared query,
concurrency, failed-chunk and recovery measurement plan. There is no measured
storage verdict or permission to implement durable publication from this source
closeout. MHO124 owns that verdict; MHO128 publication and MHO135 wiring remain
its downstream consumers. Up's pinned release and production freeze are unchanged.
