import { describe, expect, it, vi } from 'vitest';
import type { RestApiClient } from 'twenty-client-sdk/rest';

import {
  approveWorkspaceFinanceDraft,
  updateWorkspaceFinanceFollowUpState,
} from '../investigation/workspace-finance-follow-ups';

describe('user-scoped native Task Finance mutations', () => {
  const taskId = '20202020-0001-4e7c-8001-123456789def';
  const updatedAt = '2026-09-14T00:00:00.000Z';
  const personId = '65f1e8e2-3f37-4b6e-b257-9812d16cda16';
  const draftEmail = {
    mailboxLabel: 'Authorized mailbox',
    subject: 'Evidence request',
    body: 'Please share the receipt.',
    recipientPersonIds: [personId],
    attachmentReferences: [],
  } as const;
  const people = [
    { personId, name: 'Pat', role: 'Owner', selectedRecipient: true },
  ] as const;

  const transition = {
    taskId,
    from: 'READY_FOR_REVIEW',
    to: 'RESOLVED',
    expectedUpdatedAt: updatedAt,
    expectedRevision: 0,
    at: updatedAt,
  } as const;

  it.each([undefined, '', 'OTHER_APP', 'prefix-MHOO_FINANCE_V1'])(
    'refuses writes to a Task outside exact Finance scope: %s',
    async (financeScope) => {
      const get = vi.fn().mockResolvedValue({
        data: {
          task: {
            id: taskId,
            financeScope,
            updatedAt,
            financeRevision: 0,
            financeFollowUpState: 'READY_FOR_REVIEW',
            financeEmailApproval: 'AWAITING_APPROVAL',
            financeDraftEmail: JSON.stringify(draftEmail),
            financePeopleContext: JSON.stringify(people),
          },
        },
      });
      const patch = vi.fn();
      const client = { get, patch } as unknown as RestApiClient;
      await expect(
        updateWorkspaceFinanceFollowUpState(transition, client),
      ).rejects.toThrow('outside the Finance scope');
      await expect(
        approveWorkspaceFinanceDraft(
          {
            ...transition,
            from: 'AWAITING_APPROVAL',
            financeState: 'READY_FOR_REVIEW',
            draftEmail,
            people,
          },
          client,
        ),
      ).rejects.toThrow('outside the Finance scope');
      expect(patch).not.toHaveBeenCalled();
    },
  );

  it.each([
    -1,
    0.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER,
    '0),id[is]:NOT_NULL',
  ])(
    'refuses invalid revision before native requests: %s',
    async (expectedRevision) => {
      const get = vi.fn();
      const patch = vi.fn();
      await expect(
        updateWorkspaceFinanceFollowUpState(
          {
            ...transition,
            expectedRevision: expectedRevision as number,
          },
          { get, patch } as unknown as RestApiClient,
        ),
      ).rejects.toThrow('Invalid Finance revision');
      expect(get).not.toHaveBeenCalled();
      expect(patch).not.toHaveBeenCalled();
    },
  );

  it.each([
    '',
    '2026-02-30T00:00:00.000Z',
    '2026-09-14T00:00:00.000Z),id[is]:NOT_NULL',
  ])(
    'refuses invalid freshness before native requests: %s',
    async (expectedUpdatedAt) => {
      const get = vi.fn();
      await expect(
        updateWorkspaceFinanceFollowUpState(
          {
            ...transition,
            expectedUpdatedAt,
          },
          { get } as unknown as RestApiClient,
        ),
      ).rejects.toThrow('Invalid Finance freshness timestamp');
      expect(get).not.toHaveBeenCalled();
    },
  );

  it('does not accept a concurrent write or a Task leaving Finance scope', async () => {
    for (const change of [
      { financeLastOperationId: '30303030-0001-4e7c-8001-123456789def' },
      { financeScope: 'OTHER_APP' },
    ]) {
      const patch = vi.fn().mockResolvedValue({});
      const get = vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            task: {
              id: taskId,
              financeScope: 'MHOO_FINANCE_V1',
              updatedAt,
              financeRevision: 0,
              financeFollowUpState: 'READY_FOR_REVIEW',
            },
          },
        })
        .mockImplementation(async () => ({
          data: {
            task: {
              id: taskId,
              financeScope: 'MHOO_FINANCE_V1',
              ...patch.mock.calls[0][1],
              ...change,
            },
          },
        }));
      await expect(
        updateWorkspaceFinanceFollowUpState(
          {
            ...transition,
            operationId: '40404040-0001-4e7c-8001-123456789def',
          },
          { get, patch } as unknown as RestApiClient,
        ),
      ).rejects.toThrow('receipt mismatch');
      expect(patch).toHaveBeenCalledTimes(1);
    }
  });

  it('propagates native permission denial without a write or identity retry', async () => {
    const denied = new Error('Native permission denied');
    const get = vi.fn().mockRejectedValue(denied);
    const patch = vi.fn();
    await expect(
      updateWorkspaceFinanceFollowUpState(transition, {
        get,
        patch,
      } as unknown as RestApiClient),
    ).rejects.toBe(denied);
    expect(get).toHaveBeenCalledTimes(1);
    expect(patch).not.toHaveBeenCalled();
  });

  it('persists and verifies a bounded review transition', async () => {
    const patch = vi.fn().mockResolvedValue({});
    const get = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          task: {
            id: taskId,
            financeScope: 'MHOO_FINANCE_V1',
            updatedAt,
            financeFollowUpState: 'READY_FOR_REVIEW',
            financeRevision: 0,
            financeProvenanceHistory: '[]',
          },
        },
      })
      .mockImplementation(async () => ({
        data: {
          task: {
            id: taskId,
            financeScope: 'MHOO_FINANCE_V1',
            ...patch.mock.calls[0][1],
          },
        },
      }));
    const result = await updateWorkspaceFinanceFollowUpState(
      {
        taskId,
        from: 'READY_FOR_REVIEW',
        to: 'RESOLVED',
        expectedUpdatedAt: updatedAt,
        expectedRevision: 0,
        at: updatedAt,
      },
      { patch, get } as unknown as RestApiClient,
    );
    expect(result.status).toBe('DONE');
    expect(patch).toHaveBeenCalledWith(
      '/rest/tasks',
      expect.objectContaining({
        financeFollowUpState: 'RESOLVED',
        financeRevision: 1,
      }),
      {
        query: {
          filter: `and(id[eq]:${taskId},financeScope[eq]:MHOO_FINANCE_V1,financeRevision[eq]:0,updatedAt[eq]:${updatedAt})`,
        },
      },
    );
  });

  it('refuses a jump from To do straight to Resolved', async () => {
    await expect(
      updateWorkspaceFinanceFollowUpState(
        {
          taskId,
          from: 'TO_DO',
          to: 'RESOLVED',
          expectedUpdatedAt: updatedAt,
          expectedRevision: 0,
          at: updatedAt,
        },
        {} as RestApiClient,
      ),
    ).rejects.toThrow('Invalid Finance follow-up transition');
  });

  it('approves a visible draft without sending it', async () => {
    const patch = vi.fn().mockResolvedValue({});
    const get = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          task: {
            id: taskId,
            financeScope: 'MHOO_FINANCE_V1',
            updatedAt,
            financeFollowUpState: 'WAITING_FOR_REPLY',
            financeEmailApproval: 'AWAITING_APPROVAL',
            financeDraftEmail: JSON.stringify(draftEmail),
            financePeopleContext: JSON.stringify(people),
            financeRevision: 0,
            financeProvenanceHistory: null,
          },
        },
      })
      .mockImplementation(async () => ({
        data: {
          task: {
            id: taskId,
            financeScope: 'MHOO_FINANCE_V1',
            ...patch.mock.calls[0][1],
          },
        },
      }));
    const result = await approveWorkspaceFinanceDraft(
      {
        taskId,
        from: 'AWAITING_APPROVAL',
        financeState: 'WAITING_FOR_REPLY',
        expectedUpdatedAt: updatedAt,
        expectedRevision: 0,
        draftEmail,
        people,
        at: updatedAt,
      },
      { patch, get } as unknown as RestApiClient,
    );
    expect(result.financeEmailApproval).toBe('APPROVED_NOT_SENT');
    expect(JSON.parse(result.financeProvenanceHistory)).toEqual([
      expect.objectContaining({ action: 'EMAIL_DRAFT_APPROVED_NOT_SENT' }),
    ]);
  });

  it('refuses stale state before writing and refuses a full provenance log', async () => {
    const patch = vi.fn();
    const staleGet = vi.fn().mockResolvedValue({
      data: {
        task: {
          id: taskId,
          financeScope: 'MHOO_FINANCE_V1',
          updatedAt: '2026-09-14T00:00:01.000Z',
          financeFollowUpState: 'READY_FOR_REVIEW',
          financeRevision: 0,
          financeProvenanceHistory: '[]',
        },
      },
    });
    await expect(
      updateWorkspaceFinanceFollowUpState(
        {
          taskId,
          from: 'READY_FOR_REVIEW',
          to: 'RESOLVED',
          expectedUpdatedAt: updatedAt,
          expectedRevision: 0,
          at: updatedAt,
        },
        { get: staleGet, patch } as unknown as RestApiClient,
      ),
    ).rejects.toThrow('changed since it was read');

    const fullGet = vi.fn().mockResolvedValue({
      data: {
        task: {
          id: taskId,
          financeScope: 'MHOO_FINANCE_V1',
          updatedAt,
          financeFollowUpState: 'READY_FOR_REVIEW',
          financeRevision: 0,
          financeProvenanceHistory: JSON.stringify(
            Array.from({ length: 100 }, () => ({ at: updatedAt, action: 'A' })),
          ),
        },
      },
    });
    await expect(
      updateWorkspaceFinanceFollowUpState(
        {
          taskId,
          from: 'READY_FOR_REVIEW',
          to: 'RESOLVED',
          expectedUpdatedAt: updatedAt,
          expectedRevision: 0,
          at: updatedAt,
        },
        { get: fullGet, patch } as unknown as RestApiClient,
      ),
    ).rejects.toThrow('reached its write bound');
    expect(patch).not.toHaveBeenCalled();
  });

  it('refuses approval when a draft recipient is not explicitly selected', async () => {
    const get = vi.fn();
    const patch = vi.fn();
    await expect(
      approveWorkspaceFinanceDraft(
        {
          taskId,
          from: 'AWAITING_APPROVAL',
          financeState: 'WAITING_FOR_REPLY',
          expectedUpdatedAt: updatedAt,
          expectedRevision: 0,
          draftEmail,
          people: [{ ...people[0], selectedRecipient: false }],
          at: updatedAt,
        },
        { get, patch } as unknown as RestApiClient,
      ),
    ).rejects.toThrow('no valid selected recipients');
    expect(get).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
  });
});
