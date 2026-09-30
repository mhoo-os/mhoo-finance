# Finance · The Proof Field (prototype, MHO-322)

An interactive design prototype for the Mhoo Finance app. In this design every number is
made of its evidence. The screen shows how much of the money is proven, what is still
unproven, and the one thing that would prove more. Totals come last, and a month with no
statement is never shown as $0.

This folder is self-contained. It is not part of the Worker, the tests or the coverage gate,
and it never talks to a database, a provider or the network.

## What's in it

The prototype has five pages. They are routed in memory, so the URL never changes.

- **Field.** The overview. Each dot is one fact:
  - ink dots are proven and counted;
  - drifting grey dots are excluded, with the reason on hover;
  - amber dots sit inside an open exception;
  - stipple means no data (unknown);
  - a hollow ring means no activity (proven zero).

  The headline is formed in particles: exposure, open exceptions, and complete source-months.
  Below it are "What would prove more" and a sparkline that leaves a gap for unknown months.
- **Trace.** A month's net lifts off and re-forms as the rows it's made of. Select a row to
  open its file, revision, hash, row pointer, receipt and raw values.
- **Coverage.** A source × month grid in five states (Complete, Partial, Stale, No data,
  No activity). It also shows connectors (Clover isn't connected, since MHO-230 consent is
  pending; Plaid is Sandbox only) and import receipts.
- **Exceptions.** Each exception is shown as one dot per dollar. Where expected and observed
  agree, the dots merge and turn green; what's left over stays amber. You can write a
  reviewer note (kept on the page only) and choose a source to preview its effect.
- **Follow-ups.** The contract states: To do, Waiting for reply, Ready for review and
  Resolved. The email ladder runs Draft → Awaiting approval → Approved, not sent.

The **Cue island** sits top-left on every page. It shows one line: the next thing that
matters, with a reason you can check. News is held while you type. Ask (⌘K or `/`) is
answered locally from the page's live state.

**Tour** (in the dock) has six moments. Each plays on the page, and each can also be done by
hand:

1. First look.
2. Trace a number.
3. Gap honesty.
4. Draft a disposition.
5. Follow-up.
6. Custody alarm.

**Owner actions** stay on the page as dashed "owner action" controls that only explain what
the real app would do: Record decision, Approve, Send, bring a statement, Connect Clover,
Check custody and Extract statements. The prototype never approves, sends, imports, syncs,
records or spends.

## Run it

```sh
bash prototypes/finance/tools/make-preview.sh          # writes the gitignored preview.html
python3 -m http.server 8842 --bind 127.0.0.1 --directory prototypes/finance
# open http://127.0.0.1:8842/preview.html
```

`index.html` is an artifact-style fragment. It has no doctype, html, head or body tags;
`preview.html` wraps it for local use.

To run the browser checks, you need Playwright Core. Set `PLAYWRIGHT_CORE=/path/to/playwright-core`.

```sh
PLAYWRIGHT_CORE=/path/to/playwright-core node prototypes/finance/tools/check.cjs 8842 [shotsDir] [realShotsDir]
# shotsDir defaults to the gitignored prototypes/finance/.shots; keep realShotsDir outside the repo
```

The checks run at 1440×900, at 390×844, and at 1440×900 with reduced motion. They confirm
that:

- there are no console or page errors;
- no request leaves this folder;
- nothing scrolls horizontally;
- the island rests at 80 px or less;
- the particles settle (they are static under reduced motion);
- every tour moment reaches its result;
- Ask refuses to send and draws no conclusions.

## Files the page needs at runtime

- `index.html`, `app.css`, `app.js`, `model.js`, `dots.js`, `tour.js`, `fixture.js`
- `kit/`: `kit-tokens.css`, `device.css`, `device.js`, `cue-kit.css`, `cue-kit.js`,
  `orb.js`, `thinking-orbs-engine.js`, `particles.js`. These are vendored from the shared
  island kit (MHO-317) and left unchanged.

`tools/` holds local helpers only: the preview wrapper, the browser checks and the real-data
converter.

## Data

- **Default: synthetic.** `fixture.js` is the fixture pack
  `apps/mhoo-finance/fixtures/mhoo-finance-fixture-pack.json` from
  `origin/codex/finance-app-contract` (2165e18, the PR #7 line). It includes the dataset only:
  - 20 facts;
  - 14 artifacts and receipts;
  - 20 coverage cells, of which 8 are Complete;
  - 3 exceptions (exposure $126.00);
  - 24 duplicates suppressed.

  The follow-ups were written for this prototype using the contract's enums. Money stays in
  integer cents and is formatted without float math.
- **Hashes.** Some fixture artifacts carry a real SHA-256 (the revised card and Toast files).
  Others carry a fixture stub such as `fixture-bank-2026-02-v1`, and the page labels those as
  stubs. It never invents a hash.
- **Local real data (this machine only, never committed or published).**
  `tools/make-real-data.mjs` reads the owner's local evidence store read-only (`node:sqlite`,
  `readOnly: true`) and writes the gitignored `real-data.local.json`.
  - It keeps:
    - account kind and last four digits;
    - date;
    - integer cents, flipped to money-in-positive;
    - status and category;
    - export SHA-256 and record number;
    - merchant names for business categories only.
  - It never emits the `description` column (which holds payees and staff names), transaction
    ids, full account labels or anything from the Gmail tables.
  - The page looks for the file only on `127.0.0.1` or `localhost`. When the file is there,
    the dock offers "Fixture · Local real".
  - Real-data screenshots belong outside the repo.

  ```sh
  node prototypes/finance/tools/make-real-data.mjs [path/to/financial_sources.sqlite3]
  ```

- **Not used.**
  - The standalone local D1 has a schema but no rows.
  - The staging D1 has no tables.
  - The Twenty sample needs a sign-in.
  - Clover isn't connected (MHO-230) and Plaid is Sandbox only (PR #5), so neither is called.
