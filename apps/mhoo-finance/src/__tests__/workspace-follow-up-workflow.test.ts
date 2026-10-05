import { describe, expect, it } from 'vitest';
import {
  createFollowUpTestHost,
  FIXTURE_IDS as ids,
} from './fixtures/follow-up-test-host';
import {
  createWorkspaceFollowUp,
  listFollowUpNativeChoices,
  addWorkspaceFollowUpPerson,
  submitWorkspaceFollowUpEvidence,
  saveWorkspaceFollowUpDraft,
  acceptWorkspaceFollowUpEvidence,
} from '../investigation/workspace-follow-up-workflow';
import {
  approveWorkspaceFinanceDraft,
  updateWorkspaceFinanceFollowUpState,
} from '../investigation/workspace-finance-follow-ups';
import type { FinanceFollowUpState } from '../investigation/finance-follow-up-contract';

const create = (host: ReturnType<typeof createFollowUpTestHost>) =>
  createWorkspaceFollowUp(
    {
      taskId: ids.task,
      title: 'Which receipt supports this payment?',
      factId: ids.fact,
    },
    host.client,
  );
const version = (host: ReturnType<typeof createFollowUpTestHost>) => ({
  taskId: ids.task,
  from: host.tasks[ids.task].financeFollowUpState as FinanceFollowUpState,
  expectedUpdatedAt: host.tasks[ids.task].updatedAt as string,
  expectedRevision: host.tasks[ids.task].financeRevision as number,
  operationId: crypto.randomUUID(),
});
const draft = {
  mailboxLabel: 'Planned sender',
  subject: 'Receipt request',
  body: 'Please share the receipt.\nThank you.',
  recipientPersonIds: [ids.person],
  attachmentReferences: [ids.artifact],
};
const prepare = async (host: ReturnType<typeof createFollowUpTestHost>) => {
  await create(host);
  await addWorkspaceFollowUpPerson(
    { ...version(host), personId: ids.person, role: 'Owner' },
    host.client,
  );
  await submitWorkspaceFollowUpEvidence(
    { ...version(host), kind: 'DOCUMENT', artifactId: ids.artifact },
    host.client,
  );
  await saveWorkspaceFollowUpDraft({ ...version(host), draft }, host.client);
};
describe('native Follow-ups persisted workflow', () => {
  it('creates, submits, persists an exact approved-not-sent draft, links and reviews a reply, and resolves without changing source facts', async () => {
    const host = createFollowUpTestHost();
    const original = structuredClone(host.sources);
    await prepare(host);
    await submitWorkspaceFollowUpEvidence(
      {
        ...version(host),
        kind: 'EXPLANATION',
        explanation: 'User says this was supplies; not yet corroborated.',
      },
      host.client,
    );
    let task = (await host.read()).followUps[0];
    expect(task.draftEmail).toEqual(draft);
    await approveWorkspaceFinanceDraft(
      {
        taskId: task.id,
        from: 'AWAITING_APPROVAL',
        financeState: task.state,
        expectedUpdatedAt: task.updatedAt,
        expectedRevision: task.revision,
        draftEmail: task.draftEmail!,
        people: task.people,
        at: task.updatedAt,
      },
      host.client,
    );
    expect(host.tasks[ids.task].financeEmailApproval).toBe('APPROVED_NOT_SENT');
    await submitWorkspaceFollowUpEvidence(
      {
        ...version(host),
        kind: 'REPLY',
        noteId: ids.note,
        correlationKey: `MHOO_FINANCE_V1:${ids.task}`,
        shareReference: true,
      },
      host.client,
    );
    task = (await host.read()).followUps[0];
    expect(
      task.evidence.find((e) => e.reference === ids.note)?.reviewerAccepted,
    ).toBe(false);
    expect(JSON.stringify(task)).not.toContain('Private synthetic body');
    await acceptWorkspaceFollowUpEvidence(
      { ...version(host), reference: ids.note, kind: 'EMAIL' },
      host.client,
    );
    await updateWorkspaceFinanceFollowUpState(
      {
        ...version(host),
        to: 'READY_FOR_REVIEW',
        at: new Date().toISOString(),
      },
      host.client,
    );
    await updateWorkspaceFinanceFollowUpState(
      { ...version(host), to: 'RESOLVED', at: new Date().toISOString() },
      host.client,
    );
    const reloaded = await createFollowUpTestHost({ tasks: host.tasks }).read();
    expect(reloaded.followUps[0]).toMatchObject({
      state: 'RESOLVED',
      nativeStatus: 'DONE',
      emailApproval: 'APPROVED_NOT_SENT',
      draftEmail: draft,
    });
    expect(host.sources).toEqual(original);
    expect(
      host.calls
        .filter((c) => c.method !== 'GET')
        .every((c) => c.path === '/rest/tasks'),
    ).toBe(true);
  });
  it('recovers creation after a lost response using the same ID without duplicating Tasks', async () => {
    const host = createFollowUpTestHost();
    host.control.loseResponse = true;
    await create(host);
    await create(host);
    expect(Object.keys(host.tasks)).toEqual([ids.task]);
  });
  it('never turns denied source or Task access into a grant or write', async () => {
    for (const mode of ['denied', 'denySource'] as const) {
      const host = createFollowUpTestHost();
      host.control[mode] = true;
      await expect(create(host)).rejects.toMatchObject({ status: 403 });
      expect(Object.keys(host.tasks)).toHaveLength(0);
    }
  });
  it('rejects missing/invalid/unauthorized source, reply ambiguity, and unselected recipients before writing', async () => {
    const host = createFollowUpTestHost();
    await create(host);
    const count = () => host.calls.filter((c) => c.method === 'PATCH').length;
    await expect(
      submitWorkspaceFollowUpEvidence(
        {
          ...version(host),
          kind: 'REPLY',
          noteId: ids.note,
          correlationKey: 'wrong',
          shareReference: true,
        },
        host.client,
      ),
    ).rejects.toThrow('correlation');
    await expect(
      saveWorkspaceFollowUpDraft({ ...version(host), draft }, host.client),
    ).rejects.toThrow('selected People');
    host.sources.sourceArtifacts.row.contentHash = 'unknown';
    await expect(
      submitWorkspaceFollowUpEvidence(
        { ...version(host), kind: 'DOCUMENT', artifactId: ids.artifact },
        host.client,
      ),
    ).rejects.toThrow('hash/status');
    expect(count()).toBe(0);
  });
  it('does not approve content that differs from the stored preview', async () => {
    const host = createFollowUpTestHost();
    await prepare(host);
    const task = (await host.read()).followUps[0];
    await expect(
      approveWorkspaceFinanceDraft(
        {
          taskId: task.id,
          from: 'AWAITING_APPROVAL',
          financeState: task.state,
          expectedUpdatedAt: task.updatedAt,
          expectedRevision: task.revision,
          draftEmail: { ...draft, body: 'Changed' },
          people: task.people,
          at: task.updatedAt,
        },
        host.client,
      ),
    ).rejects.toThrow('Stored Finance draft');
    expect(host.tasks[ids.task].financeEmailApproval).toBe('AWAITING_APPROVAL');
  });
  it('clears approval when the exact draft or selected People change', async () => {
    const host = createFollowUpTestHost();
    await prepare(host);
    host.tasks[ids.task].financeEmailApproval = 'APPROVED_NOT_SENT';
    await saveWorkspaceFollowUpDraft(
      { ...version(host), draft: { ...draft, body: 'New request' } },
      host.client,
    );
    expect(host.tasks[ids.task].financeEmailApproval).toBe('AWAITING_APPROVAL');
  });
  it('refuses stale writes and a concurrent revision without claiming persistence', async () => {
    const host = createFollowUpTestHost();
    await create(host);
    const old = version(host);
    await submitWorkspaceFollowUpEvidence(
      { ...old, kind: 'EXPLANATION', explanation: 'One' },
      host.client,
    );
    await expect(
      submitWorkspaceFollowUpEvidence(
        { ...old, kind: 'EXPLANATION', explanation: 'Two' },
        host.client,
      ),
    ).rejects.toThrow('changed since');
    host.control.race = true;
    await expect(
      submitWorkspaceFollowUpEvidence(
        { ...version(host), kind: 'EXPLANATION', explanation: 'Three' },
        host.client,
      ),
    ).rejects.toThrow('could not be verified');
    expect((await host.read()).followUps[0].evidence).toHaveLength(1);
  });
  it('retains errors for failed persistence and denies subsequent source reads', async () => {
    const host = createFollowUpTestHost();
    await prepare(host);
    host.control.failWrite = true;
    await expect(
      submitWorkspaceFollowUpEvidence(
        { ...version(host), kind: 'EXPLANATION', explanation: 'Missing' },
        host.client,
      ),
    ).rejects.toMatchObject({ status: 503 });
    host.control.failWrite = false;
    host.control.denySource = true;
    await expect(
      saveWorkspaceFollowUpDraft({ ...version(host), draft }, host.client),
    ).rejects.toMatchObject({ status: 403 });
  });
  it('accepts only the clicked kind/reference pair and allows review at the 100-item bound', async () => {
    const host = createFollowUpTestHost();
    await create(host);
    const evidence = Array.from({ length: 100 }, (_, index) => ({
      kind: 'EXPLANATION',
      reference: String(index),
      label: 'Statement',
      attribution: 'User assertion',
      reviewerAccepted: false,
    }));
    evidence[1] = { ...evidence[0], kind: 'DOCUMENT' };
    host.tasks[ids.task].financeEvidenceReferences = JSON.stringify(evidence);
    await acceptWorkspaceFollowUpEvidence(
      { ...version(host), kind: 'EXPLANATION', reference: '0' },
      host.client,
    );
    const rows = (await host.read()).followUps[0].evidence;
    expect(rows[0].reviewerAccepted).toBe(true);
    expect(rows[1].reviewerAccepted).toBe(false);
    await expect(
      submitWorkspaceFollowUpEvidence(
        { ...version(host), kind: 'EXPLANATION', explanation: 'More' },
        host.client,
      ),
    ).rejects.toThrow('write bound');
  });
  it('lists native People and Notes and does not hide list permission denial', async () => {
    const host = createFollowUpTestHost();
    expect(await listFollowUpNativeChoices('people', host.client)).toEqual([
      { id: ids.person, label: 'Synthetic Contact' },
    ]);
    expect(await listFollowUpNativeChoices('notes', host.client)).toEqual([
      { id: ids.note, label: 'Synthetic reply note' },
    ]);
    host.control.denySource = true;
    await expect(
      listFollowUpNativeChoices('people', host.client),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('requires an explicit reopen before changing a resolved follow-up', async () => {
    const host = createFollowUpTestHost();
    await create(host);
    host.tasks[ids.task].financeFollowUpState = 'RESOLVED';
    await expect(
      submitWorkspaceFollowUpEvidence(
        { ...version(host), kind: 'EXPLANATION', explanation: 'New evidence' },
        host.client,
      ),
    ).rejects.toThrow('Reopen');
  });
  it('requires reopening before approving a pending draft on a resolved Task', async () => {
    const host = createFollowUpTestHost();
    await prepare(host);
    host.tasks[ids.task].financeFollowUpState = 'RESOLVED';
    const task = (await host.read()).followUps[0];
    await expect(
      approveWorkspaceFinanceDraft(
        {
          taskId: task.id,
          from: 'AWAITING_APPROVAL',
          financeState: task.state,
          expectedUpdatedAt: task.updatedAt,
          expectedRevision: task.revision,
          draftEmail: task.draftEmail!,
          people: task.people,
          at: task.updatedAt,
        },
        host.client,
      ),
    ).rejects.toThrow('Reopen');
  });
});
