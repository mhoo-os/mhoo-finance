import { describe, expect, it, vi } from 'vitest';
import type { RestApiClient } from 'twenty-client-sdk/rest';

import { appendInvestigationEvent } from '../investigation/workspace-investigation-events';

const EVENT = 'f5d5f708-41e5-4f93-9477-98c190a00312';
const RUN = 'b976fbe8-7d49-4d87-bdf2-5245192149e0';
const MEMBER = 'dd679a68-0603-435b-936b-d57eb7b85c2a';

describe('append-only Workspace investigation events', () => {
  it('appends sequence one with server actor/time and verifies the exact receipt', async () => {
    const post = vi.fn().mockResolvedValue({ data: {} });
    const get = vi
      .fn()
      .mockResolvedValueOnce({ data: { financeInvestigationEvents: [] } })
      .mockImplementationOnce(async () => ({
        data: {
          financeInvestigationEvent: {
            id: EVENT,
            eventKey: EVENT,
            aggregateKind: 'INVESTIGATION_RUN',
            aggregateReference: RUN,
            sequence: 1,
            eventType: 'RUN_OPENED',
            eventPayload: JSON.stringify({
              ruleSetVersion: 'finance-investigation/v1',
              scopeHash: `sha256:${'a'.repeat(64)}`,
            }),
            previousEventReference: 'ROOT',
            actorWorkspaceMemberId: MEMBER,
            occurredAt: '2026-09-14T04:00:00.000Z',
            nativeTaskReference: 'NONE',
          },
        },
      }));
    const receipt = await appendInvestigationEvent(
      {
        eventId: EVENT,
        aggregateKind: 'INVESTIGATION_RUN',
        aggregateReference: RUN,
        expectedSequence: 0,
        previousEventReference: null,
        eventType: 'RUN_OPENED',
        payload: {
          scopeHash: `sha256:${'a'.repeat(64)}`,
          ruleSetVersion: 'finance-investigation/v1',
        },
        nativeTaskReference: null,
      },
      { workspaceMemberId: MEMBER, now: () => new Date('2026-09-14T04:00:00.000Z') },
      { get, post } as unknown as RestApiClient,
    );
    expect(receipt).toMatchObject({ sequence: 1, actorWorkspaceMemberId: MEMBER });
    expect(post).toHaveBeenCalledWith(
      '/rest/financeInvestigationEvents',
      expect.objectContaining({
        eventKey: EVENT,
        eventPayload: JSON.stringify({
          ruleSetVersion: 'finance-investigation/v1',
          scopeHash: `sha256:${'a'.repeat(64)}`,
        }),
      }),
    );
  });

  it('rejects a stale expected head before writing', async () => {
    const post = vi.fn();
    const get = vi.fn().mockResolvedValue({
      data: {
        financeInvestigationEvents: [{
          id: '229ea756-7432-4198-8df0-698b71ebdd46',
          eventKey: '229ea756-7432-4198-8df0-698b71ebdd46',
          aggregateKind: 'INVESTIGATION_RUN',
          aggregateReference: RUN,
          sequence: 1,
          eventType: 'RUN_OPENED',
          eventPayload: '{}',
          previousEventReference: 'ROOT',
          actorWorkspaceMemberId: MEMBER,
          occurredAt: '2026-09-14T04:00:00.000Z',
          nativeTaskReference: 'NONE',
        }],
      },
    });
    await expect(
      appendInvestigationEvent(
        {
          eventId: EVENT,
          aggregateKind: 'INVESTIGATION_RUN',
          aggregateReference: RUN,
          expectedSequence: 0,
          previousEventReference: null,
          eventType: 'RUN_OPENED',
          payload: { scopeHash: `sha256:${'a'.repeat(64)}`, ruleSetVersion: 'v1' },
        },
        { workspaceMemberId: MEMBER, now: () => new Date() },
        { get, post } as unknown as RestApiClient,
      ),
    ).rejects.toThrow('changed since it was read');
    expect(post).not.toHaveBeenCalled();
  });

  it('returns an exact stored event on idempotent replay without another write', async () => {
    const stored = {
      id: EVENT,
      eventKey: EVENT,
      aggregateKind: 'INVESTIGATION_RUN',
      aggregateReference: RUN,
      sequence: 1,
      eventType: 'RUN_OPENED',
      eventPayload: JSON.stringify({ ruleSetVersion: 'v1', scopeHash: `sha256:${'a'.repeat(64)}` }),
      previousEventReference: 'ROOT',
      actorWorkspaceMemberId: MEMBER,
      occurredAt: '2026-09-14T04:00:00.000Z',
      nativeTaskReference: 'NONE',
    };
    const get = vi.fn().mockResolvedValue({ data: { financeInvestigationEvents: [stored] } });
    const post = vi.fn();
    await expect(
      appendInvestigationEvent(
        {
          eventId: EVENT,
          aggregateKind: 'INVESTIGATION_RUN',
          aggregateReference: RUN,
          expectedSequence: 0,
          previousEventReference: null,
          eventType: 'RUN_OPENED',
          payload: { scopeHash: `sha256:${'a'.repeat(64)}`, ruleSetVersion: 'v1' },
        },
        { workspaceMemberId: MEMBER, now: () => new Date('2026-09-14T05:00:00.000Z') },
        { get, post } as unknown as RestApiClient,
      ),
    ).resolves.toMatchObject({ id: EVENT, occurredAt: '2026-09-14T04:00:00.000Z' });
    expect(post).not.toHaveBeenCalled();
  });

  it('rejects an event kind on the wrong aggregate and malformed contradiction money', async () => {
    const client = { get: vi.fn(), post: vi.fn() } as unknown as RestApiClient;
    await expect(
      appendInvestigationEvent(
        {
          eventId: EVENT,
          aggregateKind: 'FOLLOW_UP',
          aggregateReference: RUN,
          expectedSequence: 0,
          previousEventReference: null,
          eventType: 'RUN_OPENED',
          payload: { scopeHash: `sha256:${'a'.repeat(64)}`, ruleSetVersion: 'v1' },
          nativeTaskReference: RUN,
        },
        { workspaceMemberId: MEMBER, now: () => new Date() },
        client,
      ),
    ).rejects.toThrow('does not belong');
    await expect(
      appendInvestigationEvent(
        {
          eventId: EVENT,
          aggregateKind: 'INVESTIGATION_RUN',
          aggregateReference: RUN,
          expectedSequence: 0,
          previousEventReference: null,
          eventType: 'CONTRADICTION_RECORDED',
          payload: {
            assertion: 'Conflict',
            supportingFactIds: ['fact-1'],
            contradictingFactIds: ['fact-2'],
            effectMinor: '9'.repeat(30),
            currency: 'USD',
            periodEffect: '2025-04',
            alternatives: ['Timing', 'Transfer'],
            procedure: 'Compare source rows',
            nextEvidenceRequest: 'Request settlement detail',
          },
        },
        { workspaceMemberId: MEMBER, now: () => new Date() },
        client,
      ),
    ).rejects.toThrow();
  });
});
