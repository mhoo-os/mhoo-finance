# Mhoo Finance provenance

## Destination custody

- Original destination: `mhoo-os/mhoo-twenty-next`
- Original path: `packages/twenty-apps/internal/mhoo-finance`
- Canonical destination after ADR-0015 extraction:
  `mhoo-os/finance-investigation-workspace/apps/mhoo-finance`
- Exact extraction source: `29436a21fc23f7f8119e80c4ea4014439dc31117`
- Destination base: `88a21f624f17ecce805fb7fd6f9d8dc3f7d3c8b6`
- Phase A issue: MHO-146
- Port seed: `mhoo-os/mhoo-twenty` PR #45 at
  `6bef8da9004ea67607315422454a6aa52a65dfd3`

## Accepted carry-forward

The seed contributes deterministic synthetic fixtures, immutable artifact and
receipt concepts, revision-aware normalized facts, coverage periods,
deterministic reconciliation exceptions, bounded lineage, native object/view
definitions, standalone navigation, and native graph configuration.

The dashboard presentation is redesigned against the canonical Twenty UI
package and theme. The complete path classification is in [PORTING.md](./PORTING.md).

## Explicit exclusions

This Phase A App contains no:

- real Hass record, account number, credential, token, or provider request;
- Clover OAuth configuration, client secret, connection provider, tool, or
  role-based provider authority;
- deployed Workspace state, installation, user invitation, production setting,
  Cloudflare mutation, or live dashboard claim.

The only Clover-shaped entries are clearly synthetic fixture rows used to test
POS overlap and reconciliation semantics.

## Verification scope

Fixture generation, behavioral unit tests, lint, App manifest build, and
typecheck are source evidence. The Phase A fixture adapter intentionally has a
fail-closed synthetic Workspace/role selection contract, but it does not prove
runtime authorization. A mounted Workspace preview, server role and
cross-workspace enforcement, client installation, and any real data remain
separate Phase B gates.
