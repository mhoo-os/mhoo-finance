import { describe, expect, it, vi } from 'vitest';
import type { RestApiClient } from 'twenty-client-sdk/rest';

import {
  appendWorkspaceEvidenceDecision,
  readWorkspaceEvidenceHistory,
} from '../investigation/workspace-evidence-decisions';

const ENTRY = '65f1e8e2-3f37-4b6e-b257-9812d16cda16';
const EVIDENCE = 'e36c2d66-e97e-45bb-9c4e-f92c42b0ada0';
const EVENT = '66f2032f-7a82-4624-b2a6-8d1ce716f672';

const row = (patch: Record<string, unknown> = {}) => ({
  id: EVENT,
  decisionKey: EVENT,
  entryReference: ENTRY,
  evidenceReference: EVIDENCE,
  sourceTypes: 'FINANCE_FACT|SOURCE_ARTIFACT',
  linkStatus: 'UNLINKED',
  reasonCode: 'EXISTING_FACT_ARTIFACT_RELATION',
  decisionHistory: JSON.stringify({
    at: '2026-09-14T01:00:00.000Z',
    action: 'UNLINKED',
  }),
  preservesOriginals: true,
  createdAt: '2026-09-14T01:00:01.000Z',
  ...patch,
});

describe('Workspace evidence decision persistence', () => {
  it('reads only the exact relationship and sorts immutable events', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        financeEvidenceLinkDecisions: [
          row({ createdAt: '2026-09-14T02:00:00.000Z' }),
          row({
            id: '401aef02-ccac-4e75-9842-6143e1b46027',
            createdAt: '2026-09-14T01:00:00.000Z',
          }),
          row({
            id: '8f2f77cf-1fa2-4591-971f-2875452b08df',
            evidenceReference: '2176f329-567c-4bdd-a976-5078a13b5d7d',
          }),
        ],
      },
    });
    const history = await readWorkspaceEvidenceHistory(ENTRY, EVIDENCE, {
      get,
    } as unknown as RestApiClient);

    expect(history).toHaveLength(2);
    expect(history[0].createdAt).toBe('2026-09-14T01:00:00.000Z');
    expect(Object.isFrozen(history)).toBe(true);
    expect(get).toHaveBeenCalledWith('/rest/financeEvidenceLinkDecisions', {
      query: expect.objectContaining({
        filter: `entryReference[eq]:${ENTRY},evidenceReference[eq]:${EVIDENCE}`,
      }),
    });
  });

  it('fails closed when exact relationship history reaches the read bound', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        financeEvidenceLinkDecisions: Array.from({ length: 101 }, (_, index) =>
          row({
            id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
          }),
        ),
      },
    });
    await expect(
      readWorkspaceEvidenceHistory(ENTRY, EVIDENCE, {
        get,
      } as unknown as RestApiClient),
    ).rejects.toThrow('reached its read bound');
  });

  it('appends an event, verifies its exact receipt, then rereads history', async () => {
    const stored = row();
    const post = vi.fn().mockResolvedValue({ data: {} });
    const get = vi
      .fn()
      .mockResolvedValueOnce({
        data: { financeEvidenceLinkDecisions: [] },
      })
      .mockResolvedValueOnce({ data: { financeEvidenceLinkDecision: stored } });

    const history = await appendWorkspaceEvidenceDecision(
      {
        entryReference: ENTRY,
        evidenceReference: EVIDENCE,
        sourceTypes: 'FINANCE_FACT|SOURCE_ARTIFACT',
        action: 'UNLINKED',
        reasonCode: 'EXISTING_FACT_ARTIFACT_RELATION',
        at: '2026-09-14T01:00:00.000Z',
        eventId: EVENT,
      },
      { get, post } as unknown as RestApiClient,
    );

    expect(post).toHaveBeenCalledWith(
      '/rest/financeEvidenceLinkDecisions',
      expect.objectContaining({
        id: EVENT,
        linkStatus: 'UNLINKED',
        preservesOriginals: true,
      }),
    );
    expect(history).toHaveLength(1);
  });

  it('refuses a full history before writing a 101st event', async () => {
    const post = vi.fn();
    const get = vi.fn().mockResolvedValue({
      data: {
        financeEvidenceLinkDecisions: Array.from({ length: 100 }, (_, index) =>
          row({
            id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
          }),
        ),
      },
    });

    await expect(
      appendWorkspaceEvidenceDecision(
        {
          entryReference: ENTRY,
          evidenceReference: EVIDENCE,
          sourceTypes: 'FINANCE_FACT|SOURCE_ARTIFACT',
          action: 'UNLINKED',
          reasonCode: 'EXISTING_FACT_ARTIFACT_RELATION',
          at: '2026-09-14T01:00:00.000Z',
          eventId: EVENT,
        },
        { get, post } as unknown as RestApiClient,
      ),
    ).rejects.toThrow('reached its write bound');
    expect(post).not.toHaveBeenCalled();
  });

  it('rejects untrusted record identities before making a request', async () => {
    const get = vi.fn();
    await expect(
      readWorkspaceEvidenceHistory('not-a-uuid', EVIDENCE, {
        get,
      } as unknown as RestApiClient),
    ).rejects.toThrow('Invalid evidence relationship identity');
    expect(get).not.toHaveBeenCalled();
  });
});
