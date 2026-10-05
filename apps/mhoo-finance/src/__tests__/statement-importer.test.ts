import { describe, expect, it } from 'vitest';

import {
  SYNTHETIC_BANK_CSV_V1,
  importBoundedStatement,
  parseCsvStatement,
  parseQfxOfxStatement,
  reconcileStatementPeriod,
  retainUnparsedPdfArtifact,
  compareAdjacentParsedStatements,
  compareParsedStatementSummaryControls,
} from 'src/ingestion/statement-importer';
import { toFinanceNativeImportRecords } from 'src/ingestion/statement-import-adapter';

const bytes = (content: string): Uint8Array => new TextEncoder().encode(content);
const initialState = { receipts: [], rows: [] } as const;
const csvInput = (content: string, overrides: Record<string, unknown> = {}) => ({
  artifactId: 'synthetic-bank-february-v1',
  accountKey: 'acct-synthetic-1234',
  sourceKind: 'BANK' as const,
  originalFileName: 'synthetic-bank-february.csv',
  mimeType: 'text/csv',
  bytes: bytes(content),
  acquiredAt: '2026-09-05T12:00:00.000Z',
  acquiredBy: 'fixture-author',
  originalFileId: 'synthetic-files-reference-001',
  accountBinding: { schemaVersion: 'source-account-binding-v1' as const, accountKey: 'acct-synthetic-1234', sourceAccountHash: 'b3cc0475bb78a5026098858e9889acf666d31062d513d303314eca31d36e72f2' },
  ...overrides,
});

const csv = [
  'Date,Posted Date,Description,Amount,Transaction ID',
  '02/01/2026,02/02/2026,"Synthetic settlement",125.00,txn-001',
  '02/03/2026,02/03/2026,"Synthetic supplies",-12.34,txn-002',
].join('\r\n');

const qfxText = (accountId = 'synthetic', periodStart = '20260201', periodEnd = '20260228', opening = '100.00', closing = '174.45') => [
  'OFXHEADER:100',
  `<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKACCTFROM><ACCTID>${accountId}</BANKACCTFROM><BANKTRANLIST><DTSTART>${periodStart}<DTEND>${periodEnd}`,
  '<STMTTRN><FITID>fit-1<DTPOSTED>20260202<TRNAMT>100.00<NAME>Synthetic deposit',
  '<STMTTRN><FITID>fit-2<DTPOSTED>20260203<TRNAMT>-25.55<NAME>Synthetic withdrawal',
  `</BANKTRANLIST><DEPANDCREDIT>100.00<CHKANDDEB>25.55<TOTALFEES>0.00<TOTALINT>0.00<CLOSING><DTOPEN>${periodStart}<DTCLOSE>${periodEnd}<BALOPEN>${opening}<BALCLOSE>${closing}</CLOSING></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`,
].join('\n');

const syntheticSummaryControls = {
  schemaVersion: 'statement-summary-controls-v1' as const,
  depositsMinor: 10000,
  paymentsMinor: 2555,
  feesMinor: 0,
  interestMinor: 0,
};

describe('governed statement importer', () => {
  it('preserves original bytes and raw source values while mapping the documented synthetic CSV profile exactly', () => {
    const statement = parseCsvStatement(csvInput(`\uFEFF${csv}`), SYNTHETIC_BANK_CSV_V1);

    expect(statement.receipt).toMatchObject({
      accountKey: 'acct-synthetic-1234',
      originalFileName: 'synthetic-bank-february.csv',
      mimeType: 'text/csv',
      byteLength: bytes(`\uFEFF${csv}`).byteLength,
      acquiredAt: '2026-09-05T12:00:00.000Z',
      acquiredBy: 'fixture-author',
  originalFileId: 'synthetic-files-reference-001',
  accountBinding: { schemaVersion: 'source-account-binding-v1' as const, accountKey: 'acct-synthetic-1234', sourceAccountHash: 'b3cc0475bb78a5026098858e9889acf666d31062d513d303314eca31d36e72f2' },
      parserProfileId: 'synthetic-bank-csv-v1',
    });
    expect(statement.rows).toEqual([
      expect.objectContaining({
        sourceLocation: 'csv:row:2',
        sourceRecordId: 'txn-001',
        transactionDate: '2026-02-01',
        postedDate: '2026-02-02',
        sourceAmount: '125.00',
        amountMinor: 12500,
        direction: 'INFLOW',
        rawValues: expect.objectContaining({ Amount: '125.00' }),
      }),
      expect.objectContaining({
        sourceLocation: 'csv:row:3',
        sourceAmount: '-12.34',
        amountMinor: -1234,
        direction: 'OUTFLOW',
      }),
    ]);
    expect(statement.rejectedRows).toEqual([]);
  });

  it('rejects malformed, ambiguous-date, and invalid-sign rows visibly instead of repairing them', () => {
    const statement = parseCsvStatement(csvInput([
      'Date,Posted Date,Description,Amount,Transaction ID',
      '2/03/2026,02/03/2026,Ambiguous date,5.00,txn-ambiguous',
      '02/03/2026,02/03/2026,Missing sign semantics,DR 5.00,txn-sign',
      '02/31/2026,02/03/2026,Impossible date,5.00,txn-invalid',
      '02/04/2026,02/04/2026,"Broken quote,5.00,txn-broken',
    ].join('\n')), SYNTHETIC_BANK_CSV_V1);

    expect(statement.rows).toEqual([]);
    expect(statement.rejectedRows.map((row) => row.code)).toEqual([
      'MALFORMED_ROW',
    ]);

    const visibleRows = parseCsvStatement(csvInput([
      'Date,Posted Date,Description,Amount,Transaction ID',
      '2/03/2026,02/03/2026,Ambiguous date,5.00,txn-ambiguous',
      '02/03/2026,02/03/2026,Invalid sign,DR 5.00,txn-sign',
      '02/31/2026,02/03/2026,Impossible date,5.00,txn-invalid',
    ].join('\n')), SYNTHETIC_BANK_CSV_V1);
    expect(visibleRows.rejectedRows.map((row) => row.code)).toEqual([
      'AMBIGUOUS_DATE',
      'INVALID_AMOUNT',
      'INVALID_DATE',
    ]);
  });

  it('captures versioned OFX summary controls, projects them natively, and proves exact minor-unit arithmetic', () => {
    const qfx = qfxText();
    const statement = parseQfxOfxStatement({
      ...csvInput(qfx, { artifactId: 'synthetic-qfx-february', originalFileName: 'synthetic.qfx', mimeType: 'application/x-qfx', originalFileId: 'synthetic-files-reference-qfx-001', suppliedSummaryControls: syntheticSummaryControls }),
    }, 'QFX');

    expect(statement.rows).toHaveLength(2);
    expect(statement.rows[0]).toMatchObject({ sourceLocation: 'qfx:STMTTRN[1]', amountMinor: 10000 });
    expect(reconcileStatementPeriod(statement)).toEqual({
      openingBalanceMinor: 10000,
      inflowsMinor: 10000,
      outflowsMinor: 2555,
      closingBalanceMinor: 17445,
      calculatedClosingBalanceMinor: 17445,
      matches: true,
    });
    expect(compareParsedStatementSummaryControls(statement).map(({ status }) => status)).toEqual(['MATCH', 'MATCH', 'MATCH', 'MATCH']);
    const imported = importBoundedStatement(statement, initialState, 10);
    const native = toFinanceNativeImportRecords(statement, imported, imported.state.rows);
    expect(native.sourceArtifacts[0].statementControls).toContain('observedSummaryControls');
    expect(native.sourceArtifacts[0].statementControls).toContain('depositsMinor');

    const mismatch = parseQfxOfxStatement(csvInput(qfx, { artifactId: 'summary-mismatch', originalFileId: 'synthetic-files-reference-summary-mismatch', originalFileName: 'summary-mismatch.qfx', mimeType: 'application/x-qfx', suppliedSummaryControls: { ...syntheticSummaryControls, paymentsMinor: 2556 } }), 'QFX');
    expect(compareParsedStatementSummaryControls(mismatch).map(({ status }) => status)).toContain('MISMATCH');
    expect(mismatch.rejectedRows).toMatchObject([{ sourceLocation: 'ofx:summary-controls', code: 'MALFORMED_ROW' }]);
    const duplicateTag = parseQfxOfxStatement(csvInput(qfx.replace('<TOTALFEES>0.00', '<TOTALFEES>0.00<TOTALFEES>0.00'), { artifactId: 'summary-duplicate', originalFileId: 'synthetic-files-reference-summary-duplicate', originalFileName: 'summary-duplicate.qfx', mimeType: 'application/x-qfx', suppliedSummaryControls: syntheticSummaryControls }), 'QFX');
    expect(duplicateTag.rejectedRows).toMatchObject([{ sourceLocation: 'ofx:summary-controls', code: 'MALFORMED_ROW' }]);
  });

  it('resumes only from a checkpoint bound to the original artifact and remains idempotent', () => {
    const statement = parseCsvStatement(csvInput(csv), SYNTHETIC_BANK_CSV_V1);
    const first = importBoundedStatement(statement, initialState, 1);
    expect(first.status).toBe('PARTIAL');
    expect(first.checkpoint).toMatchObject({ accountKey: 'acct-synthetic-1234', nextRowOffset: 1 });
    expect(first.state.receipts).toEqual([]);

    const complete = importBoundedStatement(statement, first.state, 1, first.checkpoint);
    expect(complete.status).toBe('COMPLETE');
    expect(complete.state.receipts).toHaveLength(1);
    expect(complete.state.rows).toHaveLength(2);
    expect(complete.state.rows.map((row) => row.rowRevision)).toEqual([1, 1]);

    const replay = importBoundedStatement(statement, complete.state, 2);
    expect(replay.status).toBe('DUPLICATE_ARTIFACT');
    expect(replay.state.rows).toEqual(complete.state.rows);
    expect(() => importBoundedStatement(statement, first.state, 1, {
      artifactSha256: 'wrong-hash', accountKey: 'acct-synthetic-1234', parserProfileId: 'synthetic-bank-csv-v1', parserProfileVersion: 1, nextRowOffset: 1,
    })).toThrow('Checkpoint does not match persisted import progress');
  });

  it('retains correction lineage and refuses changed content without an explicit retained predecessor', () => {
    const v1 = parseCsvStatement(csvInput(csv), SYNTHETIC_BANK_CSV_V1);
    const state = importBoundedStatement(v1, initialState, 10).state;
    const altered = csv.replace('125.00', '126.00');
    const missingLink = parseCsvStatement(csvInput(altered), SYNTHETIC_BANK_CSV_V1);
    expect(importBoundedStatement(missingLink, state, 10)).toMatchObject({ status: 'REJECTED' });

    const v2 = parseCsvStatement(csvInput(altered, {
      artifactId: 'synthetic-bank-february-v2',
      originalFileName: 'synthetic-bank-february-corrected.csv',
      originalFileId: 'synthetic-files-reference-csv-corrected-001',
      supersedesArtifactId: 'synthetic-bank-february-v1',
    }), SYNTHETIC_BANK_CSV_V1);
    const corrected = importBoundedStatement(v2, state, 10);
    expect(corrected.status).toBe('COMPLETE');
    expect(corrected.state.receipts).toHaveLength(2);
    expect(corrected.state.rows.find((row) => row.sourceRecordId === 'txn-001' && row.rowRevision === 2)).toMatchObject({
      supersedesRowFingerprint: expect.any(String),
      amountMinor: 12600,
    });
  });

  it('retains an unparsed synthetic PDF receipt and marks a declared missing page without OCR', () => {
    const pdf = retainUnparsedPdfArtifact({
      ...csvInput('%PDF-1.4', { artifactId: 'synthetic-statement-pdf', originalFileName: 'synthetic-statement.pdf', mimeType: 'application/pdf' }),
    }, 3, [1, 3]);
    expect(pdf).toMatchObject({
      pageCompleteness: 'MISSING_PAGES',
      observedPageNumbers: [1, 3],
      receipt: { sourceFormat: 'PDF', parserProfileId: 'unparsed-pdf-custody-v1' },
    });
  });

  it('fails closed for ambiguous source accounts, duplicate-FITID, and OFX correction semantics', () => {
    for (const [name, malformed] of [
      ['nested', qfxText().replace('<OFX>', '<OFX><OFX>')],
      ['missing', qfxText().replace('<OFX>', '')],
      ['unclosed', qfxText().replace('</OFX>', '')],
      ['trailing', `${qfxText()}<OFX></OFX>`],
    ] as const) {
      const rejected = parseQfxOfxStatement(csvInput(malformed, { artifactId: `root-${name}`, originalFileId: `synthetic-files-reference-root-${name}`, originalFileName: `root-${name}.qfx`, mimeType: 'application/x-qfx' }), 'QFX');
      expect(rejected.rejectedRows).toMatchObject([{ sourceLocation: 'ofx:structure', code: 'MALFORMED_ROW' }]);
    }
    const multiAccount = parseQfxOfxStatement(csvInput(qfxText().replace('<ACCTID>synthetic', '<ACCTID>synthetic<ACCTID>second'), { artifactId: 'multi', originalFileId: 'synthetic-files-reference-multi', originalFileName: 'multi.qfx', mimeType: 'application/x-qfx' }), 'QFX');
    expect(multiAccount.rejectedRows).toMatchObject([{ code: 'MALFORMED_ROW' }]);
    const wrongBinding = parseQfxOfxStatement(csvInput(qfxText(), { artifactId: 'wrong-binding', originalFileId: 'synthetic-files-reference-wrong-binding', originalFileName: 'wrong-binding.qfx', mimeType: 'application/x-qfx', accountBinding: { ...csvInput('').accountBinding, accountKey: 'acct-synthetic-5678' } }), 'QFX');
    expect(wrongBinding.rejectedRows).toMatchObject([{ sourceLocation: 'ofx:account', code: 'MALFORMED_ROW' }]);
    const duplicateFitId = parseQfxOfxStatement(csvInput(qfxText().replace('<FITID>fit-2', '<FITID>fit-1'), { artifactId: 'dupe', originalFileId: 'synthetic-files-reference-dupe', originalFileName: 'dupe.qfx', mimeType: 'application/x-qfx' }), 'QFX');
    expect(duplicateFitId.rejectedRows).toMatchObject([{ code: 'MALFORMED_ROW' }]);
    const correction = parseQfxOfxStatement(csvInput(qfxText().replace('Synthetic deposit', 'Synthetic deposit<CORRECTACTION>REPLACE'), { artifactId: 'correction', originalFileId: 'synthetic-files-reference-correction', originalFileName: 'correction.qfx', mimeType: 'application/x-qfx' }), 'QFX');
    expect(correction.rejectedRows).toMatchObject([{ code: 'UNSUPPORTED_FORMAT' }]);
  });

  it('scopes source record identity to an account and requires a versioned correction for changed source values', () => {
    const statement = parseCsvStatement(csvInput(csv), SYNTHETIC_BANK_CSV_V1);
    const first = importBoundedStatement(statement, initialState, 10);
    const otherAccount = parseCsvStatement(csvInput(csv, { accountKey: 'acct-synthetic-5678' }), SYNTHETIC_BANK_CSV_V1);
    const other = importBoundedStatement(otherAccount, first.state, 10);
    expect(other.status).toBe('COMPLETE');
    expect(other.state.rows).toHaveLength(4);

    const changed = parseCsvStatement(csvInput(csv.replace('125.00', '130.00'), { artifactId: 'synthetic-bank-february-v2' }), SYNTHETIC_BANK_CSV_V1);
    expect(importBoundedStatement(changed, first.state, 10)).toMatchObject({ status: 'REJECTED' });
  });

  it('creates a correction revision for a changed normalized mapping and remains idempotent on retry', () => {
    const statement = parseCsvStatement(csvInput(csv), SYNTHETIC_BANK_CSV_V1);
    const state = importBoundedStatement(statement, initialState, 10).state;
    const reparsed = {
      ...statement,
      receipt: { ...statement.receipt, parserProfileVersion: 2 },
      rows: statement.rows.map((row) => row.sourceRecordId === 'txn-001'
        ? { ...row, transactionDate: '2026-02-02', postedDate: '2026-02-03', description: 'Synthetic settlement corrected', amountMinor: 12550, direction: 'INFLOW' as const }
        : row),
    };
    const result = importBoundedStatement(reparsed, state, 10);
    expect(result).toMatchObject({ status: 'COMPLETE', importedRows: 1, duplicateRows: 1 });
    expect(result.state.receipts).toHaveLength(1);
    expect(result.state.rows.find((row) => row.sourceRecordId === 'txn-001' && row.rowRevision === 2)).toMatchObject({ amountMinor: 12550, transactionDate: '2026-02-02', supersedesRowFingerprint: expect.any(String) });
    const retry = importBoundedStatement(reparsed, result.state, 10);
    expect(retry).toMatchObject({ status: 'COMPLETE', importedRows: 0, duplicateRows: 2 });
    const native = toFinanceNativeImportRecords(reparsed, retry, retry.state.rows);
    expect(native.financeFacts.find((fact) => fact.factKey.includes('txn-001'))).toMatchObject({ amount: 125.5, revision: 2, description: 'Synthetic settlement corrected' });
  });

  it('binds resumable progress to the parser profile that produced its normalization', () => {
    const statement = parseCsvStatement(csvInput(csv), SYNTHETIC_BANK_CSV_V1);
    const partial = importBoundedStatement(statement, initialState, 1);
    const reparsed = { ...statement, receipt: { ...statement.receipt, parserProfileVersion: 2 } };
    expect(() => importBoundedStatement(reparsed, partial.state, 1, partial.checkpoint)).toThrow('mapping version');
    expect(importBoundedStatement(statement, partial.state, 1, partial.checkpoint)).toMatchObject({ status: 'COMPLETE' });
  });

  it('fails exact arithmetic if a safe row population produces an unsafe aggregate', () => {
    const statement = parseCsvStatement(csvInput(csv), SYNTHETIC_BANK_CSV_V1);
    const oversized = {
      ...statement,
      rows: [
        { ...statement.rows[0], amountMinor: Number.MAX_SAFE_INTEGER },
        { ...statement.rows[1], amountMinor: Number.MAX_SAFE_INTEGER },
      ],
    };
    expect(() => reconcileStatementPeriod(oversized)).toThrow('aggregate exceeds safe integer range');
  });

  it('compares only account-bound adjacent parsed periods', () => {
    const earlier = parseQfxOfxStatement(csvInput(qfxText(), { artifactId: 'synthetic-qfx-february', originalFileId: 'synthetic-files-reference-qfx-february', originalFileName: 'february.qfx', mimeType: 'application/x-qfx', suppliedSummaryControls: syntheticSummaryControls }), 'QFX');
    const later = parseQfxOfxStatement(csvInput(qfxText('synthetic', '20260301', '20260331', '174.45', '248.90'), { artifactId: 'synthetic-qfx-march', originalFileId: 'synthetic-files-reference-qfx-march', originalFileName: 'march.qfx', mimeType: 'application/x-qfx', suppliedSummaryControls: syntheticSummaryControls }), 'QFX');
    expect(compareAdjacentParsedStatements(earlier, later)).toMatchObject({ status: 'MATCH', reason: 'MATCHING_BALANCE' });

    const balanceMismatch = { ...later, controls: { ...later.controls, openingBalanceMinor: 17444 } };
    expect(compareAdjacentParsedStatements(earlier, balanceMismatch)).toMatchObject({ status: 'MISMATCH', reason: 'BALANCE_MISMATCH' });
    const crossAccount = { ...later, receipt: { ...later.receipt, accountKey: 'acct-synthetic-other' } };
    expect(compareAdjacentParsedStatements(earlier, crossAccount)).toMatchObject({ status: 'REJECTED', reason: 'ACCOUNT_IDENTITY_MISMATCH' });
    const nonAdjacent = { ...later, controls: { ...later.controls, periodStart: '2026-03-02' } };
    expect(compareAdjacentParsedStatements(earlier, nonAdjacent)).toMatchObject({ status: 'REJECTED', reason: 'NON_ADJACENT_PERIOD' });
  });

  it('retains duplicate acquisition metadata linked to the canonical hash', () => {
    const original = parseCsvStatement(csvInput(csv), SYNTHETIC_BANK_CSV_V1);
    const complete = importBoundedStatement(original, initialState, 10);
    const duplicate = parseCsvStatement(csvInput(csv, { originalFileName: 'received-copy.csv', acquiredAt: '2026-09-06T12:00:00.000Z', acquiredBy: 'second-receiver' }), SYNTHETIC_BANK_CSV_V1);
    const replay = importBoundedStatement(duplicate, complete.state, 10);
    expect(replay.state.acquisitions).toMatchObject([{ disposition: 'CANONICAL', originalFileId: 'synthetic-files-reference-001' }, { disposition: 'DUPLICATE', canonicalArtifactId: 'synthetic-bank-february-v1', originalFileId: 'synthetic-files-reference-001', originalFileName: 'received-copy.csv', acquiredBy: 'second-receiver' }]);
  });

  it('rejects a different byte sequence that reuses an immutable original Files reference', () => {
    const original = parseCsvStatement(csvInput(csv), SYNTHETIC_BANK_CSV_V1);
    const complete = importBoundedStatement(original, initialState, 10);
    const collision = parseCsvStatement(csvInput(csv.replace('125.00', '126.00'), { artifactId: 'different-bytes', originalFileName: 'different.csv' }), SYNTHETIC_BANK_CSV_V1);
    expect(importBoundedStatement(collision, complete.state, 10)).toMatchObject({ status: 'REJECTED', rejectedRows: [expect.objectContaining({ message: expect.stringContaining('Files reference') })] });
  });

  it('keeps rejected rows from asserting source completeness and maps accepted rows through existing Finance objects', () => {
    const statement = parseCsvStatement(csvInput(`${csv}\n02/32/2026,02/04/2026,Bad date,5.00,txn-bad`), SYNTHETIC_BANK_CSV_V1);
    const imported = importBoundedStatement(statement, initialState, 10);
    expect(imported).toMatchObject({ status: 'COMPLETE_WITH_REJECTIONS', canProvePeriodComplete: false });
    const native = toFinanceNativeImportRecords(statement, imported, imported.state.rows);
    expect(native.sourceArtifacts[0]).toMatchObject({ artifactKey: 'synthetic-bank-february-v1', contentHash: statement.receipt.sha256 });
    expect(native.financeFacts).toHaveLength(2);
    expect(native.importReceipts[0]).toMatchObject({ rejectedRows: 1, importedRows: 2 });
    expect(native.sourceArtifacts[0].originalFiles).toEqual([{ id: 'synthetic-files-reference-001' }]);
    expect(native.sourceArtifacts[0].statementControls).toContain('periodStart');
    expect(native.financeFacts[0]).toMatchObject({ artifactKey: 'synthetic-bank-february-v1', sourceRowKey: 'csv:row:2', classification: 'UNCLASSIFIED', sourceAmount: '125.00', rawValues: expect.stringContaining('Transaction ID') });
  });
});
