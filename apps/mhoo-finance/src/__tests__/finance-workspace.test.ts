import { describe, expect, it } from 'vitest';

import {
  netMovementMinor,
  workspaceAggregateCurrency,
} from '../investigation/workspace-aggregate';
import type { WorkspaceFinanceFact } from '../investigation/workspace-finance-data';

import {
  financeTimelineRows,
  summarizeFinanceTimeline,
} from '../investigation/finance-timeline';
import {
  DEMO_QUESTIONS,
  initialDemoScope,
  resolveDemoQuestion,
} from '../investigation/question-prototype';

const sourceRows = resolveDemoQuestion(
  initialDemoScope,
  DEMO_QUESTIONS[0],
  'normal',
).rows;

describe('Finance workspace cash-direction timeline', () => {
  const fact = (currency: string): WorkspaceFinanceFact => ({
    id: currency,
    factKey: currency,
    description: currency,
    accountId: null,
    accountLabel: 'Account',
    date: '2026-09-14',
    amountMinor: '100',
    currency,
    direction: 'in',
    status: 'ACTIVE',
    classification: 'UNCLASSIFIED',
    includedInTotals: true,
    sourceLocation: '',
    artifactId: null,
    artifactKey: null,
  });

  it('withholds aggregates for truncation, mixed currency, or missing currency', () => {
    expect(workspaceAggregateCurrency([fact('USD')], true)).toEqual({
      kind: 'truncated',
    });
    expect(
      workspaceAggregateCurrency([fact('USD'), fact('THB')], false),
    ).toEqual({ kind: 'mixed' });
    expect(workspaceAggregateCurrency([fact('')], false)).toEqual({
      kind: 'currency-unavailable',
    });
    expect(workspaceAggregateCurrency([fact('USD')], false)).toEqual({
      kind: 'available',
      currency: 'USD',
      moneyInMinor: '100',
      moneyOutMinor: '0',
    });
  });

  it('withholds aggregates when a fact or directional total exceeds the exact-money bound', () => {
    expect(
      workspaceAggregateCurrency(
        [{ ...fact('USD'), amountMinor: '9223372036854775808' }],
        false,
      ),
    ).toEqual({ kind: 'money-unavailable' });
    expect(
      workspaceAggregateCurrency(
        [
          { ...fact('USD'), amountMinor: '9223372036854775807' },
          { ...fact('USD'), id: 'second', amountMinor: '1' },
        ],
        false,
      ),
    ).toEqual({ kind: 'money-unavailable' });
  });

  it('keeps net movement as canonical minor-unit text', () => {
    expect(netMovementMinor('612500', '562500')).toBe('50000');
    expect(netMovementMinor('12500', '12500')).toBe('0');
    expect(netMovementMinor('0', '12500')).toBe('-12500');
  });
  it('keeps Jan-Jun all-account totals exact and includes one unknown direction', () => {
    const rows = financeTimelineRows(
      sourceRows,
      '2025-01-01',
      '2025-06-30',
      'all',
    );

    expect(rows).toHaveLength(24);
    expect(summarizeFinanceTimeline(rows)).toEqual({
      moneyInMinor: '612500',
      moneyOutMinor: '562500',
      unknownCount: 1,
    });
  });

  it.each([
    ['operating', 17, '600000', '428500', 1],
    ['reserve', 7, '12500', '134000', 0],
  ] as const)(
    'applies the %s account filter to both directions',
    (account, count, moneyInMinor, moneyOutMinor, unknownCount) => {
      const rows = financeTimelineRows(
        sourceRows,
        '2025-01-01',
        '2025-06-30',
        account,
      );

      expect(rows).toHaveLength(count);
      expect(summarizeFinanceTimeline(rows)).toEqual({
        moneyInMinor,
        moneyOutMinor,
        unknownCount,
      });
    },
  );

  it('withholds both directional amounts for an unknown-only date', () => {
    const rows = financeTimelineRows(
      sourceRows,
      '2025-04-16',
      '2025-04-16',
      'all',
    );

    expect(rows.map((row) => row.id)).toEqual(['s19']);
    expect(summarizeFinanceTimeline(rows)).toEqual({
      moneyInMinor: '0',
      moneyOutMinor: '0',
      unknownCount: 1,
    });
    expect(rows[0].direction).toBe('unknown');
  });

  it('shows both explicit sides of a transfer without classifying either as income or expense', () => {
    const rows = financeTimelineRows(
      sourceRows,
      '2025-05-14',
      '2025-05-14',
      'all',
    );

    expect(rows.map((row) => [row.id, row.direction])).toEqual([
      ['s20', 'out'],
      ['s21', 'in'],
    ]);
    expect(summarizeFinanceTimeline(rows)).toEqual({
      moneyInMinor: '12500',
      moneyOutMinor: '12500',
      unknownCount: 0,
    });
  });

  it('keeps the Jan-Feb operating drilldown aligned with statement totals', () => {
    const rows = financeTimelineRows(
      sourceRows,
      '2025-01-01',
      '2025-02-28',
      'operating',
    );

    expect(rows).toHaveLength(7);
    expect(summarizeFinanceTimeline(rows)).toMatchObject({
      moneyInMinor: '220000',
      moneyOutMinor: '180000',
    });
  });
});
