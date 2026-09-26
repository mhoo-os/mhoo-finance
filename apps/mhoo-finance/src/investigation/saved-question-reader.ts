import { createHash } from 'node:crypto';
import { buildSnapshot, canonical, hash, recordKey, type Snapshot } from '../contracts/finance-contract';
import { minor, sourceMoney, sumMoney } from '../contracts/money';
import type { ResolvedReadPermission } from '../contracts/read-fixture';

export const SAVED_QUESTION_FIELDS = ['factKey', 'revision', 'accountKey', 'date', 'sourceAmount', 'currency', 'signConvention', 'classification', 'artifactId', 'sourceRowKey'] as const;
export type SavedPermission = ResolvedReadPermission & { fields: string[] };
export type SavedQuestionRequest = {
  workspaceId: string; engagementId: string; snapshotHash: string;
  question: 'observed-outflows' | 'unresolved-evidence';
  month?: string; record?: string; cursor?: { query: string; after: string }; limit?: number;
};
export type SavedPublication = {
  workspaceId: string; engagementId: string; revision: string;
  status: 'CURRENT' | 'STALE' | 'UNVERIFIED'; snapshot: Snapshot | null;
};
/** Trusted server dependencies, never deserialized from UI/MCP input. The native
 * host must resolve the triggering person's role intersected with the App role
 * and load a durable publication through Twenty. A digest grants no authority. */
export type SavedReadPorts<Identity> = {
  resolvePermission(identity: Identity): Promise<SavedPermission | null>;
  loadPublication(grant: SavedPermission): Promise<SavedPublication | null>;
  isCurrent(grant: SavedPermission, publication: SavedPublication): Promise<boolean>;
  readArtifact(grant: SavedPermission, artifactId: string, locator: string): Promise<Uint8Array | null>;
};
const denied = () => ({ status: 'DENIED' as const });
const withheld = (reason: 'MISSING_SNAPSHOT' | 'STALE_SNAPSHOT' | 'UNVERIFIED_SNAPSHOT' | 'TARGET_EVIDENCE_UNVERIFIED') => ({ status: 'WITHHELD' as const, reason });
const clone = <T>(value: T): T => JSON.parse(canonical(value)) as T;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** No cache or synthetic fallback. Every chart, page and trace reauthorizes.
 * This source adapter registers no handler; native host wiring remains a gate. */
export function createSavedQuestionReader<Identity>(ports: SavedReadPorts<Identity>) {
  return async (identity: Identity, input: SavedQuestionRequest) => {
    try {
      // Capture request before any async boundary.
      let request: SavedQuestionRequest;
      try { request = clone(input); } catch { return denied(); }
      const resolved = await ports.resolvePermission(identity);
      if (!resolved) return denied();
      const grant = clone(resolved);
      if (!request || Object.keys(request).some((key) => !['workspaceId', 'engagementId', 'snapshotHash', 'question', 'month', 'record', 'cursor', 'limit'].includes(key)) ||
        !grant.subjectId || !grant.permissionRevision || request.workspaceId !== grant.workspaceId || request.engagementId !== grant.engagementId ||
        !grant.snapshotHashes.includes(request.snapshotHash) || !grant.actions.includes(request.question === 'observed-outflows' ? 'summary' : 'unresolved') ||
        (request.record !== undefined && !grant.actions.includes('trace')) || !SAVED_QUESTION_FIELDS.every((field) => grant.fields.includes(field))) return denied();
      const limit = request.limit ?? 50;
      if (!['observed-outflows', 'unresolved-evidence'].includes(request.question) || !Number.isSafeInteger(limit) || limit < 1 || limit > 50 ||
        (request.month !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(request.month)) ||
        (request.record !== undefined && (typeof request.record !== 'string' || !request.record || request.cursor !== undefined)) ||
        (request.cursor !== undefined && (!request.cursor || Object.keys(request.cursor).sort().join(',') !== 'after,query' || typeof request.cursor.query !== 'string' || typeof request.cursor.after !== 'string'))) return denied();
      const loaded = await ports.loadPublication(clone(grant));
      // Resolve again before exposing publication state, including absent data.
      const authorized = async () => {
        const current = await ports.resolvePermission(identity);
        return current !== null && canonical(current) === canonical(grant);
      };
      if (!await authorized()) return denied();
      if (!loaded) return withheld('MISSING_SNAPSHOT');
      const publication = clone(loaded);
      if (publication.workspaceId !== grant.workspaceId || publication.engagementId !== grant.engagementId) return denied();
      if (publication.status === 'STALE') return withheld('STALE_SNAPSHOT');
      if (publication.status !== 'CURRENT' || !publication.revision) return withheld('UNVERIFIED_SNAPSHOT');
      if (!publication.snapshot) return withheld('MISSING_SNAPSHOT');
      const saved = publication.snapshot;
      if (saved.snapshotHash !== request.snapshotHash) return withheld('STALE_SNAPSHOT');
      if (!saved.selection.bankAccounts.every((account) => grant.accounts.includes(account))) return denied();
      // Larger populations require persisted summary/page queries, never truncation.
      if (saved.observations.length > 10000) return withheld('UNVERIFIED_SNAPSHOT');
      let snapshot: Snapshot;
      try {
        snapshot = buildSnapshot(saved.manifest, saved.observations, saved.selection);
        if (canonical(snapshot) !== canonical(saved)) return withheld('UNVERIFIED_SNAPSHOT');
      } catch { return withheld('UNVERIFIED_SNAPSHOT'); }
      const binding = hash({ grant, revision: publication.revision, snapshot: snapshot.snapshotHash, question: request.question, month: request.month ?? null, limit, procedure: 'saved-question/v1' });
      const eligible = new Set(snapshot.eligible);
      const selectedObservations = snapshot.observations.filter((row) => snapshot.selection.bankAccounts.includes(row.accountKey) && row.date.value.slice(0, 10) >= snapshot.selection.period.from && row.date.value.slice(0, 10) <= snapshot.selection.period.to);
      const population = selectedObservations.filter((row) => eligible.has(recordKey(row)) && snapshot.manifest.artifacts.find((artifact) => artifact.artifactId === row.artifactId)?.duplicateOf === null);
      const rows = population.filter((row) => request.question === 'unresolved-evidence' ? row.classification === 'UNKNOWN' : minor(sourceMoney(row.sourceAmount, row.currency, row.signConvention).minor) < 0n)
        .sort((a, b) => compare(recordKey(a), recordKey(b)));
      const groups = [...new Set(rows.map((row) => row.date.value.slice(0, 7)))].sort().map((month) => {
        const members = rows.filter((row) => row.date.value.startsWith(month));
        return { month, count: members.length, outflowMinor: request.question === 'observed-outflows'
          ? sumMoney(members.map((row) => ({ currency: row.currency, minor: (-minor(sourceMoney(row.sourceAmount, row.currency, row.signConvention).minor)).toString() })), snapshot.selection.currency).minor : null };
      });
      const selected = rows.filter((row) => !request.month || row.date.value.startsWith(request.month));
      let offset = 0;
      if (request.cursor) {
        if (request.cursor.query !== binding) return denied();
        offset = selected.findIndex((row) => recordKey(row) === request.cursor!.after) + 1;
        if (!offset) return denied();
      }
      const page = request.record ? selected.filter((row) => recordKey(row) === request.record) : selected.slice(offset, offset + limit);
      if (request.record && page.length !== 1) return denied();
      let trace: { artifactId: string; receiptId: string; locator: string; sha256: string; sourceRowKey: string } | null = null;
      let evidenceVerified = true;
      if (request.record) {
        const row = page[0];
        const artifact = snapshot.manifest.artifacts.find((item) => item.artifactId === row.artifactId)!;
        const bytes = await ports.readArtifact(clone(grant), artifact.artifactId, artifact.locator);
        evidenceVerified = bytes !== null && createHash('sha256').update(bytes).digest('hex') === artifact.sha256;
        trace = { artifactId: artifact.artifactId, receiptId: artifact.receiptId, locator: artifact.locator, sha256: artifact.sha256, sourceRowKey: row.sourceRowKey };
      }
      // Revalidate after I/O; stale in-flight access never returns rows or metadata.
      const current = await ports.isCurrent(clone(grant), clone(publication));
      if (!await authorized()) return denied();
      if (!current) return withheld('STALE_SNAPSHOT');
      if (!evidenceVerified) return withheld('TARGET_EVIDENCE_UNVERIFIED');
      const truncated = !request.record && offset + limit < selected.length;
      return {
        status: rows.length ? 'READY' as const : 'EMPTY' as const,
        metadata: {
          workspaceId: grant.workspaceId, engagementId: grant.engagementId, snapshotHash: snapshot.snapshotHash,
          manifestHash: snapshot.manifestHash, factsHash: snapshot.factsHash, publicationRevision: publication.revision,
          selection: clone(snapshot.selection), metricVersion: 'bank-movement/v1', procedureVersion: 'saved-question/v1',
          queryReceipt: hash({ binding, record: request.record ?? null, after: request.cursor?.after ?? null }),
          dateBasis: 'SOURCE_CALENDAR_DATE', dataAsOf: snapshot.manifest.acquisition.sourceAsOf, sourceClass: snapshot.manifest.acquisition.class,
          coverage: 'SELECTED_BASELINE_ONLY_NOT_PROVEN_COMPLETE', eligible: snapshot.eligible.length,
          excluded: selectedObservations.length - population.length, unresolved: snapshot.metrics.unresolved.length,
          limitations: [ 'Observed bank movements are not profit or a fraud finding.',
            'Trace verifies artifact bytes and recorded row locator, not independent parser or statement completeness.',
            ...(snapshot.manifest.acquisition.class === 'SYNTHETIC' ? ['Synthetic source proof only; excluded from real financial conclusions.'] : [])],
        },
        groups, matchedCount: rows.length, selectedCount: selected.length,
        rows: page.map((row) => ({ record: recordKey(row), accountKey: row.accountKey, date: clone(row.date), sourceAmount: row.sourceAmount,
          currency: row.currency, signConvention: row.signConvention, classification: row.classification })), trace,
        nextCursor: truncated ? { query: binding, after: recordKey(page[page.length - 1]) } : null, truncated,
      };
    } catch { return { status: 'FAILED' as const }; }
  };
}
export type SavedQuestionResponse = Awaited<ReturnType<ReturnType<typeof createSavedQuestionReader>>>;
