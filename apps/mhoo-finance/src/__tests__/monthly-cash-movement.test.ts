import { describe, expect, it } from 'vitest';
import { priorEqualLengthWindow, qualifiedMonthlyCashMovement } from '../investigation/monthly-cash-movement';
import type { WorkspaceFinanceFact } from '../investigation/workspace-finance-data';

const fact = (id: string, date: string, overrides: Partial<WorkspaceFinanceFact> = {}): WorkspaceFinanceFact => ({ id, factKey: id, description: id, accountId: 'a', accountLabel: 'A', date, amountMinor: '100', currency: 'USD', direction: 'in', status: 'ACTIVE', classification: 'UNCLASSIFIED', includedInTotals: true, sourceLocation: '', artifactId: null, artifactKey: null, ...overrides });

describe('qualifiedMonthlyCashMovement', () => {
  it('keeps calendar gaps and excludes superseded or excluded facts', () => {
    expect(qualifiedMonthlyCashMovement([fact('jan', '2026-01-04'), fact('excluded', '2026-02-01', { includedInTotals: false }), fact('superseded', '2026-03-01', { status: 'SUPERSEDED' }), fact('apr', '2026-04-02', { direction: 'out', amountMinor: '50' })], '2026-01-01', '2026-04-30')).toMatchObject([{ month: '2026-01', moneyInMinor: 100n, available: true }, { month: '2026-02', moneyInMinor: 0n, moneyOutMinor: 0n, available: false }, { month: '2026-03', available: false }, { month: '2026-04', moneyOutMinor: 50n, available: true }]);
  });

  it('returns only a prior window fully inside the calendar domain', () => {
    expect(priorEqualLengthWindow('2026-06-01', '2026-08-31', '2026-01-01')).toEqual({ start: '2026-03-01', end: '2026-05-31' });
    expect(priorEqualLengthWindow('2026-01-01', '2026-01-31', '2026-01-01')).toBeNull();
  });
});
