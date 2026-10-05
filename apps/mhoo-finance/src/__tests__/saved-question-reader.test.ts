import { describe, expect, it, vi } from 'vitest';
import { buildSnapshot } from '../contracts/finance-contract';
import { goldenContract } from '../fixtures/contract-golden';
import { createSavedQuestionReader, SAVED_QUESTION_FIELDS, type SavedPermission, type SavedPublication, type SavedQuestionRequest } from '../investigation/saved-question-reader';

function setup() {
  const golden = goldenContract();
  const snapshot = buildSnapshot(golden.manifest, golden.observations, golden.selection);
  let permission: SavedPermission | null = { subjectId: 'person', permissionRevision: 'role-1', workspaceId: 'workspace-a', engagementId: 'engagement-a',
    accounts: golden.selection.bankAccounts, actions: ['summary', 'unresolved', 'trace'], snapshotHashes: [snapshot.snapshotHash], fields: [...SAVED_QUESTION_FIELDS] };
  let publication: SavedPublication | null = { workspaceId: 'workspace-a', engagementId: 'engagement-a', revision: 'publication-1', status: 'CURRENT', snapshot };
  const ports = {
    resolvePermission: vi.fn(async (_identity: string) => permission),
    loadPublication: vi.fn(async () => publication),
    isCurrent: vi.fn(async () => true),
    readArtifact: vi.fn(async () => new TextEncoder().encode(golden.sourceBytes) as Uint8Array | null),
  };
  const read = createSavedQuestionReader(ports);
  const request: SavedQuestionRequest = { workspaceId: 'workspace-a', engagementId: 'engagement-a', snapshotHash: snapshot.snapshotHash, question: 'observed-outflows', limit: 2 };
  return { golden, snapshot, ports, read, request, revoke: () => { permission = null; },
    permission: (patch: Partial<SavedPermission>) => { permission = { ...permission!, ...patch }; },
    publication: (value: SavedPublication | null) => { publication = value; }, current: () => publication! };
}

describe('saved question read adapter, synthetic native dependency stand-ins only', () => {
  it('binds question chart, paginated rows and targeted source to one snapshot with agent disabled', async () => {
    const s = setup();
    const first = await s.read('identity', s.request);
    expect(first.status).toBe('READY');
    if ((first.status !== 'READY' && first.status !== 'EMPTY')) throw Error('missing result');
    expect(first.rows).toHaveLength(2);
    expect(first.groups[0].outflowMinor).toBe(s.snapshot.metrics.observed_bank_outflows.minor);
    expect(first.metadata.sourceClass).toBe('SYNTHETIC');
    expect(first.metadata.coverage).toContain('NOT_PROVEN_COMPLETE');
    const second = await s.read('identity', { ...s.request, cursor: first.nextCursor! });
    if ((second.status !== 'READY' && second.status !== 'EMPTY')) throw Error('missing page');
    expect(second.rows.some((row) => first.rows.some((previous) => previous.record === row.record))).toBe(false);
    expect(second.groups).toEqual(first.groups);
    const trace = await s.read('identity', { ...s.request, month: '2026-01', record: first.rows[0].record });
    if ((trace.status !== 'READY' && trace.status !== 'EMPTY')) throw Error('missing trace');
    expect(trace.metadata.snapshotHash).toBe(first.metadata.snapshotHash);
    expect(trace.trace?.sourceRowKey).toBeTruthy();
    expect(s.ports.readArtifact).toHaveBeenCalledOnce();
    expect(JSON.stringify(trace)).not.toContain('Synthetic repeated description');
    expect(trace.metadata.queryReceipt).not.toBe(first.metadata.queryReceipt);
  });
  it.each(['workspaceId', 'engagementId', 'snapshotHash'] as const)('rejects changed %s without loading data', async (key) => {
    const s = setup();
    expect(await s.read('id', { ...s.request, [key]: 'other' })).toEqual({ status: 'DENIED' });
    expect(s.ports.loadPublication).not.toHaveBeenCalled();
  });
  it.each(['accounts', 'fields', 'actions'] as const)('rejects missing %s', async (key) => {
    const s = setup(); s.permission({ [key]: [] });
    expect(await s.read('id', s.request)).toEqual({ status: 'DENIED' });
  });
  it('reauthorizes repeated reads instead of serving previously permitted data', async () => {
    const s = setup(); await s.read('id', s.request); s.revoke();
    expect(await s.read('id', s.request)).toEqual({ status: 'DENIED' });
    expect(s.ports.loadPublication).toHaveBeenCalledTimes(1);
  });
  it.each(['revoke', 'workspace', 'revision'])('discards trace after in-flight %s', async (change) => {
    const s = setup();
    s.ports.readArtifact.mockImplementation(async () => {
      if (change === 'revoke') s.revoke();
      else s.permission(change === 'workspace' ? { workspaceId: 'other' } : { permissionRevision: 'role-2' });
      return new TextEncoder().encode(s.golden.sourceBytes);
    });
    expect(await s.read('id', { ...s.request, record: 'repeat-a@1' })).toEqual({ status: 'DENIED' });
  });
  it('withholds publication revoked during I/O without metadata', async () => {
    const s = setup(); s.ports.isCurrent.mockResolvedValue(false);
    expect(await s.read('id', s.request)).toEqual({ status: 'WITHHELD', reason: 'STALE_SNAPSHOT' });
  });
  it.each(['missing', 'stale', 'unverified', 'hash'])('withholds %s snapshot without fallback totals', async (state) => {
    const s = setup();
    if (state === 'missing') s.publication(null);
    if (state === 'stale') s.publication({ ...s.current(), status: 'STALE' });
    if (state === 'unverified') s.publication({ ...s.current(), status: 'UNVERIFIED' });
    if (state === 'hash') s.publication({ ...s.current(), snapshot: { ...s.snapshot, snapshotHash: 'other' } });
    const result = await s.read('id', s.request);
    expect(result.status).toBe('WITHHELD'); expect(result).not.toHaveProperty('groups');
  });
  it('does not promote a derived partial CSV export into an eligible baseline', async () => {
    const s = setup();
    const copy = JSON.parse(JSON.stringify(s.snapshot));
    copy.manifest.acquisition.class = 'DERIVED_TOOL_EXPORT';
    copy.manifest.acquisition.retrieval = 'PARTIAL';
    s.publication({ ...s.current(), snapshot: copy });
    expect(await s.read('id', s.request)).toEqual({ status: 'WITHHELD', reason: 'UNVERIFIED_SNAPSHOT' });
  });
  it('rejects tampered materialized metrics despite unchanged snapshot hash', async () => {
    const s = setup(); const copy = JSON.parse(JSON.stringify(s.snapshot));
    copy.metrics.observed_bank_outflows.minor = '1'; s.publication({ ...s.current(), snapshot: copy });
    expect(await s.read('id', s.request)).toEqual({ status: 'WITHHELD', reason: 'UNVERIFIED_SNAPSHOT' });
  });
  it.each([null, new TextEncoder().encode('corrupt')])('withholds missing/corrupt target evidence', async (bytes) => {
    const s = setup(); s.ports.readArtifact.mockResolvedValue(bytes);
    expect(await s.read('id', { ...s.request, record: 'repeat-a@1' })).toEqual({ status: 'WITHHELD', reason: 'TARGET_EVIDENCE_UNVERIFIED' });
  });
  it('denies out-of-chart or out-of-month traces before source access', async () => {
    const s = setup();
    expect(await s.read('id', { ...s.request, record: 'large@1' })).toEqual({ status: 'DENIED' });
    expect(await s.read('id', { ...s.request, record: 'repeat-a@1', month: '2026-02' })).toEqual({ status: 'DENIED' });
    expect(s.ports.readArtifact).not.toHaveBeenCalled();
  });
  it('binds cursors to permission revision, question, month and limit', async () => {
    const s = setup(); const first = await s.read('id', s.request);
    if ((first.status !== 'READY' && first.status !== 'EMPTY')) throw Error('no cursor');
    for (const patch of [{ question: 'unresolved-evidence' as const }, { month: '2026-01' }, { limit: 3 }]) {
      expect(await s.read('id', { ...s.request, ...patch, cursor: first.nextCursor! })).toEqual({ status: 'DENIED' });
    }
    s.permission({ permissionRevision: 'role-2' });
    expect(await s.read('id', { ...s.request, cursor: first.nextCursor! })).toEqual({ status: 'DENIED' });
  });
  it.each([0, 51, -1, 1.5])('rejects page limit %s', async (limit) => {
    const s = setup(); expect(await s.read('id', { ...s.request, limit })).toEqual({ status: 'DENIED' });
  });
  it('returns no amount for unresolved-evidence counts and does not mutate later reads', async () => {
    const s = setup(); const request = { ...s.request, question: 'unresolved-evidence' as const };
    const first = await s.read('id', request);
    if ((first.status !== 'READY' && first.status !== 'EMPTY')) throw Error('no result');
    expect(first.groups.every((group) => group.outflowMinor === null)).toBe(true);
    first.groups[0].count = -1; first.rows[0].sourceAmount = '999';
    const again = await s.read('id', request);
    if ((again.status !== 'READY' && again.status !== 'EMPTY')) throw Error('no result');
    expect(again.groups[0].count).toBeGreaterThan(0);
    expect(again.rows[0].sourceAmount).not.toBe('999');
  });
  it('fails safely when native dependency throws', async () => {
    const s = setup(); s.ports.loadPublication.mockRejectedValue(Error('private details'));
    expect(await s.read('id', s.request)).toEqual({ status: 'FAILED' });
  });
});

import { createSavedQuestionSession } from '../investigation/saved-question-session';

describe('question/chart/row/source session with injected authenticated reader', () => {
  it('uses the adapter for every selection and clears evidence on reset', async () => {
    const s = setup(); const read = vi.fn((request: SavedQuestionRequest) => s.read('identity', request));
    const ui = createSavedQuestionSession(read);
    await ui.ask(s.request); await ui.selectMonth('2026-01');
    const result = ui.getState().result;
    if (!result || (result.status !== 'READY' && result.status !== 'EMPTY')) throw Error('no rows');
    await ui.selectRow(result.rows[0].record);
    expect(read).toHaveBeenCalledTimes(3);
    expect(ui.getState().result).toHaveProperty('trace.sha256');
    ui.reset(); expect(ui.getState()).toEqual({ loading: false, request: null, result: null });
  });
  it('discards late result on workspace switch and clears previous answer immediately', async () => {
    const s = setup();
    let finish!: (value: Awaited<ReturnType<typeof s.read>>) => void;
    const response = await s.read('id', s.request);
    const ui = createSavedQuestionSession(() => new Promise((resolve) => { finish = resolve; }));
    const pending = ui.ask(s.request);
    expect(ui.getState().loading).toBe(true); expect(ui.getState().result).toBeNull();
    ui.reset(); finish(response); await pending;
    expect(ui.getState().result).toBeNull();
  });
  it('does not keep a previously visible result after access revocation', async () => {
    const s = setup(); const ui = createSavedQuestionSession((request) => s.read('id', request));
    await ui.ask(s.request); s.revoke(); await ui.selectMonth('2026-01');
    expect(ui.getState().result).toEqual({ status: 'DENIED' });
  });
});

describe('authorized selected population', () => {
  it('does not count card or other out-of-selection accounts in exclusions or forward freeform limitations', async () => {
    const s = setup();
    const copy = structuredClone(s.golden);
    const privateRow = { ...copy.observations[0], factKey: 'private-pos', sourceEventKey: 'private-pos', accountKey: 'private-pos', sourceAmount: '1.00' };
    copy.manifest.accounts.push({ accountKey: 'private-pos', type: 'POS', currency: 'USD' });
    copy.observations.push(privateRow, { ...privateRow, artifactId: 'synthetic-duplicate' });
    copy.manifest.artifacts[0].rowCount++;
    copy.manifest.artifacts[1].rowCount++;
    copy.manifest.acquisition.retrievedRows += 2;
    copy.manifest.limitations.push('DO NOT EXPOSE unrelated account note');
    const snapshot = buildSnapshot(copy.manifest, copy.observations, copy.selection);
    s.permission({ snapshotHashes: [snapshot.snapshotHash] });
    s.publication({ ...s.current(), snapshot });
    const result = await s.read('id', { ...s.request, snapshotHash: snapshot.snapshotHash });
    if (result.status !== 'READY') throw Error('no result');
    const selected = copy.observations.filter((row) => copy.selection.bankAccounts.includes(row.accountKey));
    expect(result.metadata.excluded).toBe(selected.length - snapshot.eligible.length);
    expect(JSON.stringify(result)).not.toContain('private-pos');
    expect(JSON.stringify(result)).not.toContain('DO NOT EXPOSE');
  });
  it('requires only the chosen question action, then trace permission separately', async () => {
    const s = setup(); s.permission({ actions: ['summary'] });
    expect((await s.read('id', s.request)).status).toBe('READY');
    expect(await s.read('id', { ...s.request, record: 'repeat-a@1' })).toEqual({ status: 'DENIED' });
    s.permission({ actions: ['unresolved'] });
    expect((await s.read('id', { ...s.request, question: 'unresolved-evidence' })).status).toBe('READY');
  });
});
