import { describe, expect, it } from 'vitest';

import {
  evaluateEvidenceCandidates,
  evaluateEvidenceLink,
  initialEvidenceLinkState,
  reduceEvidenceLink,
  type EvidenceLinkInput,
} from '../investigation/evidence-linking';

const record = (patch: Partial<EvidenceLinkInput> = {}): EvidenceLinkInput => ({
  id: 'bank-1',
  sourceType: 'BANK',
  sourceReference: 'bank.csv#row-8',
  sourceRecordId: 'bank-record-1',
  account: 'operating',
  date: '2025-03-12',
  direction: 'in',
  amountMinor: '125000',
  currency: 'USD',
  ...patch,
});

describe('explainable related-evidence linking', () => {
  it('suppresses exact duplicate source records without discarding either reference', () => {
    const verdict = evaluateEvidenceLink(
      record(),
      record({ id: 'bank-copy', sourceReference: 'retry.csv#row-3' }),
    );

    expect(verdict).toMatchObject({
      kind: 'AUTO_LINK',
      reasonCode: 'DUPLICATE_SOURCE_RECORD',
      preventsDuplicateFinancialEntry: true,
      preservesOriginals: true,
    });
    expect(verdict.sourceReferences).toEqual([
      'bank.csv#row-8',
      'retry.csv#row-3',
    ]);
    expect(Object.isFrozen(verdict)).toBe(true);
    expect(Object.isFrozen(verdict.sourceReferences)).toBe(true);
  });

  it('auto-links only an explicitly identified POS settlement to its bank evidence', () => {
    const verdict = evaluateEvidenceLink(
      record({ settlementReference: 'settlement-0312' }),
      record({
        id: 'pos-1',
        sourceType: 'POS',
        sourceReference: 'clover:settlement-0312',
        sourceRecordId: 'clover-1',
        settlementReference: 'settlement-0312',
      }),
    );

    expect(verdict).toMatchObject({
      kind: 'AUTO_LINK',
      reasonCode: 'EXPLICIT_SETTLEMENT_REFERENCE',
      preventsDuplicateFinancialEntry: true,
      incomeExpenseClassification: 'UNCHANGED',
    });
  });

  it('requires review when an explicit settlement conflicts on currency or direction', () => {
    const entry = record({ settlementReference: 'settlement-0312' });
    expect(
      evaluateEvidenceLink(
        entry,
        record({
          id: 'currency-conflict',
          sourceType: 'POS',
          settlementReference: 'settlement-0312',
          currency: 'THB',
        }),
      ),
    ).toMatchObject({
      kind: 'REVIEW_REQUIRED',
      reasonCode: 'CURRENCY_MISMATCH',
    });
    expect(
      evaluateEvidenceLink(
        entry,
        record({
          id: 'direction-conflict',
          sourceType: 'POS',
          settlementReference: 'settlement-0312',
          direction: 'out',
        }),
      ),
    ).toMatchObject({
      kind: 'REVIEW_REQUIRED',
      reasonCode: 'DIRECTION_MISMATCH',
    });
  });

  it('routes amount/date-only and email evidence to review instead of auto-linking', () => {
    const email = evaluateEvidenceLink(
      record(),
      record({
        id: 'email-1',
        sourceType: 'EMAIL',
        sourceReference: 'gmail:message-demo-1',
        sourceRecordId: undefined,
        date: '2025-03-13',
      }),
    );
    const ambiguousBank = evaluateEvidenceLink(
      record(),
      record({
        id: 'bank-2',
        sourceReference: 'other-bank.csv#row-2',
        sourceRecordId: 'bank-record-2',
      }),
    );

    expect(email).toMatchObject({
      kind: 'REVIEW_REQUIRED',
      reasonCode: 'AMOUNT_DATE_CANDIDATE',
      preventsDuplicateFinancialEntry: true,
    });
    expect(ambiguousBank.kind).toBe('REVIEW_REQUIRED');
  });

  it('selects one explicit candidate ahead of weaker alternatives', () => {
    const verdict = evaluateEvidenceCandidates(
      record({ settlementReference: 'settlement-0312' }),
      [
        record({
          id: 'weak',
          sourceReference: 'statement.pdf#row-4',
          sourceRecordId: 'statement-4',
          sourceType: 'STATEMENT',
        }),
        record({
          id: 'explicit',
          sourceReference: 'clover:settlement-0312',
          sourceRecordId: 'clover-1',
          sourceType: 'POS',
          settlementReference: 'settlement-0312',
        }),
      ],
    );

    expect(verdict).toMatchObject({
      kind: 'AUTO_LINK',
      reasonCode: 'SINGLE_EXPLICIT_MATCH',
      selectedEvidenceId: 'explicit',
      requiresHumanReview: false,
    });
  });

  it('keeps tied explicit candidates visible for human review', () => {
    const verdict = evaluateEvidenceCandidates(
      record({ settlementReference: 'settlement-0312' }),
      ['b', 'a'].map((id) =>
        record({
          id,
          sourceReference: `clover:${id}`,
          sourceRecordId: `clover-${id}`,
          sourceType: 'POS',
          settlementReference: 'settlement-0312',
        }),
      ),
    );

    expect(verdict).toMatchObject({
      kind: 'REVIEW_REQUIRED',
      reasonCode: 'MULTIPLE_EXPLICIT_CANDIDATES',
      selectedEvidenceId: null,
      requiresHumanReview: true,
    });
    expect(verdict.alternatives.map(({ evidenceId }) => evidenceId)).toEqual([
      'a',
      'b',
    ]);
    expect(Object.isFrozen(verdict.alternatives)).toBe(true);
  });

  it('links explicit transfer pairs without turning them into income or expense', () => {
    const verdict = evaluateEvidenceLink(
      record({
        direction: 'out',
        transferReference: 'transfer-44',
      }),
      record({
        id: 'reserve-side',
        account: 'reserve',
        direction: 'in',
        sourceReference: 'reserve.csv#row-4',
        sourceRecordId: 'reserve-record-4',
        transferReference: 'transfer-44',
      }),
    );

    expect(verdict).toMatchObject({
      kind: 'AUTO_LINK',
      reasonCode: 'EXPLICIT_TRANSFER_PAIR',
      incomeExpenseClassification: 'UNCHANGED',
    });
  });

  it('keeps unknown direction unknown and does not match by description', () => {
    const verdict = evaluateEvidenceLink(
      record({ direction: 'unknown' }),
      record({
        id: 'email-2',
        sourceType: 'EMAIL',
        sourceReference: 'gmail:message-demo-2',
        sourceRecordId: undefined,
        direction: 'in',
      }),
    );

    expect(verdict).toMatchObject({
      kind: 'NO_LINK',
      reasonCode: 'INSUFFICIENT_EXPLICIT_EVIDENCE',
      incomeExpenseClassification: 'UNCHANGED',
    });
  });

  it('records unlink and restore as immutable history without erasing the original auto-link', () => {
    const verdict = evaluateEvidenceLink(
      record({ settlementReference: 'settlement-0312' }),
      record({
        sourceType: 'POS',
        sourceReference: 'clover:settlement-0312',
        settlementReference: 'settlement-0312',
      }),
    );
    const initial = initialEvidenceLinkState(verdict);
    const unlinked = reduceEvidenceLink(initial, {
      type: 'UNLINK',
      at: '2025-09-14T00:01:00.000Z',
    });
    const restored = reduceEvidenceLink(unlinked, {
      type: 'RESTORE',
      at: '2025-09-14T00:02:00.000Z',
    });

    expect(restored.status).toBe('LINKED');
    expect(restored.history.map((item) => item.action)).toEqual([
      'AUTO_LINKED',
      'UNLINKED',
      'RESTORED',
    ]);
    expect(initial.history).toHaveLength(1);
    expect(Object.isFrozen(restored.history)).toBe(true);
  });

  it('rejects impossible state transitions without manufacturing history', () => {
    const noLink = initialEvidenceLinkState(
      evaluateEvidenceLink(
        record({ direction: 'unknown' }),
        record({ sourceType: 'EMAIL', direction: 'in' }),
      ),
    );
    const unchangedNoLink = reduceEvidenceLink(noLink, {
      type: 'LINK_AFTER_REVIEW',
      at: '2025-09-14T00:03:00.000Z',
    });

    const review = initialEvidenceLinkState(
      evaluateEvidenceLink(
        record(),
        record({
          sourceType: 'EMAIL',
          sourceReference: 'gmail:message-demo-3',
          date: '2025-03-13',
        }),
      ),
    );
    const unchangedReview = reduceEvidenceLink(review, {
      type: 'RESTORE',
      at: '2025-09-14T00:04:00.000Z',
    });

    expect(unchangedNoLink).toBe(noLink);
    expect(unchangedReview).toBe(review);
    expect(noLink.history).toHaveLength(0);
    expect(review.history).toHaveLength(0);
  });
});
