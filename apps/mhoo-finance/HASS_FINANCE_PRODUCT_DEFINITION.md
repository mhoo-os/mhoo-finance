# Hass Finance product definition

Status: finalized product scope and local synthetic walkthrough, 2026-09-13. This document does not authorize live data access, provider grants, Workspace installation, deployment, financial decisions, or publication to the client.

ARCHITECTURE IMPACT: LOCAL

## Product promise

Hass Finance helps an authorized reviewer understand past financial evidence, review the present with visible uncertainty, and plan future scenarios from explicit assumptions. It is the first focused value inside the broader Hass Workspace; the Workspace also owns people, permissions, connections, records and collaboration.

Finance never makes disagreeing sources look tidy by changing their facts. It preserves each source, explains the difference, proposes bounded deterministic matches, and gives a human the final review decision.

## Current capability and gap map

| Capability                                                               | Actual state                                                                                                                              | Gap before a real Hass result                                                                                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Native Finance objects, views, navigation and sample evidence inspection | Merged source exists in this repository. Accepted receipts record a bounded installed sample reader and transaction-to-source inspection. | Fresh restricted-role, cross-Workspace, original-File and eligible-population acceptance are not proved by this work.                           |
| Exact money, immutable snapshot and bounded read contracts               | Merged source and synthetic tests exist. Duplicate acquisitions, stale responses and scope-bound reads fail closed.                       | Durable authorized `SourceSnapshot` publication/currentness and native client/permission binding remain open under MHO-124 → MHO-128 → MHO-135. |
| Question → chart → transaction → source                                  | Local React walkthrough exists and uses deterministic invented fixtures.                                                                  | It is not a live agent, installed Workspace journey, provider read or production UI acceptance.                                                 |
| Bank / statement intake                                                  | Governed CSV/QFX/PDF fixture validation and import contracts exist.                                                                       | No complete Hass statement inventory, original-file custody, statement-balance controls or approved live import exists.                         |
| Plaid evidence                                                           | Export validation and recorded recent-source inventory exist outside this walkthrough.                                                    | No live Workspace Plaid connection, transformation attestation, six-year completeness or amount-sign provenance is proved.                      |
| Clover                                                                   | A separate native Clover App owns connection custody and provider records; current source includes bounded read-only primitives.          | Finance consumer mapping, merchant/location scope, complete historical reach, settlement coverage and live activation remain separate gates.    |
| Tax returns                                                              | Product treatment is defined below and represented only as an invented walkthrough source card.                                           | No reviewed Hass return package, filing basis, amendment history or accountant-approved interpretation is present here.                         |
| Email invoices, vendors and payment evidence                             | Product treatment is defined below and represented only as invented excerpts.                                                             | CRM email sync is not a complete mailbox, invoice archive, vendor master or payment proof. No mailbox import or new email scope is authorized.  |
| Forecasting and planning                                                 | Assumption-first experience is defined and visible in the walkthrough.                                                                    | No real forecast is calculated. Reviewed actuals, coverage, basis and approved scenario assumptions are prerequisites.                          |

The current Linear truth is deliberately mixed: MHO-146 is Done for its bounded local fixture-first slice; MHO-123, MHO-124, MHO-135 and the parent product issue MHO-7 remain In Progress. Source completion is not installed, live-data, runtime, release or client acceptance.

## Who it is for

- Owner or finance reviewer: asks questions, inspects evidence, records classifications and resolves proposed matches.
- Accountant or advisor: reviews exported evidence and limitations; their professional judgment is not replaced by the product.
- Workspace operator: manages membership, source connections and retention under Twenty-owned identity and permission controls.
- Agent: selects and explains authorized tools. It cannot invent totals, broaden scope, publish findings or resolve uncertainty.

Finance operates as bookkeeping support and a bounded management
investigation/reconciliation system. Each run must declare `engagementMode`
(`BOOKKEEPING_SUPPORT`, `MANAGEMENT_INVESTIGATION` or
`PROFESSIONAL_SUPPORT_PACKET`), intended use/users and decision, entity/period/
basis/authority scope, and prohibited outputs. An external
`professionalEngagementRef` is recorded only when a qualified professional
supplies it. Finance does not perform or issue an audit, review, AUP, tax
opinion, legal conclusion or forensic finding. Conclusion-seeking prompts are
converted to neutral evidence questions or stopped with
`QUALIFIED_PROFESSIONAL_REQUIRED`.

## One review, independent sources

Every source enters through an acquisition receipt and retains its own source identity, period, effective/observed time, revision, original values, provenance and coverage state.

| Source                 | Required facts                                                                                                                                     | Important separation                                                                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tax return             | entity, tax year, form/version, filed/amended status, filing date, accounting basis when evidenced, source artifact                                | A filed tax period is not silently converted into a calendar, operating or management-report period. Return totals are historical assertions, not current bank or sales activity. |
| Bank statement/export  | masked account, statement period, opening/closing controls, transaction/posting dates, amount/currency/sign, row/page reference                    | A Plaid/export row is not a bank-issued statement control. Pending and posted rows remain distinct.                                                                               |
| Plaid export/connector | item/account identity, export/acquisition time, transaction ID, pending-to-posted/revision/removal state, transformation provenance                | `100% of received rows` does not mean `100% of business activity`. Combined and account exports cannot be double counted.                                                         |
| Clover                 | merchant/location, sale/payment/refund/fee/settlement identity, source/effective/observed times, amount/currency/sign and acquisition limits       | Sale date, tender date and bank settlement date are separate. Gross sales do not equal net deposits. Clover retains connection and provider-record custody.                       |
| Email/document         | message/document identity, sender/recipient, document date, vendor/customer identity, invoice number, amount/currency, attachment/source reference | Message receipt is not proof of delivery, invoice validity, goods received or payment. CRM sync is not complete audit evidence.                                                   |

Coverage uses explicit states: `PROVEN_COMPLETE`, `SOURCE_COMPLETE_UNRECONCILED`, `PARTIAL`, `MISSING`, `OUT_OF_SCOPE` and `SUPERSEDED`. Missing evidence never becomes zero activity.

Every completeness claim names its entity/account/merchant population,
period/timezone/basis, acquisition and authority receipt, content hash and exact
locator, expected/observed population, continuity/balance/pagination tests,
gaps/exclusions, lifecycle state and reviewer/time. `PROVEN_COMPLETE` is invalid
without a passed named-population procedure. Complete received rows never imply
complete business activity.

Coverage, claim and workflow are independent axes. Claim state is `OBSERVED`,
`DERIVED`, `SUPPORTED`, `CONTRADICTED`, `UNRESOLVED` or
`EXTERNAL_PROFESSIONAL_CONCLUSION`; workflow is `NEW`, `INVESTIGATING`,
`EVIDENCE_REQUESTED`, `HUMAN_REVIEW`, `DISPOSED` or `REOPENED`. An external
professional conclusion must link its immutable report and issuer; Finance
cannot author it or compress the three axes into one confidence score.

## Period and basis rules

Every result must state:

1. examined source periods and their actual coverage;
2. transaction, sale, settlement, invoice, payment and filing dates used;
3. calendar, fiscal, tax, cash or accrual basis only when supported or deliberately selected;
4. snapshot/as-of time and source revisions;
5. currency, sign convention, eligible population and exclusions.

The engagement planning horizon is approximately 2020–2026. It is not an exact six-year population. Current sample/export periods remain separate and must never be stretched to fill the horizon.

## Reconciliation rules

1. **Duplicates:** exact source/revision/content identities suppress repeated acquisitions while keeping every receipt. Similar descriptions or amounts only create a candidate.
2. **Transfers and card payments:** match both sides using owned-account scope, opposite signs, currency, date window and amount tolerance. Matched internal movement is excluded from revenue/expense. One-sided evidence stays unclassified.
3. **Refunds, voids and fees:** keep them as separate facts. Never net them away before explaining a Clover settlement or bank deposit.
4. **Clover settlements:** reconcile gross sales, discounts, refunds, tips/tax when in scope and processor fees into the provider settlement, then compare that net settlement to bank candidates. Many-to-many groups retain every member and any difference.
5. **Invoices and payments:** use vendor, invoice/reference, amount/currency, date and evidence links to propose candidates. An email attachment may support an invoice; a bank debit may support payment. Neither alone resolves the other.
6. **Conflicts:** preserve contradictory values and their sources. The product may show possible explanations and request evidence; it cannot edit a source fact to force agreement.
7. **Human review:** uncertain candidates have `proposed`, `accepted`, `rejected` or `needs evidence` disposition with reviewer, time and evidence. No confidence score substitutes for the explanation.
8. **Match groups:** use `EXACT_ONE_TO_ONE`, `SPLIT_ONE_TO_MANY`,
   `BATCH_MANY_TO_ONE`, `MANY_TO_MANY`, `REVERSAL_OR_REPOST`,
   `CANDIDATE_ONLY` or `UNMATCHED`. Store member facts, debit/credit sums,
   residual cents, timing, rule version, excluded candidates, alternatives and
   disposition. A tie remains `AMBIGUOUS`.
9. **Owner/related-party flows:** record economic direction and confirmed
   endpoints separately from contribution, loan, repayment, interest,
   distribution, payroll, reimbursement, personal-expense or unresolved
   classification. A memo cannot decide accounting, tax or legal treatment.
10. **Thresholds:** matching tolerance never changes source money; a management
    review threshold cannot suppress duplicates, contradictions, related-party
    items or coverage gaps; professional materiality requires a named external
    engagement, basis and approver.

Source, derived fact, hypothesis, human disposition and linked external
professional conclusion remain distinct. A contradiction retains its assertion,
all conflicting facts, monetary/period effect, alternatives, procedure and next
evidence request. New evidence reopens and appends; it never overwrites the
prior disposition.

## Experience: past → present → future

### 1. Understand the past

Build a source-by-period map for tax returns, bank/Plaid activity, Clover sales/settlements and invoice/vendor evidence. Show what is present, missing, partial, stale, superseded or outside scope. Import and normalization receipts remain inspectable.

### 2. Review the present

The reviewer asks a bounded question. One account/period/snapshot/filter context drives the answer, chart, contributing transactions and exact source trail. A deterministic procedure supplies arithmetic and exclusions. The screen shows supporting and contradictory evidence, uncertainty and the next allowed action. Scope changes clear incompatible selections and late results cannot replace the active result. An evidence request names the exact assertion and amount/period, live alternatives, smallest useful artifact or field and why it discriminates, owner/due date, authority/privacy boundary and result—including when the request could not establish the fact.

### 3. Plan the future

Planning starts from a named, reviewed actuals baseline. Each scenario records assumption name, value, unit, author, effective/as-of date, version and rationale. Revenue, fixed/variable costs, refunds, fees, timing, seasonality and source-coverage sensitivity remain separate. Outputs are scenarios, not promises, tax advice or financing decisions. If the baseline, basis or assumptions are not eligible, the forecast is withheld.

Historical-to-ongoing use requires an immutable cutoff receipt naming date,
source periods, opening balances, basis, unresolved carry-forwards, reviewer and
report hash. Planning inputs keep `ACTUAL_REVIEWED`, `ACTUAL_PARTIAL` and
`FORECAST_ASSUMPTION` separate. A reopened prior-period fact invalidates the
affected close receipt; partial actuals become an explicit range or block the
baseline, never zero.

## Acceptance criteria

### Evidence and arithmetic

- [ ] Every amount uses exact money with currency and sign semantics; no floating-point financial arithmetic.
- [ ] Every result names scope, periods, basis, snapshot, population, exclusions, coverage and provenance.
- [ ] Tax, bank/Plaid, Clover and email/document facts retain independent periods and source identities.
- [ ] Duplicates, corrections and retries are deterministic and replayable without changing accepted totals.
- [ ] Transfers/card payments, refunds, fees and settlement groups cannot be double counted.
- [ ] Missing, stale, denied and failed evidence returns no broader fallback and no invented replacement.

### Matching and review

- [ ] Exact matches explain the applied rule and evidence.
- [ ] Candidate matches expose competing/contradictory evidence and never force agreement.
- [ ] Uncertain invoice/payment and many-to-many settlement candidates require human disposition.
- [ ] No exception is described as fraud, audit finding, tax conclusion or assurance without the separately required professional process.
- [ ] A reviewer can reproduce every result from retained source and procedure versions.

### Product and permissions

- [ ] The same authorized context drives conversation, chart, transactions, evidence and export.
- [ ] All critical review steps work through explicit controls when agents are disabled.
- [ ] Twenty Workspace identity, role, row, field, Files, connection and credential boundaries are enforced; Finance owns no second identity or credential store.
- [ ] Clover credentials remain in the Clover/Twenty connection boundary and are never exposed to Finance or the UI.
- [ ] Email/CRM visibility never claims complete mailbox or audit-evidence coverage.

### Planning

- [ ] Forecasts require a reviewed actuals baseline and versioned human-authored assumptions.
- [ ] Scenario, forecast and actual values are visibly distinct.
- [ ] Basis, coverage and assumption changes invalidate stale outputs.
- [ ] No scenario is presented as a guaranteed outcome or financial decision.

### Walkthrough and release boundary

- [ ] Desktop and 390px mobile views show the history, present-review and future-planning story without horizontal overflow.
- [ ] The local walkthrough visibly labels every fixture and simulation and exercises ready, empty, missing, denied, failed and stale states.
- [ ] A clickable chart selection opens only its contributing rows; a row opens only its matching synthetic source trace.
- [ ] Local/source proof remains separate from native installed, permission, provider, production and client acceptance.
- [ ] Native Finance navigation lists Overview, Accounts, Transactions and Statements in that order, and every route renders the designed Finance surface rather than a raw table.
- [ ] Follow-ups is an additional native page after the four core pages and reuses Twenty Tasks; its list shows only question, state, owner and next action, while People, evidence and email open progressively in a full detail surface.
- [ ] Follow-up subjects may reference one or more transactions or missing statement periods. People retain explicit roles and recipient selection without gaining membership or Finance access.
- [ ] Email review shows authorized mailbox label, selected recipients, body and attachments before approval; approved, sent, replied, Task Done and reconciled are never treated as synonyms.
- [ ] Hosted Finance uses current Workspace records by default; synthetic fixtures are isolated to an explicit test/preview adapter and never become a fallback.
- [ ] The selected inclusive interval and a separately zoomable/scrollable timeline support cross-year and multi-year history without resetting at January.
- [ ] Explicit evidence-link review actions append receipt-verified Workspace events; unlink/restore never delete originals or change income/expense classification.

## Follow-up implementation boundary — source candidate

Native Task fields now carry validated Finance state, subjects, People context,
findings, evidence references, draft-email preview, correlation and append
history. User-scoped state transitions and `APPROVED_NOT_SENT` updates require a
matching read-back receipt. The app deliberately has no email send path. Native
Task attachments remain the authorized upload surface; creating/editing drafts,
uploading files in this custom surface, inviting People, mailbox-scope changes,
reply ingestion/correlation and hosted permission proof are still unsupported.

## Explicitly out of scope for this slice

Live Hass bank, Plaid, Clover, email or customer import; new OAuth scopes; credential changes; Workspace role changes; production deployment; publication into the live welcome guide; automated classification or finding approval; tax preparation/advice; money movement; legal/audit certification; retention or contract commitments.

## Remaining factual and commitment decisions

Before the first live source: current client authority and executed engagement evidence; masked source/account/merchant inventory; exact acquisition periods; reviewer/recipient roles; retention/deletion/export/legal-hold terms; report language; original-file custody; accountant-approved accounting/tax basis where needed; accepted storage/recovery verdict; and the exact Finance consumer contract from the Clover owner.
