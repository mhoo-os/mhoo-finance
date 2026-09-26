import { describe, expect, it } from 'vitest';

import {
  financeFollowUpResolutionEffect,
  financeNativeTaskStatus,
  isFinanceFollowUpTransitionAllowed,
  parseFinanceDraftEmail,
  parseFinancePeople,
  parseFinanceSubjects,
  routeFinanceInvestigationQuestion,
} from '../investigation/finance-follow-up-contract';

describe('native Task Finance follow-up contract', () => {
  it('maps Finance review states onto native Task status without treating completion as reconciliation proof', () => {
    expect(financeNativeTaskStatus('TO_DO')).toBe('TODO');
    expect(financeNativeTaskStatus('WAITING_FOR_REPLY')).toBe('IN_PROGRESS');
    expect(financeNativeTaskStatus('READY_FOR_REVIEW')).toBe('IN_PROGRESS');
    expect(financeNativeTaskStatus('RESOLVED')).toBe('DONE');
    expect(financeFollowUpResolutionEffect()).toBe('NO_RECONCILIATION_EFFECT');
  });

  it.each([
    ['Did the manager steal this money?', 'NEUTRALIZED_MISCONDUCT'],
    [
      'Audit these books and give a clean opinion',
      'QUALIFIED_PROFESSIONAL_REQUIRED',
    ],
    ['Is this deposit taxable?', 'QUALIFIED_PROFESSIONAL_REQUIRED'],
    ['Did the manager falsify this?', 'NEUTRALIZED_MISCONDUCT'],
    ['Is this payment deductible?', 'QUALIFIED_PROFESSIONAL_REQUIRED'],
  ] as const)(
    'routes conclusion-seeking wording to neutral review: %s',
    (question, route) => {
      const result = routeFinanceInvestigationQuestion(question);

      expect(result.route).toBe(route);
      expect(result.question).not.toMatch(
        /fraud|theft|steal|stole|stolen|guilt|audit|taxable/i,
      );
    },
  );

  it('allows bounded human-review transitions only', () => {
    expect(isFinanceFollowUpTransitionAllowed('TO_DO', 'RESOLVED')).toBe(false);
    expect(
      isFinanceFollowUpTransitionAllowed('READY_FOR_REVIEW', 'RESOLVED'),
    ).toBe(true);
    expect(
      isFinanceFollowUpTransitionAllowed('RESOLVED', 'READY_FOR_REVIEW'),
    ).toBe(true);
  });

  it('keeps transaction and missing-period subjects together without inventing records', () => {
    expect(
      parseFinanceSubjects(
        JSON.stringify([
          { kind: 'TRANSACTION', reference: 'fact-1', label: 'Bank row 1' },
          {
            kind: 'MISSING_STATEMENT_PERIOD',
            reference: 'operating:2025-02',
            label: 'Operating · Feb 2025',
          },
        ]),
      ),
    ).toHaveLength(2);
  });

  it('accepts only explicitly selected, valid Person recipients', () => {
    expect(
      parseFinancePeople(
        JSON.stringify([
          {
            personId: '20202020-0001-4e7c-8001-123456789def',
            name: 'Business owner',
            role: 'Owner',
            selectedRecipient: true,
          },
          {
            personId: 'not-a-person-id',
            name: 'Invalid',
            role: 'Unknown',
            selectedRecipient: true,
          },
        ]),
      ),
    ).toEqual([
      expect.objectContaining({
        name: 'Business owner',
        selectedRecipient: true,
      }),
    ]);
  });

  it('rejects broad or recipient-free email drafts', () => {
    expect(
      parseFinanceDraftEmail(
        JSON.stringify({
          mailboxLabel: 'Authorized Gmail',
          subject: 'Question',
          body: 'Please clarify this transaction.',
          recipientPersonIds: [],
          attachmentReferences: [],
        }),
      ),
    ).toBeNull();
  });
});
