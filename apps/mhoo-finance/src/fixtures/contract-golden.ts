import { createHash } from 'node:crypto';

import type {
  Manifest,
  Observation,
  Selection,
} from '../contracts/finance-contract';

/** Fabricated evidence only. These references are not customer/source authority. */
export function goldenContract() {
  const window = { from: '2026-01-01', to: '2026-01-31' };
  const make = (
    factKey: string,
    sourceAmount: string,
    patch: Partial<Observation> = {},
  ): Observation => ({
    factKey,
    sourceEventKey: `synthetic-${factKey}`,
    revision: 1,
    artifactId: 'synthetic-original',
    sourceRowKey: `row-${factKey}`,
    accountKey: 'synthetic-bank-a',
    sourceAmount,
    currency: 'USD',
    signConvention: 'INFLOW_POSITIVE',
    date: { precision: 'DATE', value: '2026-01-10' },
    description: 'Synthetic repeated description',
    originalCategory: null,
    status: 'POSTED',
    classification: 'UNKNOWN',
    classificationEvidence: [],
    ...patch,
  });
  const rows: Observation[] = [
    make('large', '90071992547409.93'), // Above Number.MAX_SAFE_INTEGER in cents.
    make('repeat-a', '-1.10'),
    make('repeat-b', '-1.10'),
    make('correction', '-10.00'),
    make('correction', '-10.01', { revision: 2 }),
    make('pending', '-2.00', { status: 'PENDING' }),
    make('pending', '-2.00', { revision: 2 }),
    make('removed', '-3.00'),
    make('removed', '-3.00', { revision: 2, status: 'REMOVED' }),
    make('still-pending', '-4.00', { status: 'PENDING' }),
    make('transfer-out', '-5.00', {
      classification: 'TRANSFER',
      classificationEvidence: ['synthetic-transfer-proof'],
    }),
    make('transfer-in', '5.00', {
      accountKey: 'synthetic-bank-b',
      classification: 'TRANSFER',
      classificationEvidence: ['synthetic-transfer-proof'],
    }),
    make('card-pay-bank', '-6.00', {
      classification: 'CARD_PAYMENT',
      classificationEvidence: ['synthetic-card-proof'],
    }),
    make('card-pay-card', '6.00', {
      accountKey: 'synthetic-card',
      classification: 'CARD_PAYMENT',
      classificationEvidence: ['synthetic-card-proof'],
    }),
    make('refund', '0.25', {
      classification: 'REFUND',
      classificationEvidence: ['synthetic-refund-proof'],
    }),
    make('owner', '0.50', {
      classification: 'OWNER_FLOW',
      classificationEvidence: ['synthetic-owner-proof'],
    }),
    make('revenue', '0.10', {
      classification: 'REVENUE',
      classificationEvidence: ['synthetic-procedure-revenue-v1'],
    }),
    make('expense', '-0.03', {
      classification: 'BUSINESS_EXPENSE',
      classificationEvidence: ['synthetic-procedure-expense-v1'],
    }),
    make('reversal', '1.10', {
      classification: 'REVERSAL',
      classificationEvidence: ['synthetic-reversal-proof'],
    }),
  ];
  const bytes = rows.map((row) => JSON.stringify(row)).join('\n');
  const digest = createHash('sha256').update(bytes).digest('hex');
  const manifest: Manifest = {
    version: 'finance-dataset/v1',
    acquisition: {
      class: 'SYNTHETIC',
      origin: 'golden-fixture-generator/v1',
      authorizationRef: 'synthetic-only-no-client-authorization',
      scopeRef: 'MHO-257-source-fixtures',
      requestedPeriod: window,
      observedPeriod: { from: '2026-01-10', to: '2026-01-10' },
      sourceAsOf: '2026-02-01T00:00:00Z',
      retrieval: 'COMPLETE',
      pagination: 'COMPLETE',
      sourceControls: 'VERIFIED',
      controlEvidence: ['synthetic-generator-row-count'],
      truncated: false,
      rejectedRows: 0,
      retrievedRows: rows.length * 2,
    },
    artifacts: [
      {
        artifactId: 'synthetic-original',
        receiptId: 'synthetic-receipt-original',
        locator: 'synthetic://original',
        sha256: digest,
        rowCount: rows.length,
        duplicateOf: null,
      },
      {
        artifactId: 'synthetic-duplicate',
        receiptId: 'synthetic-receipt-duplicate',
        locator: 'synthetic://duplicate',
        sha256: digest,
        rowCount: rows.length,
        duplicateOf: 'synthetic-original',
      },
    ],
    accounts: [
      { accountKey: 'synthetic-bank-a', type: 'BANK', currency: 'USD' },
      { accountKey: 'synthetic-bank-b', type: 'BANK', currency: 'USD' },
      { accountKey: 'synthetic-card', type: 'CARD', currency: 'USD' },
      { accountKey: 'synthetic-zero-bank', type: 'BANK', currency: 'USD' },
      { accountKey: 'synthetic-missing-bank', type: 'BANK', currency: 'USD' },
    ],
    coverage: [
      'synthetic-bank-a',
      'synthetic-bank-b',
      'synthetic-card',
      'synthetic-zero-bank',
      'synthetic-missing-bank',
    ].map((accountKey) => ({
      coverageKey: `coverage-${accountKey}`,
      accountKey,
      period: window,
      state: accountKey.includes('missing')
        ? 'MISSING'
        : accountKey.includes('zero')
          ? 'NO_ACTIVITY'
          : 'OBSERVED',
      evidenceRefs: accountKey.includes('missing')
        ? []
        : ['synthetic-source-control'],
    })),
    links: [
      {
        kind: 'TRANSFER',
        left: 'transfer-out@1',
        right: 'transfer-in@1',
        evidenceRefs: ['synthetic-transfer-proof'],
      },
      {
        kind: 'CARD_PAYMENT',
        left: 'card-pay-bank@1',
        right: 'card-pay-card@1',
        evidenceRefs: ['synthetic-card-proof'],
      },
      {
        kind: 'REFUND',
        left: 'repeat-a@1',
        right: 'refund@1',
        evidenceRefs: ['synthetic-refund-proof'],
      },
      {
        kind: 'REVERSAL',
        left: 'repeat-b@1',
        right: 'reversal@1',
        evidenceRefs: ['synthetic-reversal-proof'],
      },
    ],
    conventions: {
      money: 'signed-minor-text/v1',
      dates: 'source-precision/v1',
      metrics: 'bank-movement/v1',
      transformation: 'golden-observations/v1',
    },
    sensitivity: 'SYNTHETIC',
    limitations: [
      'Fabricated source controls; no runtime authorization or completeness proof for real data.',
    ],
  };
  const observations = [
    ...rows,
    ...rows.map((row) => ({ ...row, artifactId: 'synthetic-duplicate' })),
  ];
  const selection: Selection = {
    bankAccounts: ['synthetic-bank-a', 'synthetic-bank-b'],
    period: window,
    currency: 'USD',
  };
  return { manifest, observations, selection, sourceBytes: bytes };
}
