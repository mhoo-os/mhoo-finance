import { describe, expect, it } from 'vitest';

import {
  defineInvestigationScope,
  evaluateCloverFundingBridge,
  evaluateMatchGroup,
  evaluatePeriodCompleteness,
  reduceBankLifecycle,
  reduceExplanationHistory,
  reduceFinanceFollowUpEvents,
  type FinanceFollowUpEvent,
} from '../investigation/professional-investigation';

const RUN = 'b976fbe8-7d49-4d87-bdf2-5245192149e0';
const TASK = '20202020-0001-4e7c-8001-123456789def';
const PERIOD_SCOPE = {
  entityScope: 'synthetic-hass-kitchen',
  accountScope: 'operating-demo',
  populationKey: 'operating-statements',
  periodStart: '2025-01',
  periodEnd: '2025-03',
  timezone: 'America/New_York',
  basis: 'CASH',
} as const;
const completenessReceipt = (
  month: string,
  coverageState: 'PROVEN_COMPLETE' | 'PARTIAL',
  patch: Record<string, unknown> = {},
) =>
  JSON.stringify({
    version: 'finance-completeness/v1',
    receiptId: `completeness-${month}`,
    populationKey: PERIOD_SCOPE.populationKey,
    population: `Operating statement · ${month}`,
    entityScope: PERIOD_SCOPE.entityScope,
    accountScope: PERIOD_SCOPE.accountScope,
    periodStart: `${month}-01`,
    periodEnd: `${month}-${month === '2025-02' ? '28' : '31'}`,
    timezone: PERIOD_SCOPE.timezone,
    basis: PERIOD_SCOPE.basis,
    acquisitionMethod: 'AUTHORIZED_UPLOAD',
    acquiredAt: '2026-09-14T02:00:00.000Z',
    authorityReceiptId: `receipt-${month}`,
    contentHash: `sha256:${'a'.repeat(64)}`,
    sourceLocator: 'pages=1-6',
    lifecycleState: 'SNAPSHOT_ONLY',
    expectedPopulation: '6 pages',
    observedPopulation:
      coverageState === 'PROVEN_COMPLETE' ? '6 pages' : '5 pages',
    tests: [
      {
        id: 'page-continuity',
        result: coverageState === 'PROVEN_COMPLETE' ? 'PASS' : 'FAIL',
        detail:
          coverageState === 'PROVEN_COMPLETE'
            ? 'Pages 1-6 present.'
            : 'Page 6 is missing.',
      },
    ],
    gaps: coverageState === 'PROVEN_COMPLETE' ? [] : ['page 6 missing'],
    exclusions: [],
    accessState: 'AUTHORIZED',
    coverageState,
    reviewerReference: 'synthetic-reviewer',
    reviewedAt: '2026-09-14T02:05:00.000Z',
    ...patch,
  });

const cloverBridge = (patch: Record<string, unknown> = {}) => ({
  currency: 'USD',
  merchantReference: 'merchant-1',
  businessDate: '2026-09-13',
  timezone: 'America/New_York',
  batchReference: 'batch-7',
  batchMembership: 'EXPLICIT' as const,
  saleBaseMinor: '85000',
  taxMinor: '7000',
  tipMinor: '8000',
  chargeMinor: '2000',
  refundMinor: '3000',
  adjustmentMinor: '1000',
  grossSalesMinor: '100000',
  totalTenderMinor: '100000',
  cardTenderMinor: '100000',
  cashTenderMinor: '0',
  feeMinor: '2500',
  reserveMinor: '5000',
  fundingAdjustmentMinor: '0',
  payoutMinor: '92500',
  bankDepositMinor: '92500',
  ...patch,
});

describe('professional investigation domain', () => {
  it('freezes an exact InvestigationRun envelope and rejects impossible scope', () => {
    const run = defineInvestigationScope({
      runId: RUN,
      entityScope: 'Hass Kitchen LLC',
      accountScope: ['operating', 'reserve', 'operating'],
      periodStart: '2024-01-01',
      periodEnd: '2026-08-31',
      timezone: 'America/New_York',
      basis: 'CASH',
      intendedUse: 'Management reconciliation support',
      prohibitedOutputs: ['AUDIT_OPINION', 'MISCONDUCT_CONCLUSION'],
      createdAt: '2026-09-14T03:00:00.000Z',
    });
    expect(run.accountScope).toEqual(['operating', 'reserve']);
    expect(Object.isFrozen(run)).toBe(true);
    expect(() =>
      defineInvestigationScope({ ...run, periodEnd: '2026-99-99' }),
    ).toThrow('Invalid InvestigationRun scope');
  });

  it('retains a disposition and explicitly reopens it when contradictory evidence arrives', () => {
    const explanationId = 'explanation-1';
    const state = reduceExplanationHistory([
      {
        sequence: 1,
        type: 'EXPLANATION_RECORDED',
        explanationId,
        assertion: 'This movement may be an owned-account transfer.',
        occurredAt: '2026-09-14T03:00:00.000Z',
      },
      {
        sequence: 2,
        type: 'EXPLANATION_DISPOSED',
        explanationId,
        disposition: 'Supported by paired bank rows.',
        occurredAt: '2026-09-14T03:01:00.000Z',
      },
      {
        sequence: 3,
        type: 'EVIDENCE_ADDED',
        explanationId,
        evidenceReferences: ['bank:replacement-7'],
        contradicts: true,
        occurredAt: '2026-09-14T03:02:00.000Z',
      },
    ]);
    expect(state).toMatchObject({
      workflowState: 'REOPENED',
      disposition: 'Supported by paired bank rows.',
    });
    expect(state.history).toHaveLength(3);
  });

  it.each([
    ['SPLIT_ONE_TO_MANY', ['1000'], ['400', '600']],
    ['BATCH_MANY_TO_ONE', ['400', '600'], ['1000']],
    ['MANY_TO_MANY', ['400', '600'], ['250', '750']],
  ] as const)('proves an exact %s MatchGroup', (type, sources, targets) => {
    const members = [
      ...sources.map((amountMinor, index) => ({
        factReference: `source-${index}`,
        side: 'SOURCE' as const,
        amountMinor,
        currency: 'USD',
        explicitReference: 'batch-7',
      })),
      ...targets.map((amountMinor, index) => ({
        factReference: `target-${index}`,
        side: 'TARGET' as const,
        amountMinor,
        currency: 'USD',
        explicitReference: 'batch-7',
      })),
    ];
    expect(evaluateMatchGroup(type, members)).toMatchObject({
      residualMinor: '0',
      status: 'EXACT',
      autoLinkEligible: true,
      preservesOriginals: true,
    });
  });

  it('keeps a one-cent MatchGroup residual in review', () => {
    expect(
      evaluateMatchGroup('SPLIT_ONE_TO_MANY', [
        {
          factReference: 'source',
          side: 'SOURCE',
          amountMinor: '1000',
          currency: 'USD',
          explicitReference: 'batch-7',
        },
        {
          factReference: 'target-1',
          side: 'TARGET',
          amountMinor: '400',
          currency: 'USD',
          explicitReference: 'batch-7',
        },
        {
          factReference: 'target-2',
          side: 'TARGET',
          amountMinor: '599',
          currency: 'USD',
          explicitReference: 'batch-7',
        },
      ]),
    ).toMatchObject({
      residualMinor: '1',
      status: 'REVIEW_REQUIRED',
      autoLinkEligible: false,
    });
  });

  it('bridges Clover sale components, tender, funding batch and bank exactly', () => {
    expect(
      evaluateCloverFundingBridge({
        ...cloverBridge(),
      }),
    ).toMatchObject({
      status: 'ARITHMETICALLY_BALANCED',
      batchReference: 'batch-7',
      expectedGrossMinor: '100000',
      expectedPayoutMinor: '92500',
      residualMinor: '0',
      autoReconciled: false,
    });
  });

  it('reports missing Clover components instead of inventing a balancing amount', () => {
    expect(
      evaluateCloverFundingBridge({
        ...cloverBridge(),
        feeMinor: null,
        reserveMinor: null,
      }),
    ).toMatchObject({ status: 'PARTIAL', gaps: ['feeMinor', 'reserveMinor'] });
  });

  it('does not hide a contradictory Clover sale component inside gross sales', () => {
    expect(
      evaluateCloverFundingBridge({
        ...cloverBridge(),
        adjustmentMinor: '999',
      }),
    ).toMatchObject({
      status: 'CONTRADICTED',
      expectedGrossMinor: '99999',
      contradictions: ['SALE_COMPONENT_MISMATCH'],
    });
  });

  it('never includes cash tender in expected card funding', () => {
    expect(
      evaluateCloverFundingBridge({
        ...cloverBridge(),
        cardTenderMinor: '80000',
        cashTenderMinor: '20000',
      }),
    ).toMatchObject({
      status: 'CONTRADICTED',
      expectedPayoutMinor: '72500',
      contradictions: ['PAYOUT_COMPONENT_MISMATCH'],
    });
  });

  it('validates known Clover values and preserves contradictions alongside gaps', () => {
    expect(() =>
      evaluateCloverFundingBridge({
        ...cloverBridge(),
        saleBaseMinor: 'not-money',
        feeMinor: null,
      }),
    ).toThrow('Minor units must be canonical integer text');
    expect(
      evaluateCloverFundingBridge({
        ...cloverBridge(),
        adjustmentMinor: '999',
        feeMinor: null,
      }),
    ).toMatchObject({
      status: 'CONTRADICTED',
      gaps: ['feeMinor'],
      contradictions: ['SALE_COMPONENT_MISMATCH'],
    });
  });

  it('keeps an inferred Clover batch in review even when arithmetic balances', () => {
    expect(
      evaluateCloverFundingBridge({
        ...cloverBridge(),
        batchMembership: 'INFERRED',
      }),
    ).toMatchObject({ status: 'REVIEW_REQUIRED', autoReconciled: false });
  });

  it('retains pending and removed rows while counting only the supported replacement', () => {
    const state = reduceBankLifecycle([
      {
        sequence: 1,
        sourceRecordId: 'pending-1',
        state: 'PENDING',
        replacesSourceRecordId: null,
      },
      {
        sequence: 2,
        sourceRecordId: 'posted-1',
        state: 'POSTED',
        replacesSourceRecordId: 'pending-1',
      },
      {
        sequence: 3,
        sourceRecordId: 'posted-1',
        state: 'REMOVED',
        replacesSourceRecordId: null,
      },
      {
        sequence: 4,
        sourceRecordId: 'posted-2',
        state: 'REPLACED',
        replacesSourceRecordId: 'posted-1',
      },
    ]);
    expect(state.countedSourceRecordIds).toEqual(['posted-2']);
    expect(state.history).toHaveLength(4);
    expect(state.preservesAllSourceRecords).toBe(true);
  });

  it.each([
    [
      'self replacement',
      [
        {
          sequence: 1,
          sourceRecordId: 'posted-1',
          state: 'POSTED' as const,
          replacesSourceRecordId: 'posted-1',
        },
      ],
    ],
    [
      'missing replacement target',
      [
        {
          sequence: 1,
          sourceRecordId: 'posted-2',
          state: 'REPLACED' as const,
          replacesSourceRecordId: 'absent',
        },
      ],
    ],
    [
      'impossible first removal',
      [
        {
          sequence: 1,
          sourceRecordId: 'posted-1',
          state: 'REMOVED' as const,
          replacesSourceRecordId: null,
        },
      ],
    ],
  ])('rejects an invalid bank lifecycle: %s', (_label, events) => {
    expect(() => reduceBankLifecycle(events)).toThrow();
  });

  it('rejects forked bank successors and seals copied history', () => {
    const first = {
      sequence: 1,
      sourceRecordId: 'pending-1',
      state: 'PENDING' as const,
      replacesSourceRecordId: null,
    };
    const result = reduceBankLifecycle([
      first,
      {
        sequence: 2,
        sourceRecordId: 'posted-a',
        state: 'POSTED',
        replacesSourceRecordId: 'pending-1',
      },
    ]);
    expect(Object.isFrozen(result.history[0])).toBe(true);
    expect(result.history[0]).not.toBe(first);
    expect(() =>
      reduceBankLifecycle([
        first,
        {
          sequence: 2,
          sourceRecordId: 'posted-a',
          state: 'POSTED',
          replacesSourceRecordId: 'pending-1',
        },
        {
          sequence: 3,
          sourceRecordId: 'posted-b',
          state: 'POSTED',
          replacesSourceRecordId: 'pending-1',
        },
      ]),
    ).toThrow();
  });

  it('makes every expected month and gap visible without treating missing as zero', () => {
    const result = evaluatePeriodCompleteness(PERIOD_SCOPE, [
      {
        month: '2025-01',
        state: 'PROVEN_COMPLETE',
        receiptJson: completenessReceipt('2025-01', 'PROVEN_COMPLETE'),
      },
      {
        month: '2025-03',
        state: 'PARTIAL',
        receiptJson: completenessReceipt('2025-03', 'PARTIAL'),
      },
    ]);
    expect(result).toMatchObject({
      status: 'INCOMPLETE',
      gaps: ['2025-02', '2025-03'],
      missingIsZeroActivity: false,
    });
    expect(result.months[1]).toEqual({
      month: '2025-02',
      state: 'MISSING',
      receiptReference: null,
    });
  });

  it('rejects a month-completeness label backed by the wrong period', () => {
    expect(() =>
      evaluatePeriodCompleteness({ ...PERIOD_SCOPE, periodEnd: '2025-01' }, [
        {
          month: '2025-01',
          state: 'PROVEN_COMPLETE',
          receiptJson: completenessReceipt('2025-02', 'PROVEN_COMPLETE'),
        },
      ]),
    ).toThrow('Month coverage requires a scope-matched receipt');
  });

  it('rejects partial-month and cross-series completeness receipts', () => {
    const scope = { ...PERIOD_SCOPE, periodEnd: '2025-01' };
    expect(() =>
      evaluatePeriodCompleteness(scope, [
        {
          month: '2025-01',
          state: 'PROVEN_COMPLETE',
          receiptJson: completenessReceipt('2025-01', 'PROVEN_COMPLETE', {
            periodEnd: '2025-01-28',
          }),
        },
      ]),
    ).toThrow('Month coverage requires a scope-matched receipt');
    expect(() =>
      evaluatePeriodCompleteness(scope, [
        {
          month: '2025-01',
          state: 'PROVEN_COMPLETE',
          receiptJson: completenessReceipt('2025-01', 'PROVEN_COMPLETE', {
            accountScope: 'reserve-demo',
          }),
        },
      ]),
    ).toThrow('Month coverage requires a scope-matched receipt');
  });

  it('uses the actual leap-year month end for a complete February', () => {
    const scope = {
      ...PERIOD_SCOPE,
      periodStart: '2024-02',
      periodEnd: '2024-02',
    };
    expect(
      evaluatePeriodCompleteness(scope, [
        {
          month: '2024-02',
          state: 'PROVEN_COMPLETE',
          receiptJson: completenessReceipt('2024-02', 'PROVEN_COMPLETE', {
            periodEnd: '2024-02-29',
          }),
        },
      ]),
    ).toMatchObject({ status: 'PROVEN_COMPLETE', gaps: [] });
  });

  it('creates a native-Task follow-up history with evidence, approve-not-send and reply correlation', () => {
    const people = [
      {
        personId: '30303030-0001-4e7c-8001-123456789def',
        name: 'Owner',
        role: 'Owner',
        selectedRecipient: true,
      },
    ];
    const draft = {
      mailboxLabel: 'Authorized Gmail',
      subject: 'Receipt request',
      body: 'Please share the exact receipt for the attached movement.',
      recipientPersonIds: [people[0].personId],
      attachmentReferences: ['fact-7'],
    };
    const base = (sequence: number, type: FinanceFollowUpEvent['type']) => ({
      sequence,
      type,
      taskId: TASK,
      at: `2026-09-14T03:0${sequence}:00.000Z`,
    });
    const result = reduceFinanceFollowUpEvents(
      [
        { ...base(1, 'CREATED'), state: 'TO_DO' },
        { ...base(2, 'EVIDENCE_ATTACHED'), evidenceReference: 'fact-7' },
        { ...base(3, 'DRAFT_PREPARED'), draft },
        { ...base(4, 'DRAFT_APPROVED_NOT_SENT') },
        { ...base(5, 'STATE_CHANGED'), to: 'WAITING_FOR_REPLY' },
        {
          ...base(6, 'REPLY_CORRELATED'),
          replyReference: 'message-9',
          correlationKey: 'finance:fact-7',
        },
      ],
      people,
    );
    expect(result).toMatchObject({
      taskId: TASK,
      state: 'WAITING_FOR_REPLY',
      approval: 'APPROVED_NOT_SENT',
      sendAuthorized: false,
      evidenceReferences: ['fact-7'],
      replyReferences: ['message-9'],
    });
  });
});
