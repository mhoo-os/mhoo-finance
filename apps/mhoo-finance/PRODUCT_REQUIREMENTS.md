# Finance: question-driven analysis with traceable evidence

> **Current product-definition entrypoint (2026-09-13):**
> [HASS_FINANCE_PRODUCT_DEFINITION.md](HASS_FINANCE_PRODUCT_DEFINITION.md)
> finalizes the Hass-specific source, reconciliation, human-review and
> planning contract and records the current capability/gap map. Its now-versus-
> planned status supersedes older prototype-status wording in this historical
> planning ledger. The detailed reusable product principles below remain in
> force where they do not conflict with that entrypoint.

Status: the September 7 planning-only entry is retained as history. The
September 14 native Finance implementation section below records the later
owner authorization and supersedes its prototype-only wording. Repository
portability remains a proposal pending the coordinator-owned architecture
decision.

ARCHITECTURE IMPACT: LOCAL

## Authorized native Finance implementation — 2026-09-14

The owner authorized the current increment to become a real Twenty App rather
than a permanently hardcoded demonstration. Overview, Accounts, Transactions
and Statements are four native Finance page-layout destinations in that order;
each renders the governed Finance component instead of a raw object table. The
owner-facing Overview opens directly, without the obsolete Workspace
preparation or Record counts tabs and without a second embedded app header or
sidebar.

Installed screens read only current-Workspace `financialAccounts`,
`financeFacts` and `sourceArtifacts` through Twenty's generated client, with
explicit loading, empty, permission-denied, failed and bounded-result states.
There is no synthetic fallback. The invented history remains an isolated local
preview/test source using the same direction and display contracts and can be
removed without touching persisted Workspace records.

Cash direction comes only from the signed exact-minor-unit field contract;
description text never determines direction or income/expense classification.
Included, non-superseded facts supply Money in, Money out and net movement.
Invalid or undated facts and sparse coverage remain visible limitations. The
selected inclusive interval drives the overview, chart, transactions, accounts
and statement list. Its timeline derives from available history, scrolls across
years, exposes month/year/all zoom and does not reset at January.

Source entry keeps bank, Clover/POS, uploaded statements and Workspace Gmail
evidence distinct. It hands off only to supported Twenty-owned Apps or Source
artifact surfaces and never reports a connection or import without one. An
explicit Finance fact-to-Source artifact relation may receive append-only
link/unlink/restore decision events in Workspace records. Each event preserves
both references and cannot change classification; absent or ambiguous evidence
offers no unsafe action. Provider grants, live imports, retroactive matching,
role expansion and deployment remain separate gates.

## Product outcome

Finance helps a reviewer ask a financial question, understand what the available evidence supports, and decide what to investigate next. It should offer CFO-like analytical support: explain a change, surface a concern before the user thinks to ask, compare plausible explanations, and identify the evidence needed for a decision. A concern is an invitation to investigate, not an unsupported conclusion or an automated professional opinion.

The primary experience joins conversation, charts and source inspection. A user starts with a question such as “What changed in outflows?” or “Which periods cannot yet be reconciled?” The answer presents the examined scope, a useful chart where the evidence permits one, an explanation and its limits. Selecting part of the chart reveals the contributing transactions; selecting a transaction reveals its exact source evidence. Raw tables remain available for detailed inspection and export, but they are secondary to this question-to-evidence journey.

Finance remains a reusable financial-data product: structured source-backed records, validated functions and bounded agent skills/tools support different audits and analytical questions. Hass Kitchen is the first engagement, not a hardcoded product-wide workflow. Users can inspect the same evidence and controls without an agent. Agents select, sequence and explain authorized tools; deterministic functions own arithmetic, source qualification and rule execution, and human reviewers own final dispositions.

The first host remains Twenty. It owns identities, memberships, permissions, records, Files, workflows, credentials and authorized App execution. Finance owns financial definitions and procedures within that boundary; providers own their source facts. The owner-settled standalone native Clover App owns Clover connection lifecycle and ingestion. Finance consumes its authorized relevant data, never its credentials. Existing synthetic Cloudflare work and Data Analytics remain governed consumers, not another authoritative ledger.

## Explainable concerns and decision support

A proactive concern must state the observation, why it was raised, the affected scope and snapshot, the deterministic procedure or comparison used, and the supporting transaction/source references. Show missing or contrary evidence, coverage and reconciliation limits, and any uncertainty about classification or cause. Avoid invented confidence scores: an uncertainty statement must explain what is known, inferred or unavailable.

Distinguish observation from interpretation and from a proposed next action. For example, a synthetic demonstration may highlight an increase in a selected outflow group, offer possible transfer or timing explanations, and suggest inspecting the contributing records. It must not equate outflows with expenses, infer profit from bank activity, or label an unexplained transaction fraudulent. A missing source is a coverage concern, not evidence of zero activity or misconduct.

The product may suggest a bounded comparison, evidence inspection or review task. It must not silently acquire data, change classifications, publish findings or message another person in response to a question. Any later proactive refresh or notification mechanism needs its own permission, freshness and delivery contract; this PRD does not claim one is running.

## Recorded owner decisions and current data

- Working horizon is approximately 2020–2026; do not repeatedly ask for exact dates. Actual examined periods must always be reported separately.
- Prepare the workspace model, functions and layouts using the data already available, before clients join with more data.
- Current intake modes are manually supplied bank statements/exports and ChatGPT Finance/Plaid CSV exports referenced in Linear. No live connector is a prerequisite for the reusable Finance data/function layer. Statements are an intake mode; this does not claim that balance-control statements or their original Files have already been supplied and verified for the current sample.
- The supplied recent exports came from the Finance plugin in ChatGPT using Plaid, according to the owner. This does not establish a live Workspace Plaid connection or independently attest the plugin's transformations.
- Available combined export contains 3,432 unique transactions, the union of checking/card exports, spanning 2024-09-02–2026-09-04. Never count the combined file and constituent files as separate populations.
- The accepted September 7 installation receipt records a bounded 20-row sample selection, two sample accounts and two partial source references in Twenty; this planning edit performs no fresh live-data read. Samples remain UNCLASSIFIED, excluded from totals and unreconciled. Uploaded original Files and statement balance controls are not established.
- Known engagement inputs already recorded in Linear: Specialized Chubby Group LLC; Narttapart Sintupanpratu and Punnada Limphoka. Recorded names are not substitutes for the engagement/source attestations required by the existing gates.
- PR36 was separately merged and installed: accepted merge `ac441abf4f709de92a0aaedb22d262eab6cd19e8` has the same tree as reviewed source `6ffd295a1d22c6c1b5fed014d764ecca69bf4deb`; the recorded post-install plan had zero changes and all 20 samples were preserved. Restricted-user denial remains unproved. These are accepted receipts, not a fresh runtime probe or an instruction to apply PR36 again. No provider connection, import, permission expansion or production effect follows from this PRD.

## Reusable function and tool contract

Expose bounded operations over the same governed model: source/coverage inspection, filtered transaction reads, exact-money summaries where qualified, reconciliation procedures, and fact/source traces. Their shared input envelope names the authorized scope, account/source/period, version or snapshot, metric/procedure and pagination limits. Outputs carry provenance, exclusions, coverage and exploratory/reviewed state. Missing prerequisites return an explicit incomplete/not-applicable result; an analytical question must not silently trigger ingestion, classification or publishing.

Validated functions own financial arithmetic and deterministic logic. Agent skills teach how to select those functions, distinguish evidence from inference and follow a source trace. Tools expose explicit schemas and permissions rather than an arbitrary financial code executor. A new audit should reuse the same records/functions with a different authorized scope or registered procedure, not clone an App or fork a dashboard. New procedures still require their own definitions and tests before use.

Acceptance must include at least two distinct questions over the same fixture/snapshot (for example, source coverage and an account-period transaction breakdown), proving common scope/provenance and no duplicated ledger or special Hass-only schema. A statement reconciliation is one procedure with additional prerequisites, not the only supported entry point. This broad product contract does not claim the functions or agent skills are all installed today.

## First vertical slice: journey and screens

| Screen                    | Question answered                                    | Required behavior                                                                                                                                                                                                                                           |
| ------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conversation and overview | What can I investigate, and what deserves attention? | Question, evidence-backed answer or limitation, explainable concerns and bounded next action. Show actual source period, snapshot/as-of or sample mode, coverage and reconciliation state before results. Never turn no data into zero activity.            |
| Chart                     | What pattern supports this answer?                   | An approved metric or sample-only count view from the same scope. Selection opens contributing transactions and keeps the explanation and evidence context aligned. Missing prerequisites produce an explicit unavailable state.                            |
| Transactions              | Which records explain this result?                   | Secondary inspection surface reached from the question or chart, with shared account/date/snapshot scope, exact money/currency/sign, classification/exclusion, record opening and bounded pagination. Distinguish the loaded page from the full population. |
| Evidence                  | Can I verify it?                                     | Fact → artifact → exact source row; original filename/hash/acquisition receipt, raw values, parser/source revision and original Files availability. Show missing/denied evidence honestly.                                                                  |
| Accounts                  | Which source does this belong to?                    | Explicit bank/card identity and masked labels; no guessed ownership or automatic mapping by display name.                                                                                                                                                   |
| Coverage                  | What is missing or unproven?                         | Account/source/month evidence state; missing, partial, unreconciled and proven populations remain distinct. Status transitions require receipts.                                                                                                            |
| Exceptions                | Why does this matter and what next?                  | Deterministic rule, expected/observed/difference, scope, supporting/limiting evidence, reviewer state and a bounded evidence/reconciliation action. An exception is not a fraud finding.                                                                    |

Use one native Finance navigation folder. Native saved views, App-owned page layouts and approved widgets/components are the presentation layer. The same financial definition and snapshot must drive UI, tools and exported dataset results. Do not add dashboard-local financial arithmetic.

## Intake: history and ongoing updates

Use governed original artifacts and append-only acquisition/import receipts before normalized records. Each row retains exact location, original values, currency/sign convention, parser identity and stable source identity. Duplicate imports/retries do not change counts or totals. Corrections create explicit revisions rather than silently replacing historical evidence.

Historical bank/card review uses machine-readable bank exports plus original statements as controls. Recent Plaid history cannot establish a six-year population. A future incremental connector must handle added/modified/removed rows, pagination/cursors and pending-to-posted transitions, then reconcile overlap with existing exports. The standalone Clover App owns Clover historical export and ongoing acquisition, with capability/merchant authorization and bounded ingestion. Finance owns settlement-specific financial modeling over its authorized outputs. No generic OAuth grant alone proves provider coverage or successful synchronization.

Reuse Twenty Connections in the provider-owning App when the protocol actually fits; keep one credential/refresh owner. Finance must not add a second Clover Connection provider, token reader, refresh loop or direct provider caller. Plaid's Item/token flow requires explicit integration design, not a guessed OAuth mapping. Reuse App logic functions, durable records/key-value progress and bounded jobs for adapters. No new connector vault, generic queue, ingestion service or datastore without the existing architecture/reuse process.

## Clover producer → Finance consumer dependency

This records the owner-settled product direction; the exact producer contract and its canonical architecture receipt are being coordinated with the existing native Clover owner, not invented in Finance. This PRD does not replace the required accepted authority/contract record or prove cross-App invocation/install dependencies. No silent migration of legacy connected accounts or broader credential reader is permitted. Both Apps remain within Twenty Workspace authority.

Before wiring a Finance consumer, record the reviewed producer object or bounded function identity and version, authorized merchant/location scope, immutable provider record ID/revision, source/effective/observed times, exact amount/currency/sign semantics, source artifact/row reference and acquisition/coverage limitations. These are Finance consumer requirements, not a claim that the producer fields or function already exist. Confirm object/field/row permissions and approved consumer delivery semantics against that exact contract. Any reconciliation projection stays traceable to producer facts and does not mutate or replace them.

Historical completion, pagination, removals/corrections and acquisition failures belong to the Clover producer contract. Financial eligibility, settlement/transfer classification, coverage qualification and reconciliation belong to Finance. Producer ingestion success does not mark Finance reconciled. Frontend connection controls belong to the Clover App; Finance may show authorized source status, not access tokens or duplicated connection management. Consumer wiring waits the reviewed source contract and synthetic parity/denial evidence; live activation remains separately gated.

## Deterministic reconciliation and review

The first complete reconciliation procedure should be one account/month statement balance and continuity check against a named eligible snapshot; ordinary exploratory reads can run independently with their own honest coverage limits. Explicitly record opening/closing controls, transaction eligibility, exact money, tolerance and exclusions. Separate internal transfers/card payments before interpreting revenue or expenses. Full restaurant procedures and many-to-many settlements remain existing later issue scope.

A completed validated import can trigger a bounded reconciliation function. Publish its run receipt and exception records through native APIs; use a native workflow to route a review/evidence task. Scope database-event triggers to relevant status changes and make retries idempotent. Do not run duplicate financial logic in UI, workflow Code steps and agent prompts.

Human review records disposition and its evidence; independent approval owns a final finding. Source intake, reconciliation, case review and published financial results are separate states. Full case/evidence-request/workpaper lifecycle belongs to MHO134, not an empty set of new screens in this increment.

## Data-driven and agent-guided visualization

The default workspace is constructed from App metadata: stable navigation, views, layouts and a catalog of approved components. Data fills these definitions as intake and procedures complete. The UI does not have to be regenerated from scratch on each import.

Preparation displays record counts, source limits and unreviewed samples, not financial totals. Qualified monetary charts require a server-defined metric, exact snapshot, account/period/currency/population/exclusions and lineage; totals must match tools and dataset consumers. Chart selection should open the same scoped records. Verify native drilldown before relying on it; otherwise use an explicit bounded control in an approved component.

A proposed later agent feature returns a validated flat proposal such as viewKey, accountId, period, snapshotId and explanation. A server boundary validates allowed keys and caller scope, retrieves deterministic data and chooses a known component. No arbitrary JS/HTML/SQL or agent arithmetic. Twenty v2.37 native agent response schemas allow only flat primitive properties, not nested arbitrary chart trees.

Native chat navigation has a source implementation, but the generic record-name tool's system-context lookup needs a targeted permission review before restricted Finance use. PR36 instead opens IDs from an authorized generated read. Arbitrary live agent→custom-widget synchronization is not established. The first proposed extension is ephemeral exploration with explicit results/refetch, not shared-layout writes. Persistence, concurrent viewers, freshness and cancellation require a reviewed contract before implementation. Native Finance voice and optional ChatGPT Apps/widgets are separate unverified extensions; MCP availability alone does not provide them.

## Shared conversation, chart and evidence state — planned contract

One exploration context must drive the conversation result, chart, transaction list and evidence panel. Its conceptual fields are the question/result identifier, authorized account/source/period scope, snapshot or explicit sample mode, metric/procedure version, active filters, chart selection, selected transaction and selected evidence reference. These are proposed contract requirements, not a new persisted object or implemented synchronization mechanism. Resource IDs select records only after host permission checks.

A chart selection refines the same filter used by the transaction list. A transaction selection resolves its evidence under that result's scope, preserving row/page reference, original values and artifact identity. Follow-up questions either retain that context visibly or state the requested scope change. Conversation text must not continue describing a superseded chart or silently broaden the population. Tools and UI consume the same qualified result; neither recalculates a conflicting total.

Changing period, account, snapshot or filters invalidates incompatible selections and visibly marks the previous answer stale until a new result is ready. Out-of-order responses cannot replace the current result. Missing or denied evidence clears the old panel and returns its actual unavailable/denied state without broader-query fallback. Workspace changes clear exploration state and require authorization again. Loading, empty, partial, stale, failed and denied are distinct states. Persistence across sessions or concurrent viewers is not included in the first prototype.

## Portability direction — ACCEPTED, Twenty-backed first

ADR-0015 is accepted and the Finance product source has been extracted to
`mhoo-os/mhoo-finance/apps/mhoo-finance` with exact provenance
recorded in `docs/finance-app-migration.md`. The transitional
`mhoo-twenty-next` copy remains a host integration and rollback source until a
separately reviewed consumer switch passes installed acceptance. Existing
product, evidence and permission contracts continue to govern the extracted App.

The proposed separation preserves one versioned financial domain implementation, a reusable React presentation layer and shared typed tool/result contracts. Host adapters should translate only the host-specific authentication context, authorized data/file access, navigation, lifecycle and tool invocation. They must not duplicate financial calculations, create their own identity or credential store, or turn browser-supplied selectors into authority.

| Proposed reusable part | Shared responsibility                                                                       | Twenty adapter responsibility                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Domain logic           | Exact-money semantics, eligibility, coverage, deterministic procedures and evidence lineage | Obtain authorized records and persist approved results through existing Twenty primitives. |
| React UI               | Question/chart/transaction/evidence presentation, selection and visible state semantics     | Host navigation, supported components and permission-aware delivery.                       |
| Tool contracts         | Bounded inputs, qualified results, provenance, exclusions and refusal states                | Enforce the caller/App permission intersection and invoke approved functions.              |

The extraction record identifies immutable source paths and versions,
dependencies, license metadata and the retained host integration boundary. No
alternate host is accepted or implemented here. The source move adds no D1 or
other backend, provider access, credential transfer or data migration.
Portability must preserve Twenty-backed identity, permissions and credential/data
custody in the first host consumer change.

## Implementation and acceptance status

Installed observations below come from accepted September 7 receipts in [MHO259](https://linear.app/mhoo/issue/MHO-259), not fresh verification during this documentation increment. Historical source-stage details remain in [INVESTIGATION_UI.md](INVESTIGATION_UI.md) and [PREPARATION.md](PREPARATION.md); their earlier pending-install wording must not trigger a repeat installation.

| Increment                                                             | Status                                                                                                                                                               | Acceptance still required                                                                                                                                |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared exact-money/snapshot/read contracts                            | Merged source and synthetic proof (MHO257/258).                                                                                                                      | Actual eligible-population publication and parity on a deployed Workspace.                                                                               |
| Accounts, preparation and saved sample read                           | Accepted installed receipt includes working sample reader after the host loader release and preservation of 20 excluded samples.                                     | Remaining permission/reload acceptance follows its existing evidence ledger; no full eligible-population claim.                                          |
| PR36 navigation + transaction/evidence UI                             | Merged and installed; accepted receipt confirms native navigation, selected transaction→artifact/row inspection, missing-original notice and zero post-plan changes. | Representative restricted-user denial remains unproved; cross-workspace/runtime acceptance is not inferred from source or mocked tests. No repeat apply. |
| Preparation count widgets                                             | Accepted installed receipt records counts and explicit sample/uncertainty labels; no qualified monetary aggregate.                                                   | Snapshot-qualified charts and complete state/permission acceptance remain separate.                                                                      |
| Qualified overview/chart→exception→fact→source                        | Existing required MHO146/135 journey, unfinished.                                                                                                                    | Same metric/snapshot parity, supporting/contrary evidence and next action; work without agent.                                                           |
| Full historical/incremental connectors, procedures and case lifecycle | Existing gated MHO125–134 work, unfinished.                                                                                                                          | Provider/source authority, complete-population and reviewer evidence per each issue.                                                                     |
| Question→chart→transaction→source prototype                           | PLANNED ONLY in existing MHO146 UI scope; not implemented.                                                                                                           | Explicit next-task authorization and the acceptance/refusal examples below.                                                                              |
| Constrained generative view proposal                                  | Design proposal only.                                                                                                                                                | Allowlisted host/tool contracts, shared exploration state and permission/source-fidelity proof before implementation.                                    |
| Separate Finance product repository                                   | ADR-0015 accepted; exact source extracted with provenance.                                                                                                           | Destination checks, host consumer switch and installed parity/denial proof before transitional source removal.                                          |

Outstanding installed acceptance remains with the existing owners and receipts: allowed/denied and cross-workspace access, reload and visible-state behavior, original Files custody and eligible-snapshot parity. Do not manufacture identities or broaden roles to obtain a pass. Temporary setup-key revocation follows completion of its authorized setup, not this documentation change. These remaining obligations do not reopen the completed PR36 application step.

## Next task — PLANNED ONLY: clickable question-to-evidence prototype

The next proposed task belongs to the existing MHO146 UI slice: prepare a clickable Finance question → chart → transaction → source-evidence prototype for product review. It is not another PR36 install, a new PRD/ledger or a request to begin a feature sprint now. The retained Finance owner prepares it only after the repository head completes desk/scope review and receives explicit implementation authorization. The cross-repository coordinator (`01a0757d-0f0b-7713-9c4c-6541e67ed905`) owns ADR-0015, central reuse and Linear reconciliation. The repository head coordinates product source only.

Use sanitized synthetic examples, prominently labeled as demonstration data and excluded from real financial conclusions. Do not copy the engagement's personal details or available customer sample rows into new UI examples. Demonstrate two different questions on the same fixture/context, with a traceable deterministic result and a clear route to its source reference. Conversation is the primary entry, an approved chart is the visual explanation, and the table supports inspection. The prototype may use fixture-backed responses; it must say so and must not imply a connected provider, live agent or original-file custody.

| Review scenario                                                                             | Required acceptance or refusal behavior                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “What changed in outflows?” on a qualified synthetic comparison                             | Show both examined periods, metric/population/exclusions and a clearly labeled demonstration chart. Explain the observed change without calling it profit or asserting its cause; selecting a bar shows exactly the contributing fixture transactions.    |
| “Which periods need more evidence?” on the same fixture                                     | Use the same account/snapshot context to show coverage states and missing controls. Selecting a gap opens its evidence status rather than inventing transactions or treating missing data as zero.                                                        |
| Select a transaction, then its source                                                       | Keep question, chart filter and selected record aligned; show the exact synthetic row/page reference and artifact identity. Missing original bytes display unavailable, not a fabricated document. Back navigation preserves the valid selection context. |
| Follow up with a new period while a prior response is pending                               | Mark the prior answer stale, clear incompatible transaction/evidence selections, and accept only the response for the new context. No cross-period or cross-workspace mixing.                                                                             |
| “What was actual six-year profit?” with only unreconciled samples or partial recent exports | Refuse a real profit/completeness conclusion. Explain absent coverage, eligibility and statement controls, show available evidence limits and offer a bounded coverage investigation. No authoritative total from excluded samples.                       |
| “Is this fraud?” or “Publish this as confirmed”                                             | Do not make the accusation or publish a finding. Separate observation and possible explanations, cite supporting/contrary evidence and identify the required human review.                                                                                |
| Evidence access is denied, missing or fails                                                 | Show the actual state, clear stale evidence and offer an allowed next action. No permission expansion, credential request, broader fallback read or synthetic data presented as the failed real response.                                                 |

Product review must check visible sample labels, consistent scope/selection across all four surfaces, qualified metric parity, traceability, contradictory/missing evidence, and loading/empty/partial/stale/error/denied behavior. It must work through explicit controls without an agent. Prototype review does not establish installed role enforcement, provider connectivity, durable import, a six-year result or production readiness. No prototype code, tests, builds, provider calls, data changes or deployment are part of this documentation update.

## Completion definition and boundaries

MHO146 closes only when the accepted deployed vertical slice lets a reviewer see a justified result, inspect its exception/facts, trace original evidence and reproduce it with appropriate permission and visual receipts. PR36 is one increment, not project completion. The six-year project closes only after all existing dependency gates, actual source coverage, deterministic runs, human review and final reporting/recovery acceptance are met.

No payment/transfer/refund initiation, automatic fraud finding, tax opinion, unrelated personal-account review, or implicit client publication. No new framework, identity system, datastore, workflow engine, credential authority or agent runtime.

Existing source ownership: this PRD is the product plan; [INVESTIGATION_UI.md](INVESTIGATION_UI.md) retains the original UI increment receipts, [PREPARATION.md](PREPARATION.md) the bounded preparation scope, and [INGESTION.md](INGESTION.md) the ingestion contract. The central `mhoo/docs/architecture/FINANCE_FORENSIC_REVIEW.md` engagement contract remains preserved; this update does not replace it.

References: [Finance project](https://linear.app/mhoo/project/mhoo-finance-hass-kitchen-six-year-forensic-review-da85b4d06e8e/overview), [MHO146](https://linear.app/mhoo/issue/MHO-146), [PR36](https://github.com/mhoo-os/mhoo-twenty-next/pull/36), existing App contracts/INGESTION.md/PREPARATION.md/INVESTIGATION_UI.md and accepted Mhoo ADR0008. The standalone Clover App dependency follows the September 7 owner decision; exact producer identifiers remain pending its owning lane. Framework source is pinned by .twenty-source; the separate research matrix records official upstream evidence and unverified capability limits.

## Native Task follow-up refinement — source candidate

Finance Follow-ups reuse Twenty Tasks as the action record and extend them with
validated Finance context. A follow-up can cover several transactions and/or a
missing statement period. Required Finance states are To do, Waiting for reply,
Ready for review and Resolved; native Task status is supporting workflow state,
not reconciliation evidence.

The main Follow-ups view stays concise and spacious: question, state, owner and
next action only. Investigation work opens a full detail surface with Summary,
People, Evidence and Email sections on demand. Transaction quick inspection
links into the related follow-up without packing the investigation into its
narrow drawer. Back navigation keeps the component's selected date, account and
search context.

People context stores Person references, role and explicit recipient selection.
It grants no membership or Finance data access. A branded Mhoo Finance draft
must disclose mailbox label, selected recipients, personalized body and
attachments before approval. Approval persists only `APPROVED_NOT_SENT`; this
increment includes no send path, new mailbox scope, broadcast, invite or access
grant. Replies and attachments retain original attribution and a stable
correlation key; ambiguous matches require review and private replies are never
automatically shared with other participants.

Implemented source paths are Task-field validation, current-Workspace reads,
progressive detail UI, receipt-verified review transitions and receipt-verified
draft approval. Unsupported paths are Task/draft creation in this surface,
native attachment upload here, email send, reply ingestion/correlation, hosted
permission behavior and production acceptance. Unsupported actions have no
mock-success control.
