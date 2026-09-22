import type { WorkspaceFinanceFact } from './workspace-finance-data';

export type MonthlyCashMovement = Readonly<{
  month: string;
  moneyInMinor: bigint;
  moneyOutMinor: bigint;
  facts: readonly WorkspaceFinanceFact[];
  available: boolean;
}>;

export const qualifiedMonthlyCashMovement = (
  facts: readonly WorkspaceFinanceFact[],
  start: string,
  end: string,
): readonly MonthlyCashMovement[] => {
  const movement = new Map<string, { moneyInMinor: bigint; moneyOutMinor: bigint; facts: WorkspaceFinanceFact[] }>();
  for (const fact of facts) {
    if (!fact.includedInTotals || fact.status === 'SUPERSEDED' || fact.date < start || fact.date > end) continue;
    const month = fact.date.slice(0, 7);
    const row = movement.get(month) ?? { moneyInMinor: 0n, moneyOutMinor: 0n, facts: [] };
    const amount = fact.amountMinor === null ? 0n : BigInt(fact.amountMinor);
    if (fact.direction === 'in') row.moneyInMinor += amount;
    if (fact.direction === 'out') row.moneyOutMinor += amount;
    row.facts.push(fact);
    movement.set(month, row);
  }
  const result: MonthlyCashMovement[] = [];
  const cursor = new Date(`${start.slice(0, 7)}-01T00:00:00Z`);
  const last = end.slice(0, 7);
  while (cursor.toISOString().slice(0, 7) <= last) {
    const month = cursor.toISOString().slice(0, 7);
    const row = movement.get(month);
    result.push({ month, moneyInMinor: row?.moneyInMinor ?? 0n, moneyOutMinor: row?.moneyOutMinor ?? 0n, facts: row?.facts ?? [], available: Boolean(row) });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return result;
};

export const priorEqualLengthWindow = (
  start: string,
  end: string,
  domainStart: string,
): Readonly<{ start: string; end: string }> | null => {
  const day = 86_400_000;
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  const domainStartMs = Date.parse(`${domainStart}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || !Number.isFinite(domainStartMs) || endMs < startMs) return null;
  const length = Math.round((endMs - startMs) / day) + 1;
  const priorEnd = startMs - day;
  const priorStart = priorEnd - (length - 1) * day;
  if (priorStart < domainStartMs) return null;
  return { start: new Date(priorStart).toISOString().slice(0, 10), end: new Date(priorEnd).toISOString().slice(0, 10) };
};
