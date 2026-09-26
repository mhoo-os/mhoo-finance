# Professional investigation method acceptance map

## Approved Finance investigation UI source update — 2026-09-15 Asia/Bangkok

Scoped source-only UI receipt for Delivery Room job
`finance-investigation-ui-release-20260914` / MHO-7. The clean isolated
baseline is `724b83a993857644c9bdf81bca95bbd1c07c8610`. The approved visual
references were reviewed from `finance-demo/insights.tsx`
(`90c90de071a8dbdef434580439cc744ae74d03b50c7eb6376dd1635f0bfba6a8`) and
`finance-demo/insights.css`
(`eb76d7c144d73b7084b91342188508ae1d041296a0e8cb49272d02f6288e9a55`).

- `src/components/finance-workspace.tsx` now uses the approved spacious
  white/lavender investigation treatment across the record-backed Overview,
  Accounts, Transactions, Statements and Follow-ups screens. Overview keeps
  the supported timeline controls, compact date disclosure, selectable month
  columns, narrative net panel, in/out bars and exact-money display helpers.
- Totals continue to use the existing eligible-record rule
  (`includedInTotals` with only `SUPERSEDED` withheld), aggregate currency and
  bigint money guards. The visual chart never changes inclusion, status,
  truncation, currency or source-evidence behavior.
- Synthetic data overrides now leave evidence history idle and do not issue a
  Workspace evidence-history request. Workspace reads remain the only live
  path; synthetic follow-up and evidence actions remain read-only.
- Checks rerun because this source changed: `yarn typecheck`, `yarn lint`, and
  `yarn test:unit src/__tests__/finance-workspace.test.ts` passed on
  2026-09-15 (9 focused tests). No App sync, install, provider operation,
  send, deploy, merge or production mutation occurred.

## Installation attempt cancelled; credential cleanup verified — 2026-09-14

Guide owner requested cancellation in favor of the automatic popup deployment;
Oracle owner also requested closure for the authorized recovery capture window.
Finance serialization hold is explicitly released, with all further App actions
held until recovery releases its window.

- Temporary key `ffff4b79-2677-4a0f-9f52-03a3fb070d6d` was revoked using the
  native key Delete confirmation. The post-action Hass API-key inventory is
  empty. The browser clipboard was cleared and generated-key tab closed.
- Hidden-input helper session `97517` was interrupted while still waiting in
  getpass, before any submitted input or SDK authLogin call; it exited with code
  1. Sanitized local configuration inspection confirms temporary CLI remote
  `finance-install-20260914` does not exist. No key was stored in CLI config.
- No CLI plan/apply/sync or watcher was started with that key. No Finance host
  operation was started or delegated. No installation, role change, customer
  import, provider/mailbox operation or send occurred. Accepted implementation
  `f87cfc5296bcb036f79eaac6581b77cab9d6d0c1` remains unchanged.
- Oracle owner, guide owner and coordinator received exact closed/revoked
  handback. The earlier manual-paste request is cancelled. No further token
  input should be supplied. Earlier active-key notes are historical and are
  superseded by this cleanup receipt.

Runtime acceptance remains incomplete, with the same App-role, rollback,
immutable event actor, Files, Remote DOM and identity/persistence gates. Resume
only in a later serialized window; do not silently create a replacement key.

## Approved key custody pending local paste — 2026-09-14 05:48 Bangkok

Oracle owner explicitly released the Finance App-only maintenance hold after
server replacement verification. Guide host-deployment lane was notified that
the Finance key/plan window is active; this lead performs no host operations.

One explicitly approved temporary Hass Kitchen key was created through native
Workspace settings: `ffff4b79-2677-4a0f-9f52-03a3fb070d6d`, display name
`Finance install temporary 2026-09-14`, Admin role, minimum native 15-day expiry.
Key-page observations suppressed all key values; only safe controls/record ID
were read. Native Copy succeeded. No value appears in source, logs or messages.

Computer-use rejected native Terminal control "for safety reasons". No alternate
automation bypass was attempted. The user must paste the key into the prepared
hidden-input Codex terminal session `97517` and press Return, never into chat.
The supported SDK helper will save/verify a separate `finance-install-20260914`
remote. Browser tab `4` and terminal panels are queued on this installation task;
the generated-key browser tab is retained for the user handoff. No CLI plan/apply
has run with this key yet. Coordinator received the exact manual custody step.

**Cleanup pending:** this key is currently active and must be revoked, with
verification, immediately after use or if this installation attempt is abandoned.
Do not create a second key. App-role expansion remains unauthorized. Earlier
"no key created" entries are historical observations superseded by this receipt.

## Temporary API-key fallback inspection — 2026-09-14

Subsequent exact approval: coordinator asked the user to approve a temporary
Admin key for Finance installation, revoked immediately afterward, after Oracle
maintenance; user replied `Approve`. One key is now authorized with the shortest
native 15-day expiration cap, immediate revocation on completion or abandonment,
and no use beyond this Finance installation. No key has yet been created.
Mutations remain held for Oracle owner's explicit safe-window acknowledgment.
A local non-secret helper uses hidden terminal input and SDK authLogin to a
separate `finance-install-20260914` remote; it logs only fixed result messages.
The existing production/default remotes will not receive this temporary key.

Coordinator relayed explicit user approval to obtain a narrowly scoped temporary
Workspace API key for Hass Finance installation/testing, preferably existing,
with minimum scope/expiry and revocation after use. No App role expansion or
Oracle/server work was authorized to this lead. Oracle maintenance belongs only
to `01a09b1a-36a5-7390-9821-1451d907d312`; this lead has performed or delegated
no host operations and requested a safe timing acknowledgment before mutations.

Fresh native UI at Hass Kitchen Settings → MCP & APIs → API lists no existing
keys. The new-key form exposes only `Admin` and `WhatsApp function role` as
assignable roles; expiration options start at `15 days` and default to `Never`.
The form was inspected and cancelled unsaved. No key, grant, role, token export,
plan/apply or customer/provider operation occurred.

The coordinator received the concrete mismatch: there is no available narrow
Finance installer key. A temporary Admin-scoped key with immediate revocation
and a 15-day expiry cap needs explicit scope approval; an Applications-only
installer role would instead require separately authorized role creation and
verification that it supports the exact CLI operations. Neither choice was
silently selected. Oracle's maintenance completion is a separate timing gate.
Candidate App Task/People/Note permission and rollback prerequisites remain
unchanged. This note supersedes the earlier blanket no-new-key authority only
for the approved narrow temporary fallback; no credential has yet been created.

## Installed-target discovery — 2026-09-14 05:18 Bangkok

Installation remains **NOT APPLIED**; real Follow-ups functional acceptance is
**NOT PROVEN**. Sole retained runtime lead is
`01a09cd2-9ab9-76a3-97d4-37d2300a65a8`, same `finance-native-review-ui` and
MHO-7/MHO-135/MHO-146. Both handoff acknowledgments were received; Delivery Room
ownership transferred with revision 14 → 15, preserving previous source leads.
Accepted implementation remains `f87cfc5296bcb036f79eaac6581b77cab9d6d0c1`;
`7fb2950bc6f24d719a68375f7b861b41da225d5c` adds handoff documentation only.
No unchanged test/build suites were repeated. Source custody was checked once
against the accepted implementation and passed.

Fresh observations (not inferred from prior installation receipts):

- Existing browser session at `https://hass-kitchen.mhoo.app` displays Hass
  Kitchen and native profile Tanyawit Nilnavarat. Members lists two existing
  accounts; no second session or allowed/denied role execution was established.
  Guide owner supplied retained Workspace key `ws_be7c8bf326d474ab745cfbd1`;
  that key is not independently verified as the native Twenty UUID.
- Native Installed Apps shows Mhoo Finance, Local, version 0.1.0, application
  ID `31a2ddce-fc04-4278-b3a9-1b2080dc830f`, six objects, two fields, one logic
  function and one front component. Its Permissions panel displays no
  object-level permissions and disabled/off global settings/actions. This is a
  UI observation of the older installation, not a tested effective-role receipt
  or proof of its exact source/build checksum.
- Existing CLI `production` pointed at `https://hass.mhoo.app`, which failed
  both browser and OS DNS. Coordinator supplied the working current host.
  Using exported SDK ConfigService, only that remote's apiUrl was corrected to
  `https://hass-kitchen.mhoo.app`; the default remote and credentials were
  retained. Previous URL is recorded here for configuration rollback. No
  browser sessions or tokens were extracted or copied.
- Pinned CLI `twenty -r production remote:status` on the corrected target
  reports OAuth invalid. `twenty -r production plan` exits 1 at server/auth
  preflight: `Authentication failed. Run yarn twenty remote:add to authenticate.`
  It never reaches manifest build or a metadata change plan.
- Supported SDK `authLoginOAuth` against the correct host returns
  `OAUTH_NOT_SUPPORTED`: server does not expose a CLI client ID. Read-only
  discovery confirms HTTP 200, issuer and authorize/token endpoints on
  `hass-kitchen.mhoo.app`, and absent `cli_client_id`. This attempt stopped
  before a browser grant or token write. No API key was created as a workaround.
- Existing local remote `http://localhost:2020` cannot connect; no disposable
  Workspace was verified or created. No dev watcher was started.

Smallest remaining decisions and prerequisites:

1. Runtime custodian must establish a compatible existing CLI authentication
   route/registration and the installed Finance rollback artifact. Neither is
   known by the guide owner. A new API key or OAuth grant needs exact authority;
   routine browser sign-in alone cannot repair the missing CLI client discovery.
2. Obtain the actual CLI metadata plan before apply. Accepted candidate's
   default App role denies native Task writes and lacks People/Note reads, so
   an existing user writer alone cannot be assumed sufficient. A proposed
   change must explicitly scope Task writes to Finance rows and required fields,
   plus bounded People/Note reads, preserve caller-role intersection, and retain
   the shipped reviewer read-only policy. No role change is authorized here.
3. Immutable per-event actor history remains unimplemented/unproved in the
   Follow-ups Task JSON path. A successful install would not close this gate.
   Real Files, Remote DOM, persistence/reload, scope and allowed/denied identity
   receipts remain outstanding.

Clover guide/runtime owner `01a09b1b-2239-7c80-b4e0-6e014cef51a5` confirmed no
concurrent sync/deploy and was notified that Finance has no active apply window.
Future shared-host mutations must serialize with that owner and recovery custody.
Coordinator was notified of the actual CLI boundary and permission finding.
Routing class: consequential authorization/runtime integration; Astra high is
the reference's review candidate, while actual inherited setting is not
independently observed here. No model interruption or cost claim was made.
No App apply/install, grant, customer import, provider/mailbox access, send,
host rollout, push or merge occurred. Linear milestone reconciliation remains
with the coordinator; no Linear connector is available in this task.

## Installation lead handoff — 2026-09-14

### Hass install-plan repair — 2026-09-14 11:45 Asia/Bangkok

At source head `174205136a73d90349154b0f9530b9576e2e29e5` plus the five
uncommitted declaration changes below, `yarn twenty plan` on authenticated
`finance-install-20260914` failed with 11 metadata validation errors. Renaming
two reserved `currency` field names to `currencyCode` and removing a comma from
the Task approval option label eliminated nine errors. The remaining two were
navigation items whose layout references were valid UUIDs in the built manifest;
using fresh, stable navigation identifiers eliminated those plan errors. This
is consistent with an existing-metadata identifier collision, but the cause
has not been confirmed from server-side state. A read-only plan now succeeds:
384 add, 6 change, 10 destroy. Its removals include five old Finance navigation
items and five old overview layout/tab/widgets; no change was applied. The
native `yarn twenty dev:typecheck`, `yarn lint`, and focused
`workspace-preparation.test.ts` (6 tests) passed; `git diff --check` passed.
This is source and plan evidence only, not an installed or rollback receipt.
Next: preserve/recover the installed older Finance revision and review all
destructive plan entries before an authorized `apply`; do not use `--force`.

### Deploy verification — 2026-09-14 11:53 Asia/Bangkok

User authorized verification followed by deployment. A read-only `/metadata`
`findManyApplications` query on Hass confirmed installed `Mhoo Finance` v0.1.0,
application ID `31a2ddce-fc04-4278-b3a9-1b2080dc830f`, universal ID
`ad100496-8c49-4453-9814-886ac4064d4c`. The record reports null
`packageJsonFileId` and `yarnLockFileId`; it does not provide a recoverable
old-App package. The latest successful CLI plan still proposes 384 creates,
6 updates and 10 destroys, including five old Finance navigation entries and
five overview layout pieces. Infrastructure's current-generation independent
backup/restore evidence was not found in the inspected recovery handoff; its
Sept 13 procedure explicitly listed that custody as unproved. Therefore no
`apply` or `install` was run. Preserve the installed revision and obtain a
verified rollback/restore artifact before this destructive Workspace upgrade.

### Hass Finance sync — 2026-09-14 11:59 Asia/Bangkok

Moo explicitly directed deployment after the rollback gap was reported.
`yarn twenty remote:status` verified `finance-install-20260914` as a valid
API-key remote for `https://hass-kitchen.mhoo.app`; `git diff --check` passed.
The reviewed read-only plan was 384 create, 6 update and 10 destroy, with
Finance-scoped role changes and no broad native Task-write grant. From source
head `174205136a73d90349154b0f9530b9576e2e29e5` plus this repair diff,
`yarn twenty apply` exited 0 and reported `Synced Mhoo Finance (14 files)`.
The built manifest SHA-256 is
`3a4603d3eef15e988a4123cbbdc72e44c97c0fb07116c0476d1617d9f74b453b`.
A subsequent read-only `yarn twenty plan` exited 0 with `No changes. Twenty
metadata matches your manifest.` A live `/metadata` read confirmed the same
application ID `31a2ddce-fc04-4278-b3a9-1b2080dc830f` and Finance folder plus
Overview, Accounts, Transactions, Statements and Follow-ups PAGE_LAYOUT
navigation, each with a page layout ID. The App remains version 0.1.0 in the
Workspace record. No separate `app:install`, provider read, customer import or
email send was performed. This proves live metadata sync, not browser rendering,
effective-role behavior, runtime logic or rollback readiness. The old-version
rollback remains unverified and the user accepted that risk for this apply.

### Live Finance read repair — 2026-09-14 12:08 Asia/Bangkok

The post-sync browser audit found all five Finance pages failing their shared
read. The browser `/graphql` response was HTTP 200 but its `tasks` field was
null with `INTERNAL_SERVER_ERROR`: `MHOO_FINANCE_V1` was not valid JSON.
Accounts, Finance facts and source artifacts each returned zero edges without
errors. Exact v2.37 source shows SELECT row filters parse an array of strings;
the two App Task row predicates instead supplied a bare string. Both predicate
values were changed in source from `MHOO_FINANCE_V1` to
`["MHOO_FINANCE_V1"]`, retaining their identifiers, operands, scope and roles.
Focused `manifest.test.ts` (3 tests), `yarn twenty dev:typecheck`, `yarn lint`
and `git diff --check` passed. The authenticated Hass plan proposed 0 add,
2 in-place predicate-value changes and 0 destroy. `yarn twenty apply` exited 0
and reported `Synced Mhoo Finance (14 files)`; the subsequent plan reported no
changes. Built manifest SHA-256:
`4803321dc717fc906832c7ff42706077c4c3351eca558b61cf3eca5948fc0ce3`.
Installed browser reads now render Statements, Overview and Follow-ups empty
states rather than the error. No financial records, Task mutation, provider
access, email send, permission widening or rollback proof is claimed. Other
user roles and populated data remain untested.

Runtime owner is now `01a09cd2-9ab9-76a3-97d4-37d2300a65a8`, with actual incoming
acknowledgment and outgoing custody acknowledgment on this date. Coordinator
remains `01a09c1e-fcec-7721-bafe-fd0ec677127c`; same Delivery Room job and issues.
Outgoing source lead `01a09cb1-b6c6-73b3-84c2-a167ea0c0ceb` owns no runtime edits,
CLI watcher, apply, install, role change or live Workspace operation. The only
retained process is synthetic loopback preview PID 97526, port 4347.

User now authorizes installation/testing and explicitly prefers Twenty CLI sync.
This supersedes the earlier no-install hold for this bounded gate only. Prefer
an existing disposable/test Workspace before Hass; do not create one silently.
Inspect configured remote, installed App/host compatibility and effective roles;
preserve installed working revision and a verified rollback path. Use the pinned
CLI's `yarn twenty plan` then reviewed `yarn twenty apply` for shared Hass;
`yarn twenty dev` is appropriate only with one sync owner on a verified test
Workspace. No `--force`, new grants, customer PDF imports, provider/mailbox reads,
email sends, unrelated host changes, auto merge or blind push. Dev sync does not
run install hooks; inspect whether a separate governed hook path is needed.

Accepted source: `f87cfc5296bcb036f79eaac6581b77cab9d6d0c1`, tree
`2be1697914916a4a6dddbadef8ceedb37ceee812`, branch
`codex/finance-follow-up-mutation`, retained source worktree recorded by its owner.
App root `packages/twenty-apps/internal/mhoo-finance`, `@mhoo/finance` 0.1.0,
application UID `ad100496-8c49-4453-9814-886ac4064d4c`. Both installed SDK/client
package metadata are 2.37.0; manifest requires server 2.37.0. Source provenance
pins upstream `6da524b8903ec16a3eeea4b2e4a5fb63dbfc1c58` via `.twenty-source`.
Reuse 51 focused test receipts, build/typecheck/lint, custody/trajectory, exact-head
independent review, desktop/mobile and complete local synthetic workflow proof.

Existing built output is `.twenty/output` (local build, not installed):
- manifest SHA-256 `efca5a8fbff7e48f2fd5e984d9cfa9710ce5f046decfda2021bdeae5f2642edc`;
- package.json SHA-256 `ba2f6eddf71f741ccb5719d47cd91162baea29ba9fbaf3c877076b2693a66460`;
- source yarn.lock SHA-256 `214db49994e0accaa49d2ed2567a39ad243af7a21d45ece63b6b32c6e555fdad`.
These hashes identify this retained build; inspect/review the actual CLI plan and
build input at the installation owner's checkout before synchronization.

Concrete authority gate found in the generated manifest: default App role
`a4c0b84d-a3cb-4cff-b1db-b555545e91f0` denies updates to native Task
`20202020-1ba1-48ba-bc83-ef7e5990ed10`, and has no People/Notes read entries.
The v2.37 authorization reference says the user token is user-role intersected
with App-role. Thus an existing user writer alone may not suffice. Verify actual
installed ceiling and metadata writability. If confirmed, present the smallest
scoped App Task-write/People-and-Note-read decision; do not grant admin rights or
change any role silently. The earlier suggestion that an existing writer alone
might suffice was unproved and is superseded by this explicit ceiling finding.

Current Hass host digest, installed App revision, CLI target, test Workspace,
allowed/denied identities and rollback artifact are **not verified here**. The
fresh installation lead owns that live discovery; no old receipt substitutes for
it. Governance read: lifecycle, workspace-operations and authorization SKILL.md
plus focused v2.37 references under the coordinating mhoo repository; auth-approval
and delivery-flow were also read. Work class is consequential authorization/runtime
validation; routing trial suggests Astra high review. Actual incoming model/effort
is coordinator-owned and unknown here; no override was made during active work.

## Current source workflow — 2026-09-14 continuation

ARCHITECTURE IMPACT: LOCAL. This section supersedes earlier read-only UI status
for native Task Follow-ups only. User explicitly resumed the functioning source
workflow from `5b58e0ee5889e201398d5bb30557b7e9e33b1ca7`; same owner, worktree,
branch, MHO-7/MHO-135/MHO-146 and Delivery Room `finance-native-review-ui`.

Implemented and wired to the actual Finance UI:

- Create one native Task from a readable active transaction and a neutral question.
  The caller's existing native Task permission is required. An uncertain creation
  retains its UUID and exact request; receipt verification precedes success.
- Choose a readable existing Person (bounded first 50), record their role and
  explicit recipient selection without invitation or a grant.
- Submit an explicitly unverified explanation shared with Task readers, or attach
  a retained SourceArtifact reference after checking readable ID, hash and status.
  These are reference attachments, not new uploaded bytes or original Files proof.
- Persist exact sender label, recipients, subject, body and source-reference
  attachments; reset approval on edits; approve only the reloaded stored draft.
  `APPROVED_NOT_SENT` has no mailbox or send effect. Sender label is not mailbox
  authorization. Recipients do not acquire source access from a draft reference.
- Manually propose a readable native Note as a reply reference, confirming the
  exact Task key and explicit sharing. Note content is not copied; mailbox origin
  remains unverified. Accept only the selected evidence kind/reference pair.
- Review/resolve/reopen native Task state with no reconciliation effect. Resolved
  Tasks must reopen before changing evidence or a request. Reload and denial/error
  controls are visible; failed writes are not optimistically displayed as saved.

All writes use native caller-scoped REST permissions; role manifests, application
writer and public event routes are unchanged. Generic Task permissions remain the
host authority. Client validation is not an independent security boundary or an
immutable ledger. Native Task createdBy/updatedBy describe host record activity;
Task JSON history does not prove durable per-event actor/time immutability or
importer/reviewer segregation. Source reference/hash provenance and user assertions
stay distinct. Same-millisecond edits outside financeRevision remain a concurrency
limit. Runtime authorization is not inferred from the SDK runAs option.

Verification: 51 focused tests across workflow, existing Task adapter, read adapter
and follow-up contract; changed-file lint, test-project typecheck and native App
build. Baseline 271-test/build/UI receipts are reused for unchanged behavior.
Independent source review accepted the corrected workflow: exact evidence identity,
full-list review, uncertain creation custody, stored approval and visible failures.
Final review caught and fixed a static-sample Reload action that could invoke the
Workspace reader; both the control and handler now preserve sample isolation.
The previously suspected second-create defect was withdrawn after verifying the
create form unmounts; explicit reset is retained defensively.

Local browser proof uses `node scripts/preview-follow-up-workflow.mjs`, loopback
port 4347. It renders the real UI and actual REST adapters against the explicit
synthetic transport under `src/__tests__/fixtures/follow-up-test-host.ts`; local
browser storage retains only synthetic Tasks across reload. Verified creation,
Person choice, explanation, hash-backed attachment, exact multiline draft,
approved-not-sent persistence after reload, explicit reply linking, denied review
with unchanged evidence, successful review, resolution and a second distinct Task.
Desktop light and 390px dark forms were inspected; document width equals 390px.
This preview is not a Twenty installation or a hosted authorization receipt.

Exact remaining runtime gate: separately authorized disposable-Workspace install
and allowed/denied identities across Task, Person, SourceArtifact and Note access;
real REST create/update/readback, scope switching, persistence after reload and
concurrency, native Files availability, Remote DOM form behavior and dark theme.
The shipped Finance reviewer remains read-only: it should deny these writes until
a separately authorized native role policy permits them. No new grant is made by
this source increment. Immutable investigation-event persistence and per-event
host actor custody remain separate unimplemented acceptance requirements.
Provider ingestion, mailbox reply ingestion, sending, live customer PDFs, grants,
install/deployment/merge/push remain outside this assignment. No external gate is
reported as passed. Coordinator owns those decisions; no duplicate lead exists.

## Bounded lead handoff — 2026-09-14

Delivery Room `finance-native-review-ui`, primary MHO-7, related MHO-135/MHO-146.
New retained lead: `01a09cb1-b6c6-73b3-84c2-a167ea0c0ceb`; coordinator:
`01a09c1e-fcec-7721-bafe-fd0ec677127c`. Previous lead
`01a09b96-78c7-7362-a9b2-c8142cdf1261` remains in job history and is not archived
because its other Clover ownership has not been checked.

At the time of this historical handoff, implementation remained in
`mhoo-os/mhoo-twenty-next`, retained source worktree, branch
`codex/finance-follow-up-mutation`, based directly on accepted commit
`86ee71aaa38d7b64fc1d361150c58cc69ca28c1c`, tree
`7c2797a58a9d3f13ab700bb1e5b8bf8c827543a0`. Instructions read through
`AGENTS.md` → `CLAUDE.md` at that commit, plus delivery-flow. This file and
`INVESTIGATION_UI.md` retain the acceptance/run ledger. No PR or push in this handoff.
The product destination remains `mhoo-finance`; migration is
not part of this increment.

Accepted baseline receipts retained from the previous lead: 271 tests,
lint/typecheck/build/custody and three independent contract, permission/provenance,
and desktop/mobile reviews. They are inherited source evidence, not rerun or
installed proof. No workers or operations have been dispatched by the new lead.
Job lead association transferred with revision check 10 → 11.

Authorized next step: inspect Twenty's existing user-scoped, row-bounded route
and implement the smallest source-only follow-up mutation improvement with
changed-input tests. Installed authorization is still unproved; native Task
creation, evidence attachments, persisted approved-not-sent drafts, reply
correlation and provider ingestion remain open. The coordinator owns future
authority decisions. No live grants, 42 Hass PDF imports, provider connections,
email sending, install, deployment, merge or blind push. Preserve the read-only
UI until its actual mutation prerequisites are satisfied.

### First follow-up increment: exact native Task write bounds

The existing `workspace-finance-follow-ups.ts` adapter now rejects a Task outside
the exact `MHOO_FINANCE_V1` scope before either state or approval writes and in
the final receipt. Native PATCH filters bind ID, scope, revision and `updatedAt`
together (native date equality compares a one-millisecond range). Invalid/overflowing revisions and noncanonical freshness timestamps
are rejected before requests; native denials propagate without a retry under a
different identity. This closes an adapter gap for callers who already possess
native Task write permission; it grants none.

Inspected host path: `RestApiCoreController` uses JWT, Workspace and custom
permission guards; `RestApiUpdateManyHandler` carries the parsed filter and auth
context into `CommonUpdateManyQueryRunnerService`; the common base runner builds
the filtered mutation with native row-level permissions. The SDK's `runAs: user`
selects its normal token channel (with the SDK's existing API-key fallback when
that token is absent); no application writer or public Finance route is enabled.
Do not infer an installed end-user identity receipt from that SDK option.

Changed-input validation: 20 focused adapter tests pass, plus two-file lint and
App test-project typecheck. Dependencies are reused through an ignored local
node_modules symlink to the previous accepted worktree; tests execute this
worktree's source. Unchanged 271-test baseline, build and UI reviews are retained.
No UI changed. Task creation, attachments, exact draft-content persistence and
immutable actor attribution still need a separately reviewed implementation;
the legacy approval adapter is not acceptance of those features. Hosted route,
role and concurrency proof remain open. Independent source review accepted
`c5dac052ab` with no actionable regression: native REST retains row-level
permissions, and native DATE_TIME equality handles API millisecond precision.
The revision coordinates Finance writers; same-millisecond native edits that
do not advance financeRevision are not universally detected. This is not an
exact database-timestamp compare-and-swap. Source custody and trajectory checks
passed for the implementation commit; the final receipt-only commit repeats
those exact-head checks without rerunning unchanged tests.

ARCHITECTURE IMPACT: LOCAL

This checkpoint maps the professional-method research into the transitional
native Twenty Finance source. It is implementation evidence, not an audit, AUP,
tax opinion, forensic conclusion, provider authorization, or installed/runtime
acceptance.

## Research custody

The mapping was checked against the actual files owned by research task
`01a09baa-7b49-7e00-834a-1af9ac3ef22b` on 2026-09-14:

- owning repository commit
  `7e3af2e2db89e89453ac33cd3a303939f941244a` on
  `codex/finance-investigation-methods-research`;

- `PROFESSIONAL_FINANCIAL_INVESTIGATION_METHODS.md` — SHA-256
  `73b18cf7a0f2b3c3ffe12c3f8fc8c22fe13546e4b68d332c12d9c3ac35530982`
- `SKILL_BLUEPRINT.md` — SHA-256
  `0e512ca1f2a0865b18e6da73af25fc3f47fdbe51b543633f70caeda442121135`
- `PRD_DELTAS.md` — SHA-256
  `b0b46bd47b0abf1fdf74de085bcede25aa10a0ec9ee6ecf6aa1b290cfacfdde5`

Those research files are durably tracked in their owning repository and are
not copied into this repository. Their professional
and provider sources remain cited in the owning artifact. This checkpoint pins
the reviewed content while keeping research custody and product custody
separate.

## Research to executable evidence

| Research principle and source                                                                                                           | Applicable native fields / relations                                                                                                                                                | Implemented rule                                                                                                                                                                                                                                                                                                                                                             | Exact test or evidence                                                                                                                                                                                               | Status                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence sufficiency, appropriateness and exact provenance — research §§2.2–2.4; AICPA AU-C 500 adaptation                              | `SourceArtifact.contentHash`, period/account/acquisition/original Files; `FinanceFact.artifact`, source locator, original amount/sign/raw values; Task Finance evidence attribution | Originals remain related and immutable; current-Workspace rows expose exact artifact/source references; invalid evidence context is withheld; link decisions never change classification                                                                                                                                                                                     | `finance-contract.test.ts` “replays exact golden totals and immutable source lineage”; `sample-evidence.test.ts`; `workspace-finance-data.test.ts`; `workspace-evidence-decisions.test.ts`                           | Implemented for existing records; original-file availability and hosted permissions remain unproved                                                                                                  |
| Completeness is a named, tested claim; missing/access-denied/zero differ — research §§2.2, 6.1; AU-C 500 and IRS Pub. 583 adaptations   | Existing `CoveragePeriod` projection plus sealed completeness receipt and sequenced `FinanceInvestigationEvent`                                                                     | Impossible dates/timezones, inactive lifecycle, count mismatch, review-before-acquisition and unknown procedures cannot become `PROVEN_COMPLETE`. `evaluatePeriodCompleteness` derives an inclusive month series from one entity/account/population/timezone/basis scope and requires each complete receipt to span the exact calendar month; missing is never zero activity | `completeness-receipt.test.ts`; `professional-investigation.test.ts`; statement missing-page/balance/continuity cases                                                                                                | Source contract implemented; no live receipt is populated and hosted completeness remains open                                                                                                       |
| Duplicate, lifecycle and transfer controls before classification — research §3.1; IRS IRM and Plaid adaptations                         | `FinanceFact` revision/status/artifact/account; `SourceArtifact` hash/supersession; import receipts; evidence-link identifiers                                                      | Exact duplicate IDs retain both acquisition refs but prevent a second entry. Explicit opposite-direction, same-amount, different-owned-account transfer refs link without income/expense reclassification. Unknown direction remains unknown                                                                                                                                 | `finance-contract.test.ts` duplicate, pending/revision, removal and reconciliation cases; `statement-importer.test.ts`; `evidence-linking.test.ts`; `finance-workspace.test.ts` transfer and unknown-direction cases | Implemented for existing deterministic contracts; no claim of live Plaid counterparty or full provider lifecycle coverage                                                                            |
| Explainable matching, deterministic precedence and ambiguity — research §§3.3, 3.6                                                      | `FinanceMatchGroup`, `FinanceMatchMember`, pair/candidate evaluation and immutable review events                                                                                    | Currency and direction conflicts fail to review. Split, batch and many-to-many groups recompute exact bounded minor-unit totals and residuals; zero residual is insufficient without one shared explicit reference. Originals and alternatives remain                                                                                                                        | `evidence-linking.test.ts`; `professional-investigation.test.ts` split/batch/many-to-many and residual cases                                                                                                         | Source/domain and native object manifests implemented; persistence of group snapshots from an authorized population remains unproved                                                                 |
| Human disposition and reversible history — research §§2.3, 4–6; GAO control adaptation                                                  | Immutable `FinanceInvestigationRun`; append-only `FinanceInvestigationEvent`; read-only reviewer role; non-assignable application writer                                            | A unique aggregate/sequence index, expected-head check, server actor/time, strict per-event payload parser, create-only field locks and exact receipt define an append-only event contract. Contradictory new evidence reopens without erasing the disposition. The earlier public event route was removed because its aggregate authorization was not yet safe.             | `professional-investigation.test.ts`; `workspace-investigation-events.test.ts`; generated manifest role/RLS/field-lock checks                                                                                        | Source and manifest contract implemented; there is no public event mutation route, and installed actor-role segregation plus administrator-level immutability remain runtime gates                   |
| Evidence request uses the smallest useful request and preserves people/privacy boundaries — research §§3.3, 4 and Skill 7               | Native Task identity plus immutable evidence/draft/approval/reply events; People IDs and source references                                                                          | The reducer supports Task creation receipt, evidence attachment, selected-Person draft, `APPROVED_NOT_SENT`, state transition and attributed reply correlation. It exposes `sendAuthorized: false`; no send event or mailbox action exists                                                                                                                                   | `professional-investigation.test.ts`; `finance-follow-up-contract.test.ts`; current Follow-ups UI read/preview paths                                                                                                 | Domain events are implemented and the UI is visibly read-only. Native Task create/attachment/message writes and mailbox reply ingestion remain deliberately disabled pending installed authorization |
| Follow-up closure is workflow, not reconciliation proof — research §§4–6                                                                | Finance Task state and native Task status remain separate from Finance facts, evidence link status and reconciliation exceptions                                                    | Only `READY_FOR_REVIEW → RESOLVED` is allowed; reopening is explicit. `RESOLVED` maps to native Task `DONE` with constant `NO_RECONCILIATION_EFFECT`; neither a reply nor draft approval changes a financial fact or reconciliation state                                                                                                                                    | `finance-follow-up-contract.test.ts` status/effect and transition cases; `workspace-finance-follow-ups.test.ts` exact receipt tests                                                                                  | Implemented and source-verified; a future close receipt must still decide planning eligibility separately                                                                                            |
| Neutral questions; no product-authored blame, assurance or tax conclusion — research §§1.2, 3.5, 9; AICPA/ACFE/IRS boundary adaptations | Native Task title is retained by Twenty; the Finance read adapter supplies a routed display question and route state                                                                | Misconduct wording is displayed as a neutral scoped-movement question. Audit/AUP/tax/legal conclusion wording routes to qualified professional review. The original Task record is not overwritten                                                                                                                                                                           | `finance-follow-up-contract.test.ts` conclusion-routing matrix; `workspace-finance-data.test.ts`; UI warning path in `finance-workspace.tsx`                                                                         | Implemented for Follow-up display. A complete engagement-mode envelope, external professional report relation and repository-wide professional-language lint remain unimplemented                    |

Quantitative Workspace views fail closed: any paginated source result, mixed or unavailable currency, oversized fact, or overflowing directional sum withholds aggregate totals and the timeline chart. Individual facts render exact minor units with their own validated currency. The legacy Task mutation adapter now uses a filtered `financeRevision` compare-and-swap plus exact operation receipt, but the shipped reviewer role is read-only and Task rows are restricted by an exact `MHOO_FINANCE_V1` scope field rather than correlation-key substring matching. The UI visibly keeps Task and evidence actions disabled; it cannot treat that adapter as installed mutation authority. Evidence history refuses a full log before attempting another write.

## Explicit remaining requirements

The following research requirements are real but outside this candidate's
implemented contract. They must not be inferred from the UI, fixtures, fields,
or passing tests:

- persistence receipts for immutable run and match-group snapshots from an
  authorized Workspace population;
- live Plaid pending/posted/removed/replacement ingestion and nullable
  counterparty evidence (the reducer rejects self, nonexistent and invalid
  lifecycle transitions, but no provider population is connected);
- live Clover sale, tax, tip, charge, refund, adjustment, tender,
  batch-to-funding and bank inputs (the component bridge validates every known
  value, keeps cash out of card funding, exposes gaps plus contradictions and
  never upgrades arithmetic equality to reconciliation; no provider population
  is connected);
- owner/related-party economic-flow review and qualified classification;
- operational thresholds separated from external professional materiality;
- historical cutoff/monthly close receipts and reviewed/partial/assumption
  planning inputs;
- importer/proposer versus reviewer segregation proven from hosted identities;
- source preservation/legal-hold routing, external professional-report
  relation, and whole-product prohibited-conclusion lint;
- live provider reads, real customer imports, email sends, new OAuth/mailbox
  scopes, deployment, and installed production acceptance.

These are not silently deferred as “done.” The current install gate remains
closed. This source candidate proves native pages, current-Workspace reads,
permission/error behavior, timeline interaction, immutable event contracts and
bounded domain reducers. It does not expose an event mutation route and does
not yet prove installed event persistence, native Task creation/attachments,
provider populations, mailbox correlation or production acceptance.

## 2026-09-14 live visual preview receipt

On `codex/finance-follow-up-mutation` from source head
`1f066a79298606c8500bf46a64b1426616e14c13`, the installed Hass Kitchen
Finance UI was changed to expose an explicit, reversible `Preview sample data`
switch. It defaults to permission-checked Workspace reads; sample data is not
substituted automatically or written as Workspace records. Focused UI tests
(6 passed), lint (0 warnings/errors), App build (14 files), and `git diff
--check` passed. Read-only `yarn twenty plan --remote finance-install-20260914`
reported five front-component checksum updates, zero additions and zero
destructions. Reviewed `yarn twenty apply --remote finance-install-20260914`
reported `Synced Mhoo Finance (14 files)`.

At 2026-09-14 05:55 UTC, the in-app browser showed the installed Overview at
`https://hass-kitchen.mhoo.app/page/1f06ffee-22e3-4d0e-9620-f0df945799cf`.
Before switching, it showed current Workspace records with zero included facts.
After the explicit switch, the visible page showed `Synthetic test records ·
removable adapter`, 29 included records, USD 6,825 money in, USD 7,605 money
out, -USD 780 net movement, a rendered chart, and sample transaction rows.
This proves a visually working installed UI with labeled synthetic sample data;
it does **not** prove any customer bank-statement import, Clover connection,
live Finance facts, role coverage, or production financial correctness. The
first real-data tranche remains subject to MHO-227/MHO-228 authorization,
immutable Files custody, and row-source lineage. A reload returns to live
Workspace records.

## 2026-09-14 installed visual E2E audit and repair

At 2026-09-14 06:12 UTC, a delegated live browser pass exercised all five
installed Hass Kitchen Finance pages in default and opt-in sample modes. It
found two reproducible Remote DOM crashes: timeline pointer capture during
drag, and unsupported focus restoration while closing transaction evidence.
It also found a synthetic record labeled as a Workspace record, cramped
Transactions controls, hard-to-read Statements columns, and misleading empty
copy. `+ Add source` was rechecked on a healthy page and worked; no source
connection was made. A date-picker tab crash was not reproduced and remains
unconfirmed.

The focused App fixes remove unsupported pointer-capture/layout and focus-ref
calls, use supported pointer events on the timeline brush, distinguish sample
evidence, clarify empty states, wrap narrow controls, and make Statements a
horizontal table with an explicit scroll cue when rows exist. `yarn
test:unit src/__tests__/workspace-preparation.test.ts` passed 8 tests; App
lint reported 0 issues, `yarn twenty dev:build` succeeded with 14 files,
and `git diff --check` passed. Reviewed `yarn twenty plan --remote
finance-install-20260914` showed only five front-component checksum updates,
zero additions and zero destructions; `yarn twenty apply --remote
finance-install-20260914` reported `Synced Mhoo Finance (14 files)`.

On the installed Overview, a start-handle drag changed the selected start
from 2024-11-29 to 2025-01-16 and recomputed totals; moving the shortened
window then changed both dates and totals without an error. On installed
Transactions, the sample drawer displayed `SYNTHETIC TEST RECORD` and closed
without a crash. Desktop and 760px narrow screenshots showed the repaired
Transactions controls and readable Statements rows with a visible sideways
scroll cue. These are current single-account visual receipts, invalidated by
the next App deployment, host change, or browser behavior change.

The repeatable read-only Playwright suite lives in
`packages/twenty-e2e-testing/tests/mhoo-finance/` and declares five pages
times two viewports (10 tests). `--list` passed. Its unattended live run was
**not** performed because no operator-supplied authenticated Playwright
storage-state file exists; the current browser session was not exported.
This visual audit does not prove live bank data, customer import, Clover
connection, other roles, recovery, or financial correctness. Those remain
separate gated acceptance work.

## 2026-09-14 date-control repair and installed readback

At 06:24 UTC, the installed native `type=date` control was found to focus
without opening a picker in Twenty Remote DOM; the earlier tab crash was not
reproduced. The Finance date controls now use ISO text drafts, strict real-date
and domain/order validation, and explicit Apply/Reset. The active timeline
window changes atomically only on valid Apply, so a malformed draft cannot
reach timeline arithmetic. Five focused timeline tests, App lint, App build
(14 files), and `git diff --check` passed on the scoped source diff. The
read-only remote plan showed five front-component checksum updates, zero
additions and zero destructions; `yarn twenty apply --remote
finance-install-20260914` synced 14 files.

Installed Transactions synthetic preview was then exercised in the live Hass
Workspace: narrowing 2024-11-29..2026-03-02 to 2025-01-01..2025-01-31 changed
the visible count from 30 to four January test records and narrowed the brush.
An impossible 2025-02-30 showed the validation alert and preserved the four
records. Reset restored the full domain and 30 records, without a tab crash.
The page was returned to Workspace records: zero authorized records and no
synthetic fallback active. This proves the installed date-control interaction
for the current signed-in account only; it is invalidated by the next App
deployment, host change, or browser behavior change. It does not prove real
bank import, role isolation, or release acceptance.

## 2026-09-15 approved Overview library extraction — source-only receipt

Delivery Room `finance-investigation-ui-release-20260914` / MHO-7 continues
from clean base `724b83a993857644c9bdf81bca95bbd1c07c8610` in the retained
`codex/finance-approved-insights` checkout. The approved Overview was ported
into `finance-insights.tsx`, with its tokens/styles and shared header, button,
source-row, page-header, and period-control primitives under `src/components`.
Overview consumes those primitives before the record-backed Accounts,
Transactions, Statements, and Follow-ups surfaces consume the shared page
header treatment. No duplicate navigation shell or synthetic Workspace fallback
was added.

The source preview at `http://127.0.0.1:61944/#overview` was inspected with the
immutable synthetic fixture: the Jun–Aug 2026 frame, date/filter controls,
compare disclosure, month drill-in, and linked source rows all rendered and
responded. The other four source-preview routes rendered their existing
permission-aware data, exact money/table guards, and Follow-ups workflow
controls. Focused source checks passed: App typecheck/build, lint, 19 tests
across workspace preparation, workspace behavior, and monthly cash movement,
plus `git diff --check`.

The Overview now derives its real-data domain from valid record dates and
withholds chart totals when a result is truncated, mixed, unsupported, or
outside safe plot precision; it preserves the fixed synthetic reference output.
The raw money contracts still own display and aggregation. Pointer capture and
geometry fallbacks were removed from the new Overview surface after inspection
of the existing Remote DOM constraints. Local browser preview is not proof of
installed Remote DOM behavior. No App apply/install, deployment, provider or
live-data operation, credential action, merge, or push occurred in this
increment. Installed pointer behavior and host support remain explicit runtime
acceptance gaps for the coordinator.

## 2026-09-15 Milestone 1 correction — shared Overview controls only

Commit `cbed4b05e99744be92e2343e7e0713543e09281f` was rejected for review: it
left a second control implementation in `finance-workspace.tsx`, rendered a
different live-only control, and replaced the reference drag calculation. It
is retained as failed-review evidence and is not an acceptance receipt.

The successor source change extracts the approved toolbar, filter/date
popovers, calendar ruler, range label, pointer drag, and keyboard behavior into
`src/components/finance-ui/finance-period-controls.tsx`. Both synthetic and
current-Workspace Overview now invoke that one component; Accounts,
Transactions, and Statements invoke it too, replacing their duplicate native
range controls. The controller uses the original direct browser pointer capture
and measured-width calculation rather than a guarded or hard-coded substitute.
That restores local-browser semantics but leaves Twenty Remote DOM support an
explicit, unproved host-runtime gap. This correction is restricted to Milestone
1 and does not claim the remaining page-layout rebuild is accepted.

## 2026-09-15 Milestone 1 control-behavior correction — source-only receipt

The shared controller now explicitly submits date Apply, surfaces invalid
drafts through its parent error state, and accepts a supplied reset range. The
approved Overview supplies its Jun 1–Aug 31 2026 initial scope, while the
record-backed views retain their own full-domain reset scope. Its range logic
is isolated in a non-JSX behavior module with focused tests covering valid
Apply, invalid-range feedback, Overview Reset, and an exact measured-width
brush displacement; the rendered controller consumes those same functions.

The approved palette is now exported as the exact named semantic token map,
and the one `FinancePageHeader` primitive parameterizes both the original
Overview heading markup and the record-backed page header. Local source preview
exercise verified Apply (Jun–Aug to Jul), Reset (back to Jun–Aug), an invalid
reversed range alert, and a direct 20px brush drag (Jun 1–Aug 31 to Jun 7–Sep
6). This is browser-preview evidence only. Direct pointer capture and measured
geometry remain deliberately unadapted and are **not release-ready** until the
installed Twenty Remote DOM host is independently accepted. No App apply or
install, deployment, provider/live-data operation, credential action, merge,
push, or release acceptance occurred.

## 2026-09-15 remaining Finance page layout rebuild — source-only receipt

Accounts, Transactions, Statements, and Follow-ups now render through the
approved Overview title structure, shared button treatment, toolbar, and exact
calendar ruler instead of the previous secondary page-header and native-range
style system. The reference semantic tokens now include exact type scale,
spacing, border radii, and frame dimensions; the record-backed workspace
imports and consumes them for its page shell, headers, controls, and tables.
The older `fw-*` range, brush, and duplicate header styling was removed. The
data, money guards, permissions, drawer, and native Follow-up workflow remain
unchanged.

At the same 1280px source-preview viewport, Overview, Accounts, Transactions,
Statements, and Follow-ups were each visually inspected. The shared range
controller was present on the three record-list pages; a synthetic Follow-up
opened its detail view and returned through the shared title action. This is
local browser preview evidence only, not pixel-perfect acceptance or installed
Twenty Remote DOM proof. Direct pointer capture and geometry still require a
separate installed-host acceptance. No App install/apply, deployment,
provider/live-data operation, credential action, merge, push, or release
acceptance occurred.

## 2026-09-15 responsive primitive correction — source-only receipt

Commit `51199dd909361af2fca27232d7a178b3d5cafed8` restores the approved mobile
rules through the same responsive primitive sheet consumed by both the
Overview and the record-backed Workspace. In particular, it restores the
stacked date/compare controls, compact button treatment, timeline scroller and
hint, table/chart spacing, single-column breakdowns, and narrow drill-in
spacing; it does not create another page-specific mobile style implementation.

At a 390px local source-preview viewport, the document remained 390px wide;
the visible timeline hint was present and its internal ruler remained
horizontally scrollable (600px content in a 364px viewport). Accounts Filters
opened its account disclosure, Transactions Search filtered to 37 Clover test
records, Statements rendered its exact minor-unit/no-inferred-currency
disclosure and sideways-table guidance, and a Follow-up opened and returned
through the Back action. The Statements page has no interactive disclosure
control to test in this source preview. Lint, typecheck/build, and
`git diff --check` passed; provenance and the exact-head fixture passed against
base `724b83a993857644c9bdf81bca95bbd1c07c8610`.

This is local synthetic source-preview evidence only. It is not installed
Twenty Remote DOM, live-provider, deployment, push, merge, or release
acceptance; the direct pointer-capture host gap remains explicit.

## 2026-09-15 installed readback and Add a source correction — source-only receipt

The authorized Hass Kitchen session was inspected read-only at the five installed
Finance page URLs. It renders the earlier permission-checked Workspace surface,
not this candidate: Overview, Statements, and Follow-ups completed their reads,
while Accounts and Transactions remained at their loading copy during the
bounded inspection. No provider setup prompt was followed, and no Finance
record, connection, role, credential, or Workspace metadata was changed.

The official `finance-install-20260914` remote authenticated successfully, but
the exact plan for candidate `03a9de84d09c417e481839db7b263219542c1a81`
reported five front-component updates **and eight destroys**, including the
installed legacy SourceArtifact/FinancialAccount relation pair and its view
projections. The plan warns that two of those destroys drop relation-column
data. It was not applied. The current sole preparation logic function does not
reference either legacy relation; this is schema drift, not a missing function
fix. A separately reviewed compatibility schema or data-migration/rollback plan
is required before any UI-only sync can proceed.

The candidate now includes Add a source in the same approved Finance library:
four existing handoff routes (Bank, POS Clover, Uploaded statements, and Email
evidence) render as a two-column editorial grid at desktop and a one-column
sequence at 390px. It reuses the shared Finance button and responsive token
layer, preserves every existing boundary statement and route action, clears a
stale failed-handoff notice when re-entering, and correctly distinguishes
`handed-off` from a host failure. In the local synthetic host, an Apps handoff
returned the explicit failure/no-connection-changed message; unit tests cover
all four Apps and Source-artifacts navigation mappings plus unsupported CSV.
Back to Accounts was visibly exercised. Lint, typecheck/build, seven focused
handoff tests, `git diff --check`, provenance, and the exact-head fixture passed.

This remains source-preview evidence. It does not prove an installed handoff,
provider connection, file import, customer financial data behavior, or release
acceptance. No apply, deploy, push, merge, credential change, or provider action
occurred.

## 2026-09-15 installed metadata-preserving Finance sync — installed receipt

Commit `ff5f2a904f171317150473f44e137560780bb0c7` reconciles the candidate
manifest with the installed, retained Finance metadata rather than replacing
it. It preserves the existing SourceArtifact-to-FinancialAccount relation and
inverse, their installed universal identifiers, the existing
`financialAccountId` join column, and the two retained unique-key index
definitions. The compatibility assertions cover those exact values before a
remote action is considered.

The fresh official plan for remote `finance-install-20260914` then reported
`0 to add, 5 to change, 0 to destroy`: only the Accounts, Follow-ups, Overview,
Statements, and Transactions front components required checksum updates. The
authorized apply uploaded 14 application files and completed with `Synced Mhoo
Finance (14 files)`. No Finance record, relation-column data, connection,
credential, role/grant, provider operation, deployment, push, merge, or
Workspace metadata change was made.

Read-only installed checks used the Hass Kitchen Finance page routes directly.
Overview, Statements, Follow-ups, and Transactions rendered the current
Workspace surface; Accounts rendered its Finance shell but remained at
`Reading authorized Workspace records…` during the bounded observation. The
browser console had no warnings or errors. The host-wide `Finish setting up
Hass` modal offers only `Connect Clover` and has no ordinary dismiss path; it
was not followed. That action would cross the explicitly excluded
provider-connection boundary.

The installed host consequently exposes finance controls, including the
local-only `Preview sample data` toggle, as disabled beneath the setup modal.
No synthetic toggle, date interaction, drag, drawer, source handoff, or record
write was bypassed or fabricated. The UI identifies the active destination as
Hass Kitchen and `Current Workspace · permission-checked read`; a read-only
current-user API lookup was forbidden, so the browser user's exact assigned
Finance role is intentionally unproven. The remote credential can read its
effective Admin and WhatsApp-function roles, while the installed app defines
separate Finance writer and reviewer roles; neither fact establishes the
browser user's membership.

`yarn lint`, `yarn typecheck`, the focused workspace-preparation suite (9
passing tests), and `git diff --check` passed before the sync. A final
post-sync no-drift plan and source-custody fixture remain the release receipt
for this commit set. This proves a safe installed front-component sync only;
provider setup, active-user role verification, and host-control interaction
remain explicitly blocked pending separate authority and host readiness.

## 2026-09-15 installed Remote DOM timeline repair — installed receipt

The installed Overview report identified a Remote DOM runtime failure during
brush interaction: the host does not expose `setPointerCapture`. Commit
`aa91b1664534d529f7fcc3c0dc16944f69112e55` makes pointer dragging a guarded
browser enhancement: it only measures/captures when both browser methods are
available and clears the drag state if the host rejects either call. The
always-supported controls remain the month buttons, date picker, and keyboard
arrows. This preserves the local-browser drag path without requiring unsupported
Remote DOM APIs or claiming exact drag behavior where the host does not provide
it.

The same shared controller now gives a multi-year timeline a 48px month column
and explicit year markers, rendered inside its horizontal scroller. A single
12-month reference ruler keeps its natural width and existing visual treatment;
the multi-year range retains its date-accurate position instead of compressing
all month labels together. Focused presentation tests cover both cases, while
the existing behavior tests retain date draft, reset, keyboard and browser-drag
math coverage.

The official `finance-install-20260914` plan reported `0 to add, 5 to change,
0 to destroy`, updating only the five existing Finance front components. The
authorized apply uploaded 14 files and completed `Synced Mhoo Finance (14
files)`. Its immediate post-sync plan reports `No changes. Twenty metadata
matches your manifest.` No Finance record, provider connection, credential,
role/grant, object, field, relation, deployment, push, or merge changed.

After an installed Overview reload, the component rendered without a
`FrontComponent error`; the browser console returned no errors or warnings;
and the 2021–2026 year markers and month controls rendered as separate timeline
content. The existing host `permission-checked read` condition still disables
month, date, keyboard, and drawer controls. Those controls were not bypassed.
The truthful excluded-transfer empty state was retained; no aggregate was
synthesized. `yarn lint`, `yarn typecheck`, 14 focused unit tests, and
`git diff --check` passed. This is installed rendering proof and a safe UI-only
sync receipt, not provider, live-data interaction, role, or release acceptance.

## 2026-09-15 installed native range-brush workaround — installed receipt

The pinned Twenty v2.37 Remote DOM source explicitly supports `HtmlInput`
`onInput` and `onChange`, serializes the input event `value` onto
`event.target.value`, and forwards pointer coordinates. The Finance brush now
uses that supported input contract: a controlled, transparent native
`input[type=range]` spans the full timeline coordinate system but is clipped to
the existing highlighted interval. Dragging it changes the interval start while
preserving the selected inclusive length. The visible brush, one-year ruler,
month buttons, date picker, keyboard move fallback, and resize controls remain
in place; the native slider adds no pixels to the approved reference surface.

The helper clamps the new start within the selected domain and has focused unit
coverage for an ordinary move and the end-of-domain clamp. Focused Finance
tests passed (13 tests), as did lint, application typecheck/build, and `git
diff --check`. The reviewed official remote plan reported `0 to add, 5 to
change, 0 to destroy`, only updating the five existing Finance front-component
checksums. The authorized apply uploaded 14 application files and completed
`Synced Mhoo Finance (14 files)`; the immediate post-sync plan reported `No
changes. Twenty metadata matches your manifest.`

On the installed Hass Overview, the native slider is present with the expected
accessible name and selected-range value and the browser console returned no
errors or warnings. The host marks the complete remote component as `draggable
(disabled)` under `Current Workspace · permission-checked read`, which also
disables the slider, month buttons, date control, and existing resize controls.
No role/grant, setup, provider, record, or Workspace change was used to bypass
that activation boundary; no disposable permitted Workspace was available in
this scope. Therefore installed rendering and host-contract support are proven,
but an installed user drag changing totals remains explicitly unproven pending
a separately authorized interactive Workspace. No data, connection, credential,
role, provider, deployment, push, or merge changed.

### Correction — 2026-09-15 host control activation diagnosis

The earlier installed receipts described the Finance controls as disabled under
the `Current Workspace · permission-checked read` footer. A fresh DOM-level
inspection corrects that interpretation: this footer is static Finance copy,
not an authorization gate, and the installed Finance slider, Filters button,
and keyboard fallback have no `disabled`, `aria-disabled`, or inert ancestor.
The accessibility tree's `draggable (disabled)` presentation does not reflect
the controls' actual DOM disabled state.

The real blocker is a distinct host-wide, full-viewport backdrop above the
Finance page. Its dialog reads `Finish setting up Hass` and offers `Connect
Clover…`; it has a fixed viewport rectangle, z-index 39, pointer events
enabled, and intercepts the center point of the enabled Finance Filters button.
The Finance range itself is therefore not a candidate for an App-local
permission or presentation fix. No Finance role/membership, provider setup,
OAuth action, connection, or modal bypass was attempted. The exact browser
user identity and role membership are not exposed through the permitted native
surface, so they remain unproven rather than inferred from the footer.

The minimal enablement path is to resolve or dismiss that separate Hass/Clover
onboarding gate through its owning product flow. `Connect Clover…` would begin
a provider-connection action and remains outside this Finance UI authority.
Once the owning flow supplies a permitted interactive Workspace without the
backdrop, the already-enabled Finance controls can be exercised normally; no
Finance App change or broad role grant is indicated by this diagnosis.
