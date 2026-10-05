import { describe, expect, it } from 'vitest';

import { parseFinanceCompletenessReceipt } from '../investigation/completeness-receipt';

const receipt = (patch: Record<string, unknown> = {}) => ({
  version: 'finance-completeness/v1',
  receiptId: 'completeness-receipt-april-2025',
  populationKey: 'operating-statements',
  population: 'Operating statement · April 2025',
  entityScope: 'synthetic-hass-kitchen',
  accountScope: 'operating-demo',
  periodStart: '2025-04-01',
  periodEnd: '2025-04-30',
  timezone: 'America/New_York',
  basis: 'CASH',
  acquisitionMethod: 'AUTHORIZED_UPLOAD',
  acquiredAt: '2026-09-14T02:00:00.000Z',
  authorityReceiptId: 'synthetic-authority-receipt',
  contentHash: `sha256:${'a'.repeat(64)}`,
  sourceLocator: 'pages=1-6',
  lifecycleState: 'SNAPSHOT_ONLY',
  expectedPopulation: '6 pages',
  observedPopulation: '6 pages',
  tests: [
    { id: 'page-continuity', result: 'PASS', detail: 'Pages 1-6 present.' },
    {
      id: 'balance-control',
      result: 'PASS',
      detail: 'Opening plus movement agrees to closing.',
    },
  ],
  gaps: [],
  exclusions: [],
  accessState: 'AUTHORIZED',
  coverageState: 'PROVEN_COMPLETE',
  reviewerReference: 'synthetic-reviewer',
  reviewedAt: '2026-09-14T02:05:00.000Z',
  ...patch,
});

describe('professional source-completeness receipt', () => {
  it('accepts a named, scoped, reviewed population with passing procedures', () => {
    const parsed = parseFinanceCompletenessReceipt(JSON.stringify(receipt()));

    expect(parsed).toMatchObject({
      coverageState: 'PROVEN_COMPLETE',
      population: 'Operating statement · April 2025',
      accessState: 'AUTHORIZED',
    });
    expect(Object.isFrozen(parsed?.tests)).toBe(true);
  });

  it.each([
    { gaps: ['page 3 missing'] },
    {
      tests: [
        {
          id: 'page-continuity',
          result: 'FAIL',
          detail: 'Page 3 missing.',
        },
      ],
    },
    { accessState: 'ACCESS_NOT_AUTHORIZED' },
    { contentHash: null },
  ])('refuses PROVEN_COMPLETE when proof is incomplete: %o', (patch) => {
    expect(
      parseFinanceCompletenessReceipt(JSON.stringify(receipt(patch))),
    ).toBeNull();
  });

  it('keeps missing source evidence distinct from zero activity', () => {
    const parsed = parseFinanceCompletenessReceipt(
      JSON.stringify(
        receipt({
          contentHash: null,
          sourceLocator: null,
          observedPopulation: 'No authorized artifact',
          tests: [
            {
              id: 'authority-check',
              result: 'FAIL',
              detail: 'Source requires authority not present in this run.',
            },
          ],
          gaps: ['2025-04-01/2025-04-30'],
          accessState: 'ACCESS_NOT_AUTHORIZED',
          coverageState: 'MISSING',
        }),
      ),
    );

    expect(parsed).toMatchObject({
      coverageState: 'MISSING',
      accessState: 'ACCESS_NOT_AUTHORIZED',
      observedPopulation: 'No authorized artifact',
    });
  });

  it.each([
    { periodEnd: '2025-99-99' },
    { timezone: 'Moon/Sea_of_Tranquility' },
    { lifecycleState: 'DELETED' },
    { observedPopulation: '5 pages' },
    { reviewedAt: '2026-09-14T01:59:59.000Z' },
    {
      tests: [
        {
          id: 'trust-me',
          result: 'PASS',
          detail: 'No recognized completeness procedure was performed.',
        },
      ],
    },
    {
      tests: [
        {
          id: 'page-continuity',
          result: 'PASS',
          detail: 'Pages 1-6 present.',
        },
        {
          id: 'trust-me-too',
          result: 'PASS',
          detail: 'Unknown procedure cannot be smuggled beside a valid one.',
        },
      ],
    },
  ])('rejects an impossible PROVEN_COMPLETE invariant: %o', (patch) => {
    expect(
      parseFinanceCompletenessReceipt(JSON.stringify(receipt(patch))),
    ).toBeNull();
  });
});
