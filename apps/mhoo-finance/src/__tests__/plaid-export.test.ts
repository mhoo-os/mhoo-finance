import { describe, expect, it } from 'vitest';
import {
  EXPORT_HEADERS,
  projectPreparedExport,
  preparePlaidExport,
} from '../preparation/plaid-export';
import { handler } from '../logic-functions/prepare-finance-export.logic-function';

const accounts = [
  {
    label: 'Example checking',
    accountId: 'synthetic-bank',
    kind: 'BANK' as const,
  },
];
const row = [
  'Example checking',
  'example-1',
  '2026-02-01',
  '',
  '',
  '12.34',
  'USD',
  'Example purchase',
  '',
  'shopping',
  'example',
  'posted',
];
const csv = (values = row) =>
  EXPORT_HEADERS.join(',') + '\n' + values.join(',') + '\n\n';
describe('Plaid-derived export preparation', () => {
  it('projects into existing Finance facts without inventing legacy money or custody', () => {
    const projected = projectPreparedExport(preparePlaidExport(csv(), accounts))[0];
    expect(projected).toMatchObject({ financialAccountId: 'synthetic-bank', exactAmountMinor: '-1234', sourceCurrency: 'USD', includedInTotals: false, exclusionReason: 'SOURCE_UNRECONCILED' });
    expect(projected).not.toHaveProperty('amount');
    expect(projected).not.toHaveProperty('artifactId');
    expect(projected.sourceRowKey).toMatch(/^[a-f0-9]{64}:csv:line:2$/);
  });
  it('retains raw amounts and excludes unreconciled rows from totals', () => {
    const result = preparePlaidExport(csv(), accounts);
    expect(result.rows[0]).toMatchObject({
      amountMinor: '-1234',
      classification: 'UNCLASSIFIED',
      includedInTotals: false,
      sourceLocation: 'csv:line:2',
      rawValues: { amount: '12.34' },
    });
    expect(result).toMatchObject({
      completeness: 'UNKNOWN',
      status: 'PREPARED_NOT_IMPORTED',
    });
    expect(preparePlaidExport(csv(), accounts)).toEqual(result);
  });
  it('reverses credit signs with exact arithmetic beyond safe JS integers', () => {
    const values = [...row];
    values[5] = '-90071992547409.93';
    expect(preparePlaidExport(csv(values), accounts).rows[0].amountMinor).toBe(
      '9007199254740993',
    );
  });
  it('handles escaped quotes, commas and multiline descriptions with source locators', () => {
    const values = [...row];
    values[7] = '"Example, ""quoted""\nline"';
    const text =
      csv(values).trimEnd() +
      '\n' +
      row.map((v, i) => (i === 1 ? 'example-2' : v)).join(',') +
      '\n';
    const result = preparePlaidExport(text, accounts);
    expect(result.rows[0].rawValues.description).toBe(
      'Example, "quoted"\nline',
    );
    expect(result.rows[1].sourceLocation).toBe('csv:line:4');
  });
  it('rejects repeated IDs so combined and per-account files cannot be concatenated silently', () => {
    expect(() => preparePlaidExport(csv() + row.join(','), accounts)).toThrow(
      'Duplicate',
    );
  });
  it.each([
    [0, 'Unknown account'],
    [2, '2026-02-30'],
    [5, '1e3'],
    [5, '1.001'],
    [6, 'EUR'],
    [11, 'pending'],
    [1, ''],
  ])('rejects unsupported row values %s %s', (index, value) => {
    const values = [...row];
    values[Number(index)] = String(value);
    expect(() => preparePlaidExport(csv(values), accounts)).toThrow();
  });
  it('rejects mismatched header, width, malformed quotes and oversized payload', () => {
    for (const text of [
      csv().replace('amount,', 'Amount,'),
      csv(row.slice(1)),
      csv().replace('Example purchase', 'bad"quote'),
      'x'.repeat(2_000_001),
    ])
      expect(() => preparePlaidExport(text, accounts)).toThrow();
  });
  it('does not turn an empty file into zero activity proof', () => {
    const result = preparePlaidExport(
      EXPORT_HEADERS.join(',') + '\n',
      accounts,
    );
    expect(result.accounts[0]).toMatchObject({
      rows: 0,
      firstDate: null,
      lastDate: null,
    });
    expect(result.completeness).toBe('UNKNOWN');
  });
  it('rejects ambiguous account bindings', () => {
    expect(() =>
      preparePlaidExport(csv(), [...accounts, ...accounts]),
    ).toThrow();
  });
  it('returns aggregate validation only from the logic function', async () => {
    const result = await handler({ csv: csv(), accounts });
    expect(result.rowCount).toBe(1);
    expect(result).not.toHaveProperty('rows');
    expect(JSON.stringify(result)).not.toContain('Example purchase');
  });
});
