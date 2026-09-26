# MHO-146 Phase A carry-forward matrix

Original Twenty integration target: `mhoo-os/mhoo-twenty-next` at
`88a21f624f17ecce805fb7fd6f9d8dc3f7d3c8b6`. Canonical portable source after
ADR-0015 extraction: `mhoo-os/mhoo-finance/apps/mhoo-finance`.

Seed: `mhoo-os/mhoo-twenty` PR #45 at
`6bef8da9004ea67607315422454a6aa52a65dfd3`.

| Old path or contract | Disposition | Phase A treatment |
| --- | --- | --- |
| Fixture generator and generated JSON pack | PORT_AS_IS | Deterministic synthetic pack, no provider or customer data. |
| Fixture data model, dedupe, revisions, coverage, exceptions, trace | PORT_AS_IS | Preserves one later-adapter-compatible source lineage contract. |
| Five Finance objects, relations, indexes, and native views | PORT_AS_IS | Uses current Twenty App definitions without a dashboard-only store. |
| Standalone page layout, navigation, native graph widgets | ADAPT | Retained as native Twenty primitives on the canonical source lineage. |
| Finance audit front component | ADAPT | Rebuilt with Twenty UI Cards, status tags, callouts, buttons, segmented control, typography, and theme tokens; no old palette or inline dashboard design. |
| Old component palette, inline CSS card/table/badge/button system | DISCARD_WITH_REASON | It bypassed the host theme and made the page look like a separate admin product. |
| Clover connection provider, secret variables, logic function, permission list, and Clover-reader role | DISCARD_WITH_REASON | MHO-146 Phase A authorizes fixtures only. Clover auth belongs to its separately governed connection line and must not enter this synthetic slice. |
| Clover-shaped fixture rows | PORT_AS_IS | They are synthetic test data only and retain POS-overlap coverage. |
| Old source ownership/provenance statements | ADAPT | Replaced with this target and exact seed identities. |
| Local fixture test suite | ADAPT | Kept as the focused behavioral check; runtime/workspace permissions remain a later gate. |

This port intentionally does not claim a live Workspace render, role proof,
cross-workspace proof, provider connection, real-data ingestion, deployment, or
production installation.
