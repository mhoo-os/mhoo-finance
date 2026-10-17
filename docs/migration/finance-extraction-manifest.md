# Finance extraction custody manifest

**MHO-353 / PR 1 — custody and contract baseline**

This manifest records the exact source inventory and the receiving repository head for a documentation-only extraction baseline. It does not move code, data, credentials, provider access, or production authority. The source checkout was inspected read-only.

## Immutable heads

| Role | Repository | Commit | Verification |
| --- | --- | --- | --- |
| Source | `mhoo-os/mhoo-twenty-next` | `336a6f50c0dc286b9f25f7d98b67ffcd5ecb4628` | `git rev-parse HEAD` in the owner-supplied checkout |
| Target | `mhoo-os/mhoo-finance` | `540b33f3a16011132a79be9cc7e88f8102c02f3c` | `git rev-parse HEAD` before this PR |

The source package is `packages/twenty-apps/internal/mhoo-finance/` and contains **83 files**. LOC is the number of newline-delimited lines at the source head, including binary fixture line counts as reported by the same byte-safe line counter. SHA-256 values below are source-file custody hashes.

## File-by-file disposition

`port` means preserve the reviewed semantics in target-native modules or fixtures. `rewrite-vanilla` means preserve the contract while replacing Twenty/React/I/O coupling with the target's plain ESM Worker boundary. `drop` means intentionally leave the Twenty-only file behind. PR numbers refer to the approved MHO-353 sequence in `out/finance-migration-prs.json`; PR 1 is this manifest and ownership baseline.

| Source path | LOC | SHA-256 | Disposition | Planned target path | Planned PR |
| --- | ---: | --- | --- | --- | ---: |

| `.gitignore` | 20 | `39b6f24b7e739aa1540989b4c6e75fb2f23797e0c9d2ef3344e53ba9f62dd713` | **drop** | `—` | PR #1 |
| `.nvmrc` | 1 | `0667c9be2ca8fad9083f936776a81b73fb1c81e32f30cb4da5460f470a09f1c7` | **drop** | `—` | PR #1 |
| `.oxlintrc.json` | 37 | `3b4e6d371e172670dd60c9ce32a247c0748adabf0044d427a2ce71938466e148` | **drop** | `—` | PR #1 |
| `.yarnrc.yml` | 1 | `473e6def86fc03638120e0c01d0c8bbab095677256460fa4ea763e5d4697f270` | **drop** | `—` | PR #1 |
| `BENCHMARK.md` | 83 | `e7ec639f75ac1a33a9a9fee6488ce4bb2652874aed54860f695ec5e8e3075218` | **port** | `docs/` | PR #7 |
| `COMPATIBILITY.md` | 19 | `a47d60f8103ce94bc4f550e3c3cf99fd7960a5ca36a1f0be2e418f23dcf94978` | **port** | `docs/` | PR #7 |
| `INGESTION.md` | 68 | `31d89ba14f69ad6eb519f339f5c2af4f520995512cbd83a1bef306e227b62559` | **port** | `docs/` | PR #7 |
| `INVESTIGATION_UI.md` | 31 | `3956f011c207ae9d91b5b4818a30ff3d6b34e9d05af1243907daa482b4ef54b2` | **port** | `docs/` | PR #7 |
| `PORTING.md` | 24 | `a148150d98526e97a1c0c13e994e853cda589bcf85a73b2ee3a7ac04df9fe71a` | **port** | `docs/` | PR #7 |
| `PREPARATION.md` | 79 | `e35f426ddec9051a0118f3d3547ca49bd1bd8137b1513627e289e89e4f3af200` | **port** | `docs/` | PR #7 |
| `PRODUCT_REQUIREMENTS.md` | 158 | `6d25edc5c6842911671dab32be466152696c66c3e8ce3f44e888f00f045f78f7` | **port** | `docs/` | PR #7 |
| `PROVENANCE.md` | 42 | `9ce2ca3efad4d2f644ac2c07453e4cd438e06d6aa666392f688e9814957cbfdf` | **port** | `docs/` | PR #7 |
| `README.md` | 73 | `7e2c18def83fc4488d9eea6d046216294f3663ce6949a1f01479f30d27e3c8f4` | **port** | `docs/` | PR #7 |
| `fixtures/ingestion/README.md` | 20 | `520a3d7834e220b257e6332f267ae13d412986999b2bf47fe6c34e65b36ac8a7` | **port** | `fixtures/` | PR #3 |
| `fixtures/ingestion/synthetic-bank-february.csv` | 3 | `f1753c907379a78d7bbd5d70cec0966f65dfb060bce2128e53ff435a2eed246f` | **port** | `fixtures/` | PR #3 |
| `fixtures/ingestion/synthetic-bank-february.qfx` | 5 | `e38ccb2e2e20f6c730a04d698efe3143a9b29696930ffdc73c60c64f2b4c86db` | **port** | `fixtures/` | PR #3 |
| `fixtures/ingestion/synthetic-bank-statement-missing-page.pdf` | 11 | `0c496298607d9291832e4848662508522fbccd4062876a9578317ed47588f6f8` | **port** | `fixtures/` | PR #3 |
| `fixtures/mhoo-finance-fixture-pack.json` | 2688 | `3f6078707cf650111813953049fcfcd915d5a149762a5c344cf1222f9441b0f9` | **port** | `fixtures/` | PR #3 |
| `package.json` | 43 | `3f5ed332a758ae77dc48161b9163764c2f8fe64239b6577f48d911a40533dbb3` | **drop** | `—` | PR #1 |
| `scripts/generate-benchmark-population.mjs` | 55 | `02ace31acebb6c740954e82646a0d13de4bd2ed3923ec0525c66d4c5b158f0c9` | **port** | `fixtures/` | PR #3 |
| `scripts/generate-fixture-pack.mjs` | 24 | `f9b66027bf10770b73e35920a443f9411f5a53821fc70d36b1c08a56f0581046` | **port** | `fixtures/` | PR #3 |
| `scripts/validate-ingestion-fixtures.mjs` | 34 | `0965175a2d041aa4d21431f0f9eb3fe691d045fd955bc0b3527d4b96b74f7039` | **port** | `fixtures/` | PR #3 |
| `src/__tests__/finance-contract.test.ts` | 377 | `f4a25b32a8a9845d04c10fb482d86d24c87261c982c9bcf4d52155bd2e6e2062` | **port** | `test/` | PR #2 |
| `src/__tests__/fixture-pack.test.ts` | 233 | `8d2f29b107b4a7db05db217d3e488079e4546e34f4ca27c243ed455fc38e6f7f` | **port** | `test/` | PR #3 |
| `src/__tests__/jev-shadow.test.ts` | 46 | `58cb02b0580e06f663f0ae46eef2fe1d77c16e50de33b4822c34fa2f90bafddd` | **port** | `test/` | PR #2 |
| `src/__tests__/manifest.test.ts` | 44 | `c08a2df58dd9344b08eab840e75856f00ac09018644e9adb6c804b75575971e5` | **port** | `test/` | PR #2 |
| `src/__tests__/plaid-export.test.ts` | 126 | `4149ac5294801e68cd3c25da7232386ac135f8a9bb949c88c31a003519154cbf` | **port** | `test/` | PR #4 |
| `src/__tests__/population-manifest-limit.test.ts` | 41 | `e890a0e43f1bab39df0228ea5290d7b8d603c672022d3d323d4202bec2427712` | **port** | `test/` | PR #3 |
| `src/__tests__/read-fixture.test.ts` | 355 | `941c20fd0d230d6ddb1bcf62fbaafc99bfddff251c501e1bc65eafcdb8c1152a` | **port** | `test/` | PR #3 |
| `src/__tests__/sample-evidence.test.ts` | 63 | `6e7fcd534e011371328a336214224772a7f4957416514ec4cfd07d4ca8c206c4` | **port** | `test/` | PR #4 |
| `src/__tests__/saved-question-reader.test.ts` | 194 | `26cc65c54d2a50a16468fb816ad49afa456aba2980570c4fbf5860bf51f70103` | **port** | `test/` | PR #4 |
| `src/__tests__/source-handoff.test.ts` | 21 | `9460673a2abe843c99de214562c784cd0cb5e2e2558fc30932e8eaccb27505f9` | **port** | `test/` | PR #4 |
| `src/__tests__/statement-importer.test.ts` | 311 | `e22bdd29d6702754e59f6d9ebec5e4d08eab392082a94733be9a0b9974032702` | **port** | `test/` | PR #2 |
| `src/__tests__/synthetic-population.test.ts` | 56 | `59b91d80185adba1ce9b87d7d335e74875bf9d07743217a403a1e197e04fb585` | **port** | `test/` | PR #3 |
| `src/__tests__/workspace-preparation.test.ts` | 41 | `be21bc99d6f3f04b8e6ee8b872f38e07ce49d1b723fef6ffe587d9b11bfec883` | **port** | `test/` | PR #4 |
| `src/application.config.ts` | 10 | `f1ec7dee35406ebd76972252a5ce1247834ecdccf5184ad0732b94f46f68982c` | **drop** | `—` | PR #1 |
| `src/benchmarks/synthetic-population.ts` | 125 | `e664570c3b0a4980c29cc0c815574167ace68f6a8d2776555b25f09ecaff77fa` | **port** | `fixtures/` | PR #3 |
| `src/components/finance-sample-evidence.tsx` | 46 | `54e493f4819888994e447225f1992c3463c6fc8b3476021218bb6d8a646a33af` | **rewrite-vanilla** | `public/` | PR #5 |
| `src/components/finance-saved-samples.tsx` | 129 | `a7b07a073b208a1452ba786fedf5736dfaffa9e4a232232dc038a629e0f7c83f` | **rewrite-vanilla** | `public/` | PR #5 |
| `src/components/finance-source-entry.tsx` | 51 | `b04152bf112c6a9b6521d1848a5b966ba15622ca33d7d3bdfec6254dd9569316` | **rewrite-vanilla** | `public/` | PR #5 |
| `src/constants/universal-identifiers.ts` | 172 | `c1f01b4ed32c6e6764942b752f266783291a57cfa65b541f4e42f9649023ef36` | **port** | `src/domain/` | PR #2 |
| `src/contracts/README.md` | 227 | `0699c7bded308046c6e3f222ca750b881036bcc534f7323eefaf52215b89b471` | **port** | `src/domain/` | PR #2 |
| `src/contracts/finance-contract.ts` | 750 | `cae1fdace548a5965dbc1ff42cf2e469634d55d9733af8c426b1cb828bc9c32d` | **port** | `src/domain/` | PR #2 |
| `src/contracts/money.ts` | 75 | `c60190b3e55b6397c7f84ac9206f7aa7bf940c94550191407c3402b10e326b3d` | **port** | `src/domain/` | PR #2 |
| `src/contracts/read-fixture.ts` | 308 | `66b6929984c001bdc52b20c1051a37f17004c75223f33dc7c76fff33991eb500` | **port** | `src/domain/` | PR #2 |
| `src/decisions/jev-shadow.ts` | 100 | `ca573f356619d0aeb3433564d773270dd93de5e61b854063afd92c54815efb32` | **port** | `src/domain/` | PR #2 |
| `src/fixtures/contract-golden.ts` | 195 | `f1bc3780d1da06071b6d4bba38d5cc4037e9a451ffe3ef264319c9b98e5e3096` | **port** | `fixtures/` | PR #3 |
| `src/fixtures/fixture-adapter.ts` | 283 | `4957b112502962406d5cb567c357df0ba7ca143e67cb469a48d18a5b15ef125c` | **port** | `fixtures/` | PR #3 |
| `src/fixtures/fixture-pack.ts` | 692 | `8265b51ab7180a2b38ab34120f604b2f90675070343029635b0e39c8e4e12c61` | **port** | `fixtures/` | PR #3 |
| `src/front-components/finance-audit-dashboard.front-component.tsx` | 535 | `bfe767402dd9cb3cb5c5cce1f1ab8724741257c5c9726725e3ee907f53bf48d7` | **rewrite-vanilla** | `public/` | PR #5 |
| `src/ingestion/statement-import-adapter.ts` | 88 | `dda62b0a5c90dc5b1ebf71bf8183b3f4596fb262a7bd8c4388f349d0a3e6883e` | **rewrite-vanilla** | `src/normalize.js` | PR #3 |
| `src/ingestion/statement-importer.ts` | 576 | `a9f92d4fd3158402d378e6ddaa5007e747c8684888d5cb66e63e12987a3f1960` | **rewrite-vanilla** | `src/normalize.js` | PR #3 |
| `src/investigation/sample-evidence.ts` | 67 | `1962f748842547077e8bbc0aa66d1d9759a74aefce7d02dab203617de9b381bd` | **rewrite-vanilla** | `src/investigation.js` | PR #4 |
| `src/investigation/saved-question-reader.ts` | 131 | `97e9aa2ffd05e195616c7de3fb59e528c33715e55ed48fe874a8c7d687b79f3c` | **rewrite-vanilla** | `src/investigation.js` | PR #4 |
| `src/investigation/saved-question-session.ts` | 46 | `821c24fdb905280d0fbe81dfa666595c0977a8dd63c9aaadf6bdd2994e5e8aaa` | **rewrite-vanilla** | `src/investigation.js` | PR #4 |
| `src/investigation/source-handoff.ts` | 19 | `6f7a38a1b030ab1020cc4efb1d8ba7e679f9df948a849ce11fcef9f5ebc975a4` | **rewrite-vanilla** | `src/investigation.js` | PR #4 |
| `src/logic-functions/prepare-finance-export.logic-function.ts` | 27 | `f82cefdf67013f192cce02fcebdcbd4f51c46cb4c464fc2a27d5063edc930ef3` | **rewrite-vanilla** | `src/investigation.js` | PR #4 |
| `src/navigation-menu-items/coverage-periods.navigation-menu-item.ts` | 9 | `1085423f0f4429805c21a64c302b5b090fec8664810d754743280080186989cf` | **drop** | `—` | PR #1 |
| `src/navigation-menu-items/finance-audit-dashboard.navigation-menu-item.ts` | 21 | `742110646b59c8d40bfd77f9cb9eb3c685b1109ef512051b37dbfa3086113875` | **drop** | `—` | PR #1 |
| `src/navigation-menu-items/finance-facts.navigation-menu-item.ts` | 9 | `629f83289fa66436101ac28e7031df00e970681b3f915986f879e39a8fe2e94e` | **drop** | `—` | PR #1 |
| `src/navigation-menu-items/finance-folder.navigation-menu-item.ts` | 7 | `f833f1c7a9d5ee80ad62c0c0b24c1366a10abb18de33b94c09d8548b860b6681` | **drop** | `—` | PR #1 |
| `src/navigation-menu-items/financial-accounts.navigation-menu-item.ts` | 15 | `b96210d69cb106e938c87b7ac0f7fd51fc4feb483a3e0faf2649423dabd1bc84` | **drop** | `—` | PR #1 |
| `src/navigation-menu-items/reconciliation-exceptions.navigation-menu-item.ts` | 9 | `42cb9fd0271ebdf0321fb62cc3bc6a6bfe4d1c2ffc70d4e3050576ff00c1acc2` | **drop** | `—` | PR #1 |
| `src/navigation-menu-items/source-artifacts.navigation-menu-item.ts` | 9 | `0055f115a4c93b6474a5f68e9a67000dd9b02ad5881cf27d03bcbd0f66327748` | **drop** | `—` | PR #1 |
| `src/objects/coverage-period.object.ts` | 122 | `141a68ee5f628170763412f4fad0a1e957cfd1ca8657de62ec0c9208c248a79a` | **drop** | `—` | PR #1 |
| `src/objects/finance-fact.object.ts` | 317 | `57a402803dd08db1d41f0e3044a5921bcdebc9d6636014cba9d89a3e337bcbb0` | **drop** | `—` | PR #1 |
| `src/objects/financial-account.object.ts` | 59 | `4759e69521c4f5b0ce828d1c303a89281000cc3a7e9e9cf9b7ab16daddbf39ff` | **drop** | `—` | PR #1 |
| `src/objects/import-receipt.object.ts` | 142 | `627aaf0bda74eb50f3fe9b0cef71ab4577887a3d3fcaa5d5491dd1d9b520a992` | **drop** | `—` | PR #1 |
| `src/objects/reconciliation-exception.object.ts` | 152 | `63ee9fff6e6646451f113369a4149250fa8103de36bc7cf74be85220c04f807f` | **drop** | `—` | PR #1 |
| `src/objects/source-artifact.object.ts` | 252 | `b2a06bf774009eb853e25727cc9a42a2f789a05b93a19b30afe252c63e6c4877` | **drop** | `—` | PR #1 |
| `src/page-layouts/finance-audit-dashboard.page-layout.ts` | 137 | `e14d0f0863e030e42ade110872824505574979437b751ee4dc80c83d686dd1ca` | **drop** | `—` | PR #1 |
| `src/preparation/plaid-export.ts` | 211 | `670dc51fa9ef94580a163de951bd803daf9d811ab9adc90d842395165b7010b2` | **rewrite-vanilla** | `src/investigation.js` | PR #4 |
| `src/roles/finance-fixture-reader.role.ts` | 37 | `d8ce512b73244fdfb0afbd6c1298a78b8008fc7816f1bc0fe29927134d389892` | **drop** | `—` | PR #1 |
| `src/views/coverage-periods.view.ts` | 31 | `c2afbfdeb5ae3e0e9dc5d723f82e6e134102ba2a89d6d7de4b3c93a23d4d44e2` | **rewrite-vanilla** | `public/` | PR #5 |
| `src/views/finance-facts.view.ts` | 25 | `25c556de5ed538a963a1ae3ffc8fc6173ef53945bfa82f1fc3c529a215787eb6` | **rewrite-vanilla** | `public/` | PR #5 |
| `src/views/financial-accounts.view.ts` | 28 | `4e635e1ae7591678a1c9d62962195b1242cb6f0c7ab41f340c8f3329c329319c` | **rewrite-vanilla** | `public/` | PR #5 |
| `src/views/import-receipts.view.ts` | 31 | `29796d0bc02186cc8ca3279d6573a426d46614c40a43f8d2e5c4e5f11416991d` | **rewrite-vanilla** | `public/` | PR #5 |
| `src/views/reconciliation-exceptions.view.ts` | 29 | `3b70bd59d627e9a1ff70afd69dc16c5caf0d9f235661330a2183ffb1fc7126e0` | **rewrite-vanilla** | `public/` | PR #5 |
| `src/views/source-artifacts.view.ts` | 33 | `dc53e44a5d53df06d8d08f72362c5fb250ac3e3c8577470308001b9f20c07722` | **rewrite-vanilla** | `public/` | PR #5 |
| `tsconfig.json` | 41 | `1cecd2608411be0bfcae4ae92e0a8a1e6ec1c15a0e6a2121a1f630682cbb426f` | **drop** | `—` | PR #1 |
| `tsconfig.spec.json` | 9 | `cfbb79cf2c6ea7576cc34877dabf470244251875a7e417083eb058d82b06c484` | **drop** | `—` | PR #1 |
| `vitest.unit.config.ts` | 14 | `e4a27b85c3afd68e186f599b49908e0f804e7c405afe8e707aa125136da87e46` | **drop** | `—` | PR #1 |
| `yarn.lock` | 3993 | `214db49994e0accaa49d2ed2567a39ad243af7a21d45ece63b6b32c6e555fdad` | **drop** | `—` | PR #1 |

## Dependency and license review

The source package declares `UNLICENSED`, Node `^24.5.0`, Yarn `4.13.0`, Twenty `2.37.0`, and Twenty/React development dependencies (`twenty-sdk`, `twenty-client-sdk`, `twenty-ui`, React, Vite, TypeScript, Vitest and oxlint). Those package-manager, framework and UI dependencies are not copied into this vanilla target. Future ports must re-check each dependency's license and security posture at the receiving PR; no source license grant is inferred by this manifest. The target remains Node 24/npm with plain ESM `.js` and the Node test runner.

The source fixture and PDF hashes are included for provenance only. They are synthetic fixtures; no real client, provider, production identifier, credential, token, cookie, database row or live export is included or moved.

## Custody, rollback and archive gate

- **No data or credentials move.** This PR changes documentation and tests only. The target remains synthetic-only and staging-scoped.
- Source remains preserved at `mhoo-twenty-next@336a6f50c0dc286b9f25f7d98b67ffcd5ecb4628`; target rollback is the pre-PR target head `mhoo-finance@540b33f3a16011132a79be9cc7e88f8102c02f3c`. Revert this documentation commit/PR to roll back the baseline; later extraction PRs must retain the source snapshot and exact hashes.
- No Twenty adapter remains in the target ownership model. Runtime cutover, deployment, database changes, provider access, credential changes and archive deletion remain separately gated.

Archive gate from MHO-353 (all items require current evidence before archive approval):

- [ ] Every portable source file, fixture, contract, test vector and evidence rule has a target PR, explicit drop decision, or preserved archival artifact; both immutable heads are recorded here.
- [ ] Target current head passes `npm test`, `npm run coverage`, `npm run check`, and `npm run deploy:check`; hosted checks are green and current.
- [ ] Acceptance proves evidence hash/pointer verification, append-only retries/conflicts, missing evidence, partial coverage, denied Access and synthetic classification.
- [ ] No real data, credentials, provider tokens or unapproved production authority moved; any unknown Twenty database state has an owner-approved read-only disposition.
- [ ] `mhoo-pos` ownership and the Finance read-only contract are recorded; no duplicate Clover vault or write path exists.
- [ ] Cloudflare D1/R2/Worker ownership, routes, Access audience/domain, rollback and teardown authority are read back; Worker live status is explicitly verified.
- [ ] Open Finance/Clover/auth branches and PRs have merged, closed, or named owners/retention outcomes.
- [ ] References in `mhoo`, infrastructure, mhoo-room, connectors and GHCR/release verification are updated and checked; no automation allowlist or immutable image custody still requires Twenty.
- [ ] Owner approves archive after a final read-only reference search and preserves a tagged/source snapshot and rollback contact.

This PR records the gate; it does not check any box by declaration.
