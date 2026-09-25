# Finance delivery with TypeSafe

`finance-deliver-typesafe` extends the pinned Archon `archon-deliver` delivery tail in one native run: implement → check → TypeSafe → draft PR → independent review → bounded corrections (each checked and evaluated with TypeSafe) → validate → CI → ready PR. No merge or deployment.

Archon source: d6e0e3baf4f9af2a4b0a5405e8c003e42ca96212. TypeSafe registry/client: Room 9a4b2224bdc5e6d403400b55cefdd60760666b5d. Bundled source hashes are in deliver/scripts/room-typesafe-source.json. The existing SDLC includes require this pinned runtime. No default workflow is overridden.

## What is active

A required script evaluates bounded committed-source excerpts through the existing authenticated Room relay and its evaluation_review registry. It batches three questions: goal satisfaction, coverage sufficiency, next step. All answers are delivered to initial and correction reviewers. Unavailable/malformed/stale responses stop the dependent path. Negative semantic advice reaches the reviewer for repair inside the normal correction loop. Jev does not grant authority, suppress review lenses or certify completion.

The excerpt is always labelled partial, at most 9,000 characters; the full source and PRD remain required review inputs. The upstream check report is labelled agent-reported. Deterministic checks and independent review remain authoritative. This is not the 16-question adaptive router or automatic model selection; neither is silently promoted by this package.

Receipts bind request/schema/input hash, committed source, provider/model and timestamp. Uncertain calls leave a pending receipt; rerunning cannot silently spend again. Resolve a held receipt deliberately through native recovery. Credentials stay in the existing relay client custody, never in workflow inputs.

## Verification

- 16 delivery graph fixtures passed (includes correction convergence and expected rejection paths).
- 9 adapter tests passed: invalid/stale receipts, unavailable provider, invalid distributions, uncertain-call replay and source-change handling.
- Native synthetic smoke run 378e9bddeeb4000dfbedf9f704c1d589 completed; real provider direct-typesafe, model jev-1.13.0, evaluation-review-v1 receipt.
- No Finance delivery run or product completion is claimed. Before delivery, reconcile the extracted UI baseline and pin the coding provider/config; current generic global tiers must not be mistaken for a verified codex_lb Finance configuration.

Run focused checks with:

```
node --test .archon/workflows/finance/deliver/scripts/typesafe-review.test.mjs
archon-room workflow test finance-deliver-typesafe
```

`finance-typesafe-smoke` contacts TypeSafe using synthetic code only; it launches no coding agent and makes no GitHub or bank-data writes.

Tracked product scope: Linear MHO-299 and https://github.com/mhoo-os/mhoo-finance/issues/6.
