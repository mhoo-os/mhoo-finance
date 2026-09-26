import { createHash } from 'node:crypto';

export type SourceFormat = 'QFX' | 'OFX' | 'CSV' | 'PDF';
export type SourceDirection = 'INFLOW' | 'OUTFLOW';
export type ParseErrorCode =
  | 'INVALID_ENCODING'
  | 'MISSING_REQUIRED_FIELD'
  | 'MALFORMED_ROW'
  | 'AMBIGUOUS_DATE'
  | 'INVALID_DATE'
  | 'INVALID_AMOUNT'
  | 'SIGN_AMBIGUITY'
  | 'UNSUPPORTED_FORMAT';

export type OriginalArtifactReceipt = {
  artifactId: string;
  accountKey: string;
  sourceKind: 'BANK' | 'CARD';
  originalFileName: string;
  mimeType: string;
  byteLength: number;
  sha256: string;
  acquiredAt: string;
  acquiredBy: string;
  sourceFormat: SourceFormat;
  parserProfileId: string;
  parserProfileVersion: number;
  originalFileId: string;
  accountBinding?: SourceAccountBindingV1;
  suppliedSummaryControls?: StatementSummaryControlsV1;
  supersedesArtifactId?: string;
};

export type RawStatementRow = {
  sourceRecordId: string;
  sourceLocation: string;
  rawValues: Readonly<Record<string, string>>;
  transactionDate: string;
  postedDate?: string;
  description: string;
  sourceAmount: string;
  amountMinor: number;
  direction: SourceDirection;
};

export type RejectedStatementRow = {
  sourceLocation: string;
  code: ParseErrorCode;
  message: string;
  rawValues: Readonly<Record<string, string>>;
};

/**
 * A supplied statement-summary control is source evidence, not a calculated
 * transaction total. In OFX, DEPANDCREDIT already includes interest and
 * CHKANDDEB already includes fees, so those inclusive totals are never added
 * together with TOTALINT or TOTALFEES.
 */
export type StatementSummaryControlsV1 = Readonly<{
  schemaVersion: 'statement-summary-controls-v1';
  depositsMinor: number;
  paymentsMinor: number;
  feesMinor: number;
  interestMinor: number;
}>;

/** The account key and a non-reversible source identifier digest are versioned together. */
export type SourceAccountBindingV1 = Readonly<{
  schemaVersion: 'source-account-binding-v1';
  accountKey: string;
  sourceAccountHash: string;
}>;

export type StatementControls = {
  periodStart: string;
  periodEnd: string;
  openingBalanceMinor?: number;
  closingBalanceMinor?: number;
  /** Controls provided with the versioned mapping contract. */
  suppliedSummaryControls?: StatementSummaryControlsV1;
  /** Controls captured verbatim from the supported OFX summary tags. */
  observedSummaryControls?: StatementSummaryControlsV1;
  sourceAccountHash?: string;
};

export type ParsedStatement = {
  receipt: OriginalArtifactReceipt;
  controls: StatementControls;
  rows: readonly RawStatementRow[];
  rejectedRows: readonly RejectedStatementRow[];
};

export type PreservedPdfArtifact = {
  receipt: OriginalArtifactReceipt;
  pageCompleteness: 'UNKNOWN' | 'COMPLETE' | 'MISSING_PAGES';
  expectedPageCount?: number;
  observedPageNumbers: readonly number[];
};

/** Retains original statement bytes without attempting PDF extraction or OCR. */
export const retainUnparsedPdfArtifact = (
  input: ArtifactInput,
  expectedPageCount?: number,
  observedPageNumbers: readonly number[] = [],
): PreservedPdfArtifact => {
  requireInput(input);
  if (input.mimeType !== 'application/pdf') throw new Error('PDF custody requires application/pdf MIME type.');
  const unique = [...new Set(observedPageNumbers)].sort((left, right) => left - right);
  const complete = expectedPageCount !== undefined && expectedPageCount > 0 && unique.length === expectedPageCount && unique.every((page, index) => page === index + 1);
  return {
    receipt: receiptFor(input, 'PDF', 'unparsed-pdf-custody-v1', 1),
    pageCompleteness: expectedPageCount === undefined ? 'UNKNOWN' : complete ? 'COMPLETE' : 'MISSING_PAGES',
    expectedPageCount,
    observedPageNumbers: unique,
  };
};

export type CsvProfile = {
  id: string;
  version: number;
  sourceFormat: 'CSV';
  documentation: string;
  delimiter: ',';
  requiredHeaders: readonly string[];
  columns: {
    transactionDate: string;
    postedDate?: string;
    description: string;
    amount: string;
    sourceRecordId?: string;
  };
  dateFormat: 'MM/DD/YYYY' | 'YYYY-MM-DD';
  signConvention: 'SIGNED_AMOUNT_POSITIVE_INFLOW';
};

/**
 * This maps only the committed synthetic fixture header. It deliberately does
 * not claim a real financial institution's export semantics.
 */
export const SYNTHETIC_BANK_CSV_V1: CsvProfile = {
  id: 'synthetic-bank-csv-v1',
  version: 1,
  sourceFormat: 'CSV',
  documentation:
    'Synthetic-only documented CSV schema: Date, Posted Date, Description, Amount, Transaction ID. Amount is a signed USD decimal where positive is an inflow and negative is an outflow. It is not an institution profile.',
  delimiter: ',',
  requiredHeaders: ['Date', 'Posted Date', 'Description', 'Amount', 'Transaction ID'],
  columns: {
    transactionDate: 'Date',
    postedDate: 'Posted Date',
    description: 'Description',
    amount: 'Amount',
    sourceRecordId: 'Transaction ID',
  },
  dateFormat: 'MM/DD/YYYY',
  signConvention: 'SIGNED_AMOUNT_POSITIVE_INFLOW',
};

export type ArtifactInput = {
  artifactId: string;
  accountKey: string;
  sourceKind: 'BANK' | 'CARD';
  originalFileName: string;
  mimeType: string;
  bytes: Uint8Array;
  acquiredAt: string;
  acquiredBy: string;
  originalFileId: string;
  accountBinding?: SourceAccountBindingV1;
  suppliedSummaryControls?: StatementSummaryControlsV1;
  supersedesArtifactId?: string;
};

const decodeUtf8 = (bytes: Uint8Array): string => {
  const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return decoded.startsWith('\uFEFF') ? decoded.slice(1) : decoded;
};

const hash = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

const asIsoDate = (value: string, format: CsvProfile['dateFormat']): string | undefined => {
  const match = format === 'MM/DD/YYYY'
    ? /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
    : /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = format === 'MM/DD/YYYY' ? Number(match[3]) : Number(match[1]);
  const month = format === 'MM/DD/YYYY' ? Number(match[1]) : Number(match[2]);
  const day = format === 'MM/DD/YYYY' ? Number(match[2]) : Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const asOfxDate = (value: string): string | undefined => {
  const match = /^(\d{4})(\d{2})(\d{2})(?:\d{6}(?:\.\d+)?(?:\[[+-]?\d+(?::\d+)?\])?)?$/.exec(value.trim());
  return match ? asIsoDate(`${match[1]}-${match[2]}-${match[3]}`, 'YYYY-MM-DD') : undefined;
};

/** Converts decimal source text exactly; it never uses floating-point. */
export const parseMinorUnits = (sourceAmount: string): number | undefined => {
  const normalized = sourceAmount.trim().replace(/,/g, '');
  const match = /^([+-]?)(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return undefined;
  const sign = match[1] === '-' ? -1n : 1n;
  const cents = (match[3] ?? '').padEnd(2, '0');
  const minor = sign * (BigInt(match[2]) * 100n + BigInt(cents || '0'));
  if (minor > BigInt(Number.MAX_SAFE_INTEGER) || minor < BigInt(Number.MIN_SAFE_INTEGER)) return undefined;
  return Number(minor);
};

const readCsv = (text: string, delimiter: string): { values: string[]; line: number }[] | RejectedStatementRow => {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const parsed: { values: string[]; line: number }[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === '' && index === lines.length - 1) continue;
    const values: string[] = [];
    let current = '';
    let quoted = false;
    for (let column = 0; column < line.length; column += 1) {
      const character = line[column];
      if (character === '"') {
        if (quoted && line[column + 1] === '"') {
          current += '"';
          column += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === delimiter && !quoted) {
        values.push(current);
        current = '';
      } else {
        current += character;
      }
    }
    if (quoted) {
      return { sourceLocation: `csv:line:${index + 1}`, code: 'MALFORMED_ROW', message: 'Unclosed CSV quote.', rawValues: { line } };
    }
    values.push(current);
    parsed.push({ values, line: index + 1 });
  }
  return parsed;
};

const requireInput = (input: ArtifactInput): void => {
  if (!input.accountKey || !input.artifactId || !input.originalFileName || !input.mimeType || !input.acquiredAt || !input.acquiredBy || !input.originalFileId) {
    throw new Error('Artifact identity, custody metadata, and account scope are required.');
  }
  if (!Number.isFinite(Date.parse(input.acquiredAt))) throw new Error('acquiredAt must be an ISO timestamp.');
};

const receiptFor = (input: ArtifactInput, sourceFormat: SourceFormat, profileId: string, profileVersion: number): OriginalArtifactReceipt => ({
  artifactId: input.artifactId,
  accountKey: input.accountKey,
  sourceKind: input.sourceKind,
  originalFileName: input.originalFileName,
  mimeType: input.mimeType,
  byteLength: input.bytes.byteLength,
  sha256: hash(input.bytes),
  acquiredAt: input.acquiredAt,
  acquiredBy: input.acquiredBy,
  sourceFormat,
  parserProfileId: profileId,
  parserProfileVersion: profileVersion,
  originalFileId: input.originalFileId,
  accountBinding: input.accountBinding,
  suppliedSummaryControls: input.suppliedSummaryControls,
  supersedesArtifactId: input.supersedesArtifactId,
});

const hasValidSummaryControls = (controls: StatementSummaryControlsV1 | undefined): controls is StatementSummaryControlsV1 => controls !== undefined
  && controls.schemaVersion === 'statement-summary-controls-v1'
  && ['depositsMinor', 'paymentsMinor', 'feesMinor', 'interestMinor'].every((name) => Number.isSafeInteger(controls[name as keyof Omit<StatementSummaryControlsV1, 'schemaVersion'>]));

const invalidSuppliedControls = (input: ArtifactInput, receipt: OriginalArtifactReceipt): ParsedStatement | undefined => {
  if (input.suppliedSummaryControls !== undefined && !hasValidSummaryControls(input.suppliedSummaryControls)) {
    return {
      receipt,
      controls: { periodStart: '', periodEnd: '' },
      rows: [],
      rejectedRows: [{ sourceLocation: 'artifact:summary-controls', code: 'MALFORMED_ROW', message: 'Supplied statement summary controls must use statement-summary-controls-v1 with exact safe minor-unit values.', rawValues: {} }],
    };
  }
  return undefined;
};

export const parseCsvStatement = (input: ArtifactInput, profile: CsvProfile): ParsedStatement => {
  requireInput(input);
  const receipt = receiptFor(input, 'CSV', profile.id, profile.version);
  const invalidControls = invalidSuppliedControls(input, receipt);
  if (invalidControls) return invalidControls;
  let text: string;
  try { text = decodeUtf8(input.bytes); } catch {
    return { receipt, controls: { periodStart: '', periodEnd: '' }, rows: [], rejectedRows: [{ sourceLocation: 'artifact', code: 'INVALID_ENCODING', message: 'Artifact is not valid UTF-8.', rawValues: {} }] };
  }
  const parsed = readCsv(text, profile.delimiter);
  if (!Array.isArray(parsed)) return { receipt, controls: { periodStart: '', periodEnd: '' }, rows: [], rejectedRows: [parsed] };
  const header = parsed[0];
  if (!header) return { receipt, controls: { periodStart: '', periodEnd: '' }, rows: [], rejectedRows: [{ sourceLocation: 'csv:line:1', code: 'MISSING_REQUIRED_FIELD', message: 'CSV header row is required.', rawValues: {} }] };
  const indexes = new Map(header.values.map((value, index) => [value.trim(), index]));
  const missing = profile.requiredHeaders.filter((column) => !indexes.has(column));
  if (missing.length > 0) return { receipt, controls: { periodStart: '', periodEnd: '' }, rows: [], rejectedRows: [{ sourceLocation: 'csv:line:1', code: 'MISSING_REQUIRED_FIELD', message: `Missing required header(s): ${missing.join(', ')}.`, rawValues: Object.fromEntries(header.values.map((value, index) => [String(index), value])) }] };

  const rows: RawStatementRow[] = [];
  const rejectedRows: RejectedStatementRow[] = [];
  for (const record of parsed.slice(1)) {
    const rawValues = Object.fromEntries(header.values.map((name, index) => [name.trim(), record.values[index] ?? '']));
    const dateText = rawValues[profile.columns.transactionDate]?.trim() ?? '';
    const transactionDate = asIsoDate(dateText, profile.dateFormat);
    const postedText = profile.columns.postedDate ? rawValues[profile.columns.postedDate]?.trim() : undefined;
    const postedDate = postedText ? asIsoDate(postedText, profile.dateFormat) : undefined;
    const amountText = rawValues[profile.columns.amount]?.trim() ?? '';
    const amountMinor = parseMinorUnits(amountText);
    const description = rawValues[profile.columns.description]?.trim() ?? '';
    const sourceRecordId = profile.columns.sourceRecordId ? rawValues[profile.columns.sourceRecordId]?.trim() : undefined;
    const sourceLocation = `csv:row:${record.line}`;
    if (!transactionDate) { rejectedRows.push({ sourceLocation, code: /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(dateText) && !/^\d{2}\/\d{2}\/\d{4}$/.test(dateText) ? 'AMBIGUOUS_DATE' : 'INVALID_DATE', message: `Date does not match ${profile.dateFormat}.`, rawValues }); continue; }
    if (postedText && !postedDate) { rejectedRows.push({ sourceLocation, code: 'INVALID_DATE', message: `Posted date does not match ${profile.dateFormat}.`, rawValues }); continue; }
    if (amountMinor === undefined) { rejectedRows.push({ sourceLocation, code: 'INVALID_AMOUNT', message: 'Amount is not an exact signed two-decimal value.', rawValues }); continue; }
    if (!description || !sourceRecordId) { rejectedRows.push({ sourceLocation, code: 'MISSING_REQUIRED_FIELD', message: 'Description and Transaction ID are required.', rawValues }); continue; }
    rows.push({ sourceRecordId, sourceLocation, rawValues, transactionDate, postedDate, description, sourceAmount: amountText, amountMinor, direction: amountMinor >= 0 ? 'INFLOW' : 'OUTFLOW' });
  }
  const dates = rows.map((row) => row.transactionDate).sort();
  return { receipt, controls: { periodStart: dates[0] ?? '', periodEnd: dates[dates.length - 1] ?? '', suppliedSummaryControls: input.suppliedSummaryControls }, rows, rejectedRows };
};

const tagValue = (fragment: string, tag: string): string | undefined => {
  const closed = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(fragment)?.[1];
  const open = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i').exec(fragment)?.[1];
  return (closed ?? open)?.trim();
};

const tagCount = (fragment: string, tag: string): number => [...fragment.matchAll(new RegExp(`<${tag}(?:>|\\s)`, 'gi'))].length;

/** QFX leaf tags may use SGML-style open tags, but the enclosing OFX message must be one complete envelope. */
const hasSingleClosedOfxEnvelope = (text: string): boolean => {
  const openings = [...text.matchAll(/<OFX>/gi)];
  const closings = [...text.matchAll(/<\/OFX>/gi)];
  if (openings.length !== 1 || closings.length !== 1) return false;
  const openingEnd = (openings[0].index ?? -1) + openings[0][0].length;
  const closingStart = closings[0].index ?? -1;
  const closingEnd = closingStart + closings[0][0].length;
  return closingStart >= openingEnd && text.slice(closingEnd).trim() === '';
};

const sourceSummaryControls = (text: string): { controls?: StatementSummaryControlsV1; rejection?: RejectedStatementRow } => {
  const fields = [
    ['depositsMinor', 'DEPANDCREDIT'],
    ['paymentsMinor', 'CHKANDDEB'],
    ['feesMinor', 'TOTALFEES'],
    ['interestMinor', 'TOTALINT'],
  ] as const;
  const values = fields.map(([name, tag]) => ({ name, tag, count: tagCount(text, tag), value: tagValue(text, tag) }));
  if (values.every(({ value }) => value === undefined)) return {};
  if (values.some(({ count }) => count !== 1)) {
    return { rejection: { sourceLocation: 'ofx:summary-controls', code: 'MALFORMED_ROW', message: 'Supported OFX summary controls may occur exactly once.', rawValues: Object.fromEntries(values.map(({ tag, value }) => [tag, value ?? ''])) } };
  }
  if (values.some(({ value }) => value === undefined)) {
    return { rejection: { sourceLocation: 'ofx:summary-controls', code: 'MISSING_REQUIRED_FIELD', message: 'When present, supported OFX summary controls must include DEPANDCREDIT, CHKANDDEB, TOTALFEES, and TOTALINT.', rawValues: Object.fromEntries(values.map(({ tag, value }) => [tag, value ?? ''])) } };
  }
  const parsed = values.map(({ name, tag, value }) => ({ name, tag, value, minor: parseMinorUnits(value as string) }));
  if (parsed.some(({ minor }) => minor === undefined)) {
    return { rejection: { sourceLocation: 'ofx:summary-controls', code: 'INVALID_AMOUNT', message: 'OFX summary controls must be exact signed two-decimal values.', rawValues: Object.fromEntries(parsed.map(({ tag, value }) => [tag, value as string])) } };
  }
  const byName = Object.fromEntries(parsed.map(({ name, minor }) => [name, minor]));
  return { controls: { schemaVersion: 'statement-summary-controls-v1', depositsMinor: byName.depositsMinor as number, paymentsMinor: byName.paymentsMinor as number, feesMinor: byName.feesMinor as number, interestMinor: byName.interestMinor as number } };
};

export const parseQfxOfxStatement = (input: ArtifactInput, sourceFormat: 'QFX' | 'OFX'): ParsedStatement => {
  requireInput(input);
  let text: string;
  try { text = decodeUtf8(input.bytes); } catch {
    return { receipt: receiptFor(input, sourceFormat, `${sourceFormat.toLowerCase()}-statement-v1`, 1), controls: { periodStart: '', periodEnd: '' }, rows: [], rejectedRows: [{ sourceLocation: 'artifact', code: 'INVALID_ENCODING', message: 'Artifact is not valid UTF-8.', rawValues: {} }] };
  }
  const profileId = `${sourceFormat.toLowerCase()}-statement-v1`;
  const receipt = receiptFor(input, sourceFormat, profileId, 1);
  const invalidControls = invalidSuppliedControls(input, receipt);
  if (invalidControls) return invalidControls;
  const accountBlocks = [...text.matchAll(/<BANKACCTFROM>([\s\S]*?)(?:<\/BANKACCTFROM>|(?=<BANKTRANLIST>))/gi)];
  const listBlocks = [...text.matchAll(/<BANKTRANLIST>/gi)];
  const accountBlock = accountBlocks[0]?.[1] ?? '';
  if (!hasSingleClosedOfxEnvelope(text) || accountBlocks.length !== 1 || listBlocks.length !== 1 || tagCount(accountBlock, 'ACCTID') !== 1 || !tagValue(accountBlock, 'ACCTID')) return { receipt, controls: { periodStart: '', periodEnd: '' }, rows: [], rejectedRows: [{ sourceLocation: 'ofx:structure', code: 'MALFORMED_ROW', message: 'One closed OFX root, account binding, account identifier, and transaction list are required.', rawValues: {} }] };
  if (accountBlocks.length > 1) return { receipt, controls: { periodStart: '', periodEnd: '' }, rows: [], rejectedRows: [{ sourceLocation: 'ofx:account', code: 'UNSUPPORTED_FORMAT', message: 'Multiple bank accounts in one artifact are outside the bounded parser contract.', rawValues: {} }] };
  const sourceAccountId = tagValue(accountBlock, 'ACCTID') as string;
  const sourceAccountHash = createHash('sha256').update(sourceAccountId).digest('hex');
  if (!input.accountBinding || input.accountBinding.schemaVersion !== 'source-account-binding-v1' || input.accountBinding.accountKey !== input.accountKey || input.accountBinding.sourceAccountHash !== sourceAccountHash) return { receipt, controls: { periodStart: '', periodEnd: '', sourceAccountHash }, rows: [], rejectedRows: [{ sourceLocation: 'ofx:account', code: 'MALFORMED_ROW', message: 'Source account does not match the explicit account binding.', rawValues: { ACCTID_SHA256: sourceAccountHash } }] };
  const closingBlock = /<CLOSING>([\s\S]*?)(?:<\/CLOSING>|(?=<LEDGERBAL>|<\/STMTRS>))/i.exec(text)?.[1];
  const start = closingBlock ? tagValue(closingBlock, 'DTOPEN') ?? '' : tagValue(text, 'DTSTART') ?? '';
  const end = closingBlock ? tagValue(closingBlock, 'DTCLOSE') ?? '' : tagValue(text, 'DTEND') ?? '';
  // OFX CLOSING supplies BALOPEN/BALCLOSE. Regular LEDGERBAL supplies a closing balance only.
  const opening = closingBlock ? tagValue(closingBlock, 'BALOPEN') : undefined;
  const closing = closingBlock ? tagValue(closingBlock, 'BALCLOSE') : (() => { const ledgerBalances = [...text.matchAll(/<LEDGERBAL>[\s\S]*?<BALAMT>([^<\r\n]+)/gi)]; return ledgerBalances[ledgerBalances.length - 1]?.[1]?.trim(); })();
  const summary = sourceSummaryControls(text);
  const controls: StatementControls = { periodStart: asOfxDate(start) ?? '', periodEnd: asOfxDate(end) ?? '', openingBalanceMinor: opening ? parseMinorUnits(opening) : undefined, closingBalanceMinor: closing ? parseMinorUnits(closing) : undefined, suppliedSummaryControls: input.suppliedSummaryControls, observedSummaryControls: summary.controls, sourceAccountHash };
  const rows: RawStatementRow[] = [];
  const rejectedRows: RejectedStatementRow[] = [];
  const seenFitIds = new Set<string>();
  const transactions = [...text.matchAll(/<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>|<LEDGERBAL>|<CLOSING>))/gi)];
  for (let index = 0; index < transactions.length; index += 1) {
    const transactionMatch = transactions[index];
    const fragment = transactionMatch[1];
    const rawValues = { FITID: tagValue(fragment, 'FITID') ?? '', DTPOSTED: tagValue(fragment, 'DTPOSTED') ?? '', DTUSER: tagValue(fragment, 'DTUSER') ?? '', TRNAMT: tagValue(fragment, 'TRNAMT') ?? '', NAME: tagValue(fragment, 'NAME') ?? '', MEMO: tagValue(fragment, 'MEMO') ?? '', CORRECTFITID: tagValue(fragment, 'CORRECTFITID') ?? '', CORRECTACTION: tagValue(fragment, 'CORRECTACTION') ?? '' };
    const sourceLocation = `${sourceFormat.toLowerCase()}:STMTTRN[${index + 1}]`;
    if (sourceFormat === 'OFX' && !transactionMatch[0].toUpperCase().includes('</STMTTRN>')) { rejectedRows.push({ sourceLocation, code: 'MALFORMED_ROW', message: 'Truncated OFX STMTTRN; closing tag is required.', rawValues }); continue; }
    if (rawValues.CORRECTFITID || rawValues.CORRECTACTION) { rejectedRows.push({ sourceLocation, code: 'UNSUPPORTED_FORMAT', message: 'OFX correction semantics require a separately versioned implementation.', rawValues }); continue; }
    const postedDate = asOfxDate(rawValues.DTPOSTED);
    const transactionDate = asOfxDate(rawValues.DTUSER) ?? postedDate;
    const amountMinor = parseMinorUnits(rawValues.TRNAMT);
    if (!rawValues.FITID || !rawValues.NAME) { rejectedRows.push({ sourceLocation, code: 'MISSING_REQUIRED_FIELD', message: 'FITID and NAME are required.', rawValues }); continue; }
    if (seenFitIds.has(rawValues.FITID)) { rejectedRows.push({ sourceLocation, code: 'MALFORMED_ROW', message: 'Duplicate FITID is not accepted by the bounded parser.', rawValues }); continue; }
    if (!postedDate || !transactionDate) { rejectedRows.push({ sourceLocation, code: 'INVALID_DATE', message: 'DTPOSTED or optional DTUSER is invalid.', rawValues }); continue; }
    if (amountMinor === undefined) { rejectedRows.push({ sourceLocation, code: 'INVALID_AMOUNT', message: 'TRNAMT is not an exact signed two-decimal value.', rawValues }); continue; }
    seenFitIds.add(rawValues.FITID);
    rows.push({ sourceRecordId: rawValues.FITID, sourceLocation, rawValues, transactionDate, postedDate, description: rawValues.NAME, sourceAmount: rawValues.TRNAMT, amountMinor, direction: amountMinor >= 0 ? 'INFLOW' : 'OUTFLOW' });
  }
  if (!controls.periodStart || !controls.periodEnd) rejectedRows.push({ sourceLocation: 'ofx:controls', code: 'MISSING_REQUIRED_FIELD', message: 'DTSTART and DTEND statement controls are required.', rawValues: { DTSTART: start, DTEND: end } });
  if (opening && controls.openingBalanceMinor === undefined || closing && controls.closingBalanceMinor === undefined) rejectedRows.push({ sourceLocation: 'ofx:controls', code: 'INVALID_AMOUNT', message: 'Statement balance control is invalid.', rawValues: { BALAMT: closing ?? opening ?? '' } });
  if (summary.rejection) rejectedRows.push(summary.rejection);
  if (controls.suppliedSummaryControls && controls.observedSummaryControls && compareStatementSummaryControls(controls.suppliedSummaryControls, controls.observedSummaryControls).some(({ status }) => status === 'MISMATCH')) {
    rejectedRows.push({ sourceLocation: 'ofx:summary-controls', code: 'MALFORMED_ROW', message: 'Supplied statement summary controls do not match the parsed OFX source controls.', rawValues: {} });
  }
  return { receipt, controls, rows, rejectedRows };
};

export type PeriodArithmetic = {
  openingBalanceMinor?: number;
  inflowsMinor: number;
  outflowsMinor: number;
  closingBalanceMinor?: number;
  calculatedClosingBalanceMinor?: number;
  matches: boolean;
};

const checkedMinorSum = (values: readonly number[]): number => {
  const total = values.reduce((sum, value) => sum + BigInt(value), 0n);
  if (total > BigInt(Number.MAX_SAFE_INTEGER) || total < BigInt(Number.MIN_SAFE_INTEGER)) throw new Error('Minor-unit aggregate exceeds safe integer range.');
  return Number(total);
};

export const reconcileStatementPeriod = (statement: ParsedStatement): PeriodArithmetic => {
  const inflowsMinor = checkedMinorSum(statement.rows.filter((row) => row.amountMinor > 0).map((row) => row.amountMinor));
  const outflowsMinor = checkedMinorSum(statement.rows.filter((row) => row.amountMinor < 0).map((row) => -row.amountMinor));
  const calculatedClosingBalanceMinor = statement.controls.openingBalanceMinor === undefined ? undefined : checkedMinorSum([statement.controls.openingBalanceMinor, inflowsMinor, -outflowsMinor]);
  return { openingBalanceMinor: statement.controls.openingBalanceMinor, inflowsMinor, outflowsMinor, closingBalanceMinor: statement.controls.closingBalanceMinor, calculatedClosingBalanceMinor, matches: calculatedClosingBalanceMinor !== undefined && statement.controls.closingBalanceMinor !== undefined && calculatedClosingBalanceMinor === statement.controls.closingBalanceMinor };
};

export type SummaryControlComparison = { name: 'depositsMinor' | 'paymentsMinor' | 'feesMinor' | 'interestMinor'; suppliedMinor?: number; observedMinor?: number; status: 'MATCH' | 'MISMATCH' | 'NOT_SUPPLIED' | 'NOT_OBSERVABLE'; };
export const compareStatementSummaryControls = (supplied: StatementSummaryControlsV1, observed: Partial<Omit<StatementSummaryControlsV1, 'schemaVersion'>>): SummaryControlComparison[] => (['depositsMinor', 'paymentsMinor', 'feesMinor', 'interestMinor'] as const).map((name) => ({ name, suppliedMinor: supplied[name], observedMinor: observed[name], status: supplied[name] === undefined ? 'NOT_SUPPLIED' : observed[name] === undefined ? 'NOT_OBSERVABLE' : supplied[name] === observed[name] ? 'MATCH' : 'MISMATCH' }));

/** Compares controls captured by the parser, so callers cannot compare detached values. */
export const compareParsedStatementSummaryControls = (statement: ParsedStatement): readonly SummaryControlComparison[] => {
  const supplied = statement.controls.suppliedSummaryControls;
  if (!supplied) return [];
  return compareStatementSummaryControls(supplied, statement.controls.observedSummaryControls ?? {});
};

export type PeriodContinuityComparison = Readonly<{
  status: 'MATCH' | 'MISMATCH' | 'REJECTED';
  reason: 'MATCHING_BALANCE' | 'BALANCE_MISMATCH' | 'ACCOUNT_IDENTITY_MISMATCH' | 'NON_ADJACENT_PERIOD' | 'MISSING_CONTROL';
  earlierClosingMinor?: number;
  laterOpeningMinor?: number;
}>;

const followingDate = (date: string): string | undefined => {
  const parsed = asIsoDate(date, 'YYYY-MM-DD');
  if (!parsed) return undefined;
  const next = new Date(`${parsed}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
};

/**
 * Continuity is only meaningful for the same retained source-account digest
 * and periods that meet at the next calendar day. A mismatch never becomes a
 * soft arithmetic comparison across unrelated accounts or months.
 */
export const compareAdjacentParsedStatements = (earlier: ParsedStatement, later: ParsedStatement): PeriodContinuityComparison => {
  if (earlier.receipt.accountKey !== later.receipt.accountKey || !earlier.controls.sourceAccountHash || earlier.controls.sourceAccountHash !== later.controls.sourceAccountHash) {
    return { status: 'REJECTED', reason: 'ACCOUNT_IDENTITY_MISMATCH' };
  }
  if (followingDate(earlier.controls.periodEnd) !== later.controls.periodStart) {
    return { status: 'REJECTED', reason: 'NON_ADJACENT_PERIOD' };
  }
  const earlierClosingMinor = earlier.controls.closingBalanceMinor;
  const laterOpeningMinor = later.controls.openingBalanceMinor;
  if (earlierClosingMinor === undefined || laterOpeningMinor === undefined) {
    return { status: 'REJECTED', reason: 'MISSING_CONTROL', earlierClosingMinor, laterOpeningMinor };
  }
  return earlierClosingMinor === laterOpeningMinor
    ? { status: 'MATCH', reason: 'MATCHING_BALANCE', earlierClosingMinor, laterOpeningMinor }
    : { status: 'MISMATCH', reason: 'BALANCE_MISMATCH', earlierClosingMinor, laterOpeningMinor };
};

export type ImportedSourceRow = RawStatementRow & {
  accountKey: string;
  artifactId: string;
  parserProfileId: string;
  parserProfileVersion: number;
  rowRevision: number;
  rowFingerprint: string;
  supersedesRowFingerprint?: string;
};
export type ArtifactAcquisitionReceipt = { artifactId: string; canonicalArtifactId: string; accountKey: string; sha256: string; originalFileId: string; originalFileName: string; acquiredAt: string; acquiredBy: string; disposition: 'CANONICAL' | 'DUPLICATE'; };
export type ImportState = {
  receipts: readonly OriginalArtifactReceipt[];
  acquisitions?: readonly ArtifactAcquisitionReceipt[];
  rows: readonly ImportedSourceRow[];
  activeCheckpoint?: ImportCheckpoint;
};
export type ImportCheckpoint = { artifactSha256: string; accountKey: string; parserProfileId: string; parserProfileVersion: number; nextRowOffset: number };
export type BoundedImportResult = {
  state: ImportState;
  checkpoint?: ImportCheckpoint;
  status: 'PARTIAL' | 'COMPLETE' | 'COMPLETE_WITH_REJECTIONS' | 'DUPLICATE_ARTIFACT' | 'REJECTED';
  importedRows: number;
  duplicateRows: number;
  rejectedRows: readonly RejectedStatementRow[];
  canProvePeriodComplete: false;
};

/** Includes normalized mapping output so a versioned reparse can create a correction revision. */
const fingerprintRow = (row: RawStatementRow): string => createHash('sha256').update(JSON.stringify({ sourceRecordId: row.sourceRecordId, rawValues: row.rawValues, sourceAmount: row.sourceAmount, transactionDate: row.transactionDate, postedDate: row.postedDate, description: row.description, amountMinor: row.amountMinor, direction: row.direction })).digest('hex');
const artifactIdentity = (receipt: OriginalArtifactReceipt): string => `${receipt.accountKey}:${receipt.sha256}`;

export const importBoundedStatement = (statement: ParsedStatement, state: ImportState, maxRows: number, checkpoint?: ImportCheckpoint): BoundedImportResult => {
  if (!Number.isInteger(maxRows) || maxRows <= 0) throw new Error('maxRows must be a positive integer.');
  const receipt = statement.receipt;
  const fileCollision = state.receipts.find((existing) => existing.originalFileId === receipt.originalFileId && existing.sha256 !== receipt.sha256)
    ?? state.acquisitions?.find((existing) => existing.originalFileId === receipt.originalFileId && existing.sha256 !== receipt.sha256);
  if (fileCollision) return { state, status: 'REJECTED', importedRows: 0, duplicateRows: 0, rejectedRows: [...statement.rejectedRows, { sourceLocation: 'artifact', code: 'MALFORMED_ROW', message: 'Original Files reference is already bound to different immutable bytes.', rawValues: {} }], canProvePeriodComplete: false };
  const sameArtifact = state.receipts.find((existing) => artifactIdentity(existing) === artifactIdentity(receipt));
  const profileChanged = sameArtifact !== undefined && (
    sameArtifact.parserProfileId !== receipt.parserProfileId ||
    sameArtifact.parserProfileVersion !== receipt.parserProfileVersion
  );
  if (sameArtifact && !profileChanged) return { state: { ...state, acquisitions: [...(state.acquisitions ?? []), { artifactId: receipt.artifactId, canonicalArtifactId: sameArtifact.artifactId, accountKey: receipt.accountKey, sha256: receipt.sha256, originalFileId: receipt.originalFileId, originalFileName: receipt.originalFileName, acquiredAt: receipt.acquiredAt, acquiredBy: receipt.acquiredBy, disposition: 'DUPLICATE' }] }, status: 'DUPLICATE_ARTIFACT', importedRows: 0, duplicateRows: statement.rows.length, rejectedRows: statement.rejectedRows, canProvePeriodComplete: false };
  if (sameArtifact && profileChanged && sameArtifact.artifactId !== receipt.artifactId) return { state, status: 'REJECTED', importedRows: 0, duplicateRows: 0, rejectedRows: [...statement.rejectedRows, { sourceLocation: 'artifact', code: 'MALFORMED_ROW', message: 'A mapping correction must reparse the retained artifact identity; it cannot create a second original receipt.', rawValues: {} }], canProvePeriodComplete: false };
  const priorWithId = state.receipts.find((existing) => existing.accountKey === receipt.accountKey && existing.artifactId === receipt.artifactId);
  if (priorWithId && !sameArtifact && !receipt.supersedesArtifactId) return { state, status: 'REJECTED', importedRows: 0, duplicateRows: 0, rejectedRows: [...statement.rejectedRows, { sourceLocation: 'artifact', code: 'MALFORMED_ROW', message: 'Changed artifact content requires an explicit supersedesArtifactId.', rawValues: {} }], canProvePeriodComplete: false };
  if (receipt.supersedesArtifactId && !state.receipts.some((existing) => existing.artifactId === receipt.supersedesArtifactId && existing.accountKey === receipt.accountKey)) return { state, status: 'REJECTED', importedRows: 0, duplicateRows: 0, rejectedRows: [...statement.rejectedRows, { sourceLocation: 'artifact', code: 'MISSING_REQUIRED_FIELD', message: 'supersedesArtifactId is not a retained artifact for this account.', rawValues: {} }], canProvePeriodComplete: false };

  const start = checkpoint?.nextRowOffset ?? 0;
  if (!Number.isInteger(start) || start < 0 || start > statement.rows.length) throw new Error('Checkpoint offset must be an integer within the source row range.');
  if (state.activeCheckpoint) {
    if (!checkpoint || checkpoint.artifactSha256 !== state.activeCheckpoint.artifactSha256 || checkpoint.accountKey !== state.activeCheckpoint.accountKey || checkpoint.parserProfileId !== state.activeCheckpoint.parserProfileId || checkpoint.parserProfileVersion !== state.activeCheckpoint.parserProfileVersion || checkpoint.nextRowOffset !== state.activeCheckpoint.nextRowOffset) throw new Error('Checkpoint does not match persisted import progress.');
  } else if (checkpoint) {
    throw new Error('No persisted checkpoint exists for this import.');
  }
  if (checkpoint && (checkpoint.artifactSha256 !== receipt.sha256 || checkpoint.accountKey !== receipt.accountKey || checkpoint.parserProfileId !== receipt.parserProfileId || checkpoint.parserProfileVersion !== receipt.parserProfileVersion)) throw new Error('Checkpoint does not bind this exact artifact, account, and mapping version.');

  const changedRecordWithoutCorrection = statement.rows.find((row) => {
    const prior = state.rows.find((candidate) => candidate.accountKey === receipt.accountKey && candidate.sourceRecordId === row.sourceRecordId);
    return prior !== undefined && prior.rowFingerprint !== fingerprintRow(row) && !receipt.supersedesArtifactId && !profileChanged;
  });
  if (changedRecordWithoutCorrection) return { state, status: 'REJECTED', importedRows: 0, duplicateRows: 0, rejectedRows: [...statement.rejectedRows, { sourceLocation: changedRecordWithoutCorrection.sourceLocation, code: 'MALFORMED_ROW', message: 'Changed source record requires an explicit artifact correction or a versioned mapping reparse.', rawValues: changedRecordWithoutCorrection.rawValues }], canProvePeriodComplete: false };

  const rows = [...state.rows];
  const existingByRecord = new Map(state.rows.map((row) => [`${row.accountKey}:${row.sourceRecordId}`, row]));
  let importedRows = 0;
  let duplicateRows = 0;
  const end = Math.min(start + maxRows, statement.rows.length);
  for (const row of statement.rows.slice(start, end)) {
    const rowFingerprint = fingerprintRow(row);
    const prior = existingByRecord.get(`${receipt.accountKey}:${row.sourceRecordId}`);
    if (prior?.rowFingerprint === rowFingerprint) { duplicateRows += 1; continue; }
    const imported: ImportedSourceRow = { ...row, accountKey: receipt.accountKey, artifactId: receipt.artifactId, parserProfileId: receipt.parserProfileId, parserProfileVersion: receipt.parserProfileVersion, rowRevision: (prior?.rowRevision ?? 0) + 1, rowFingerprint, supersedesRowFingerprint: prior?.rowFingerprint };
    rows.push(imported);
    existingByRecord.set(`${receipt.accountKey}:${row.sourceRecordId}`, imported);
    importedRows += 1;
  }
  const complete = end === statement.rows.length;
  const nextCheckpoint = complete ? undefined : { artifactSha256: receipt.sha256, accountKey: receipt.accountKey, parserProfileId: receipt.parserProfileId, parserProfileVersion: receipt.parserProfileVersion, nextRowOffset: end };
  const nextState: ImportState = { receipts: complete && !sameArtifact ? [...state.receipts, receipt] : state.receipts, acquisitions: [...(state.acquisitions ?? []), { artifactId: receipt.artifactId, canonicalArtifactId: receipt.artifactId, accountKey: receipt.accountKey, sha256: receipt.sha256, originalFileId: receipt.originalFileId, originalFileName: receipt.originalFileName, acquiredAt: receipt.acquiredAt, acquiredBy: receipt.acquiredBy, disposition: 'CANONICAL' }], rows, activeCheckpoint: nextCheckpoint };
  return { state: nextState, checkpoint: nextCheckpoint, status: complete ? (statement.rejectedRows.length > 0 ? 'COMPLETE_WITH_REJECTIONS' : 'COMPLETE') : 'PARTIAL', importedRows, duplicateRows, rejectedRows: statement.rejectedRows, canProvePeriodComplete: false };
};
