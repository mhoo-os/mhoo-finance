import { currency, minor, type Currency } from '../contracts/money';
import type { WorkspaceFinanceFact } from './workspace-finance-data';

export const netMovementMinor = (inflow: string, outflow: string): string =>
  minor((minor(inflow) - minor(outflow)).toString()).toString();

export const workspaceAggregateCurrency = (
  facts: readonly WorkspaceFinanceFact[],
  truncated: boolean,
): Readonly<
  | {
      kind: 'available';
      currency: Currency;
      moneyInMinor: string;
      moneyOutMinor: string;
    }
  | {
      kind:
        'truncated' | 'mixed' | 'currency-unavailable' | 'money-unavailable';
    }
> => {
  if (truncated) return { kind: 'truncated' };
  const currencies = new Set<Currency>();
  let inflow = 0n;
  let outflow = 0n;
  for (const fact of facts) {
    let unit: Currency;
    try {
      unit = currency(fact.currency);
    } catch {
      return { kind: 'currency-unavailable' };
    }
    currencies.add(unit);
    try {
      if (fact.amountMinor === null || fact.direction === 'unknown') continue;
      const amount = minor(fact.amountMinor);
      if (amount < 0n) return { kind: 'money-unavailable' };
      if (fact.direction === 'in') inflow = minor((inflow + amount).toString());
      if (fact.direction === 'out')
        outflow = minor((outflow + amount).toString());
    } catch {
      return { kind: 'money-unavailable' };
    }
  }
  if (currencies.size > 1) return { kind: 'mixed' };
  return currencies.size === 1
    ? {
        kind: 'available',
        currency: [...currencies][0] as Currency,
        moneyInMinor: inflow.toString(),
        moneyOutMinor: outflow.toString(),
      }
    : { kind: 'currency-unavailable' };
};
