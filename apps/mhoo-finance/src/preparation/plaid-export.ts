import { createHash } from 'node:crypto';
import { sourceMoney } from '../contracts/money';

export const PLAID_EXPORT_PROFILE = 'chatgpt-finances-posted-csv-v1';
export const EXPORT_HEADERS = [
  'account_label',
  'transaction_id',
  'transaction_date',
  'authorized_datetime',
  'posted_datetime',
  'amount',
  'currency',
  'description',
  'merchant_name',
  'category_primary',
  'category_detailed',
  'status',
] as const;

// Strict CSV decoding keeps multiline quoted values and physical start-line locators.
function records(text: string): { values: string[]; line: number }[] {
  const result: { values: string[]; line: number }[] = [];
  let values: string[] = [],
    value = '',
    quoted = false,
    closed = false,
    line = 1,
    start = 1;
  for (let i = 0; i <= text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === undefined) throw new Error('Unclosed CSV quote');
      if (c === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else {
        value += c;
        if (c === '\n') line++;
      }
      continue;
    }
    if (c === ',' || c === '\n' || c === '\r' || c === undefined) {
      values.push(value);
      value = '';
      closed = false;
      if (c !== ',') {
        if (!(values.length === 1 && values[0] === ''))
          result.push({ values, line: start });
        values = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
        line++;
        start = line;
      }
    } else if (c === '"' && value === '' && !closed) quoted = true;
    else {
      if (closed || c === '"') throw new Error('Malformed CSV quoting');
      value += c;
    }
  }
  return result;
}

export type ExportAccountBinding = {
  label: string;
  accountId: string;
  kind: 'BANK' | 'CARD';
};
export type PreparedExportRow = {
  sourceRecordId: string;
  accountId: string;
  sourceKind: 'BANK' | 'CARD';
  sourceLocation: string;
  transactionDate: string;
  amountMinor: string;
  currency: 'USD';
  rawValues: Record<string, string>;
  classification: 'UNCLASSIFIED';
  includedInTotals: false;
};

/** Pure preparation only: bindings select records, never confer Workspace authority. */
export function preparePlaidExport(
  csv: string,
  bindings: readonly ExportAccountBinding[],
) {
  if (typeof csv !== 'string' || Buffer.byteLength(csv, 'utf8') > 2_000_000)
    throw new Error('CSV exceeds 2 MB preparation limit');
  if (!Array.isArray(bindings) || bindings.length < 1 || bindings.length > 20)
    throw new Error('Explicit account bindings required');
  const labels = new Map<string, ExportAccountBinding>();
  const ids = new Set<string>();
  for (const binding of bindings) {
    if (
      !binding ||
      typeof binding.label !== 'string' ||
      !binding.label ||
      typeof binding.accountId !== 'string' ||
      !binding.accountId ||
      !['BANK', 'CARD'].includes(binding.kind) ||
      labels.has(binding.label) ||
      ids.has(binding.accountId)
    )
      throw new Error('Invalid or duplicate account binding');
    labels.set(binding.label, binding);
    ids.add(binding.accountId);
  }
  const parsed = records(csv.replace(/^\uFEFF/, ''));
  if (JSON.stringify(parsed.shift()?.values) !== JSON.stringify(EXPORT_HEADERS))
    throw new Error('Unsupported export header');
  if (parsed.length > 10_000)
    throw new Error('Export exceeds 10000-row preparation limit');
  const seen = new Set<string>();
  const rows: PreparedExportRow[] = parsed.map(({ values, line }) => {
    if (values.length !== EXPORT_HEADERS.length)
      throw new Error(`Invalid CSV width at line ${line}`);
    const raw = Object.fromEntries(
      EXPORT_HEADERS.map((header, i) => [header, values[i]]),
    );
    const binding = labels.get(raw.account_label);
    if (
      !binding ||
      !raw.transaction_id ||
      raw.status !== 'posted' ||
      raw.currency !== 'USD'
    )
      throw new Error(
        `Unsupported account, ID, status or currency at line ${line}`,
      );
    const day = raw.transaction_date;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
      !Number.isFinite(Date.parse(day)) ||
      new Date(day).toISOString().slice(0, 10) !== day
    )
      throw new Error(`Invalid date at line ${line}`);
    const key = JSON.stringify([binding.accountId, raw.transaction_id]);
    if (seen.has(key))
      throw new Error(`Duplicate account transaction at line ${line}`);
    seen.add(key);
    const amount = sourceMoney(raw.amount, raw.currency, 'OUTFLOW_POSITIVE');
    return {
      sourceRecordId: raw.transaction_id,
      accountId: binding.accountId,
      sourceKind: binding.kind,
      sourceLocation: `csv:line:${line}`,
      transactionDate: day,
      amountMinor: amount.minor,
      currency: 'USD',
      rawValues: raw,
      classification: 'UNCLASSIFIED',
      includedInTotals: false,
    };
  });
  return {
    profile: PLAID_EXPORT_PROFILE,
    contentSha256: createHash('sha256').update(csv, 'utf8').digest('hex'),
    byteLength: Buffer.byteLength(csv, 'utf8'),
    status: 'PREPARED_NOT_IMPORTED' as const,
    sourceSignConvention: 'OUTFLOW_POSITIVE' as const,
    completeness: 'UNKNOWN' as const,
    statementReconciliation: 'NOT_PERFORMED' as const,
    rows,
    accounts: bindings.map((binding) => {
      const dates = rows
        .filter((r) => r.accountId === binding.accountId)
        .map((r) => r.transactionDate)
        .sort();
      return {
        accountId: binding.accountId,
        sourceKind: binding.kind,
        rows: dates.length,
        firstDate: dates[0] ?? null,
        lastDate: dates[dates.length - 1] ?? null,
      };
    }),
  };
}

/** Candidate records only. The governed writer must bind Files custody, establish
 * revision history, and validate Workspace/account authority before persistence. */
export function projectPreparedExport(
  prepared: ReturnType<typeof preparePlaidExport>,
) {
  return prepared.rows.map((row) => ({
    factKey: createHash('sha256')
      .update(JSON.stringify([row.accountId, row.sourceRecordId]))
      .digest('hex'),
    financialAccountId: row.accountId,
    sourceRowKey: `${prepared.contentSha256}:${row.sourceLocation}`,
    sourceLocation: row.sourceLocation,
    exactAmountMinor: row.amountMinor,
    sourceCurrency: row.currency,
    sourceAmount: row.rawValues.amount,
    sourceSignConvention: prepared.sourceSignConvention,
    transactionDate: row.transactionDate,
    period: row.transactionDate.slice(0, 7),
    description: row.rawValues.description,
    rawValues: JSON.stringify(row.rawValues),
    status: 'POSTED' as const,
    classification: row.classification,
    includedInTotals: false,
    exclusionReason: 'SOURCE_UNRECONCILED',
    // Legacy CURRENCY and artifact relation intentionally unset until governed
    // persistence validates exact conversion and immutable Files custody.
  }));
}
