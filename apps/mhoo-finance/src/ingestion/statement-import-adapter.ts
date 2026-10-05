import type { FinanceFixtureNativeRecords } from 'src/fixtures/fixture-adapter';
import type {
  BoundedImportResult,
  ImportedSourceRow,
  ParsedStatement,
} from './statement-importer';

const nativeStatus = (status: BoundedImportResult['status']): FinanceFixtureNativeRecords['importReceipts'][number]['status'] => {
  switch (status) {
    case 'DUPLICATE_ARTIFACT': return 'DUPLICATE';
    case 'PARTIAL': return 'PARTIAL';
    case 'REJECTED': return 'REJECTED';
    case 'COMPLETE_WITH_REJECTIONS': return 'IMPORTED_WITH_REJECTIONS';
    case 'COMPLETE': return 'IMPORTED';
  }
};

/** Maps a governed parser result into the existing merged Finance object vocabulary. */
export const toFinanceNativeImportRecords = (
  statement: ParsedStatement,
  result: Pick<BoundedImportResult, 'checkpoint' | 'importedRows' | 'duplicateRows' | 'rejectedRows' | 'status'>,
  stateRows: readonly ImportedSourceRow[],
): Pick<
  FinanceFixtureNativeRecords,
  'sourceArtifacts' | 'importReceipts' | 'financeFacts'
> => {
  const artifactRows = stateRows.filter((row) => row.artifactId === statement.receipt.artifactId && row.accountKey === statement.receipt.accountKey);
  // State retains every correction revision for lineage; the native current
  // projection exposes only the latest revision for each source record.
  const rows = artifactRows.filter((row) => !artifactRows.some((candidate) => candidate.sourceRecordId === row.sourceRecordId && candidate.rowRevision > row.rowRevision));
  const sourceRevision = Math.max(1, ...rows.map((row) => row.rowRevision));
  const status = nativeStatus(result.status);
  const profile = `${statement.receipt.parserProfileId}@${statement.receipt.parserProfileVersion}`;
  const receiptScope = `${statement.receipt.accountKey}:${statement.receipt.artifactId}:${statement.receipt.sha256}:${profile}`;
  return {
    sourceArtifacts: [{
      artifactKey: statement.receipt.artifactId,
      accountKey: statement.receipt.accountKey,
      sourceKind: statement.receipt.sourceKind,
      period: `${statement.controls.periodStart}/${statement.controls.periodEnd}`,
      contentHash: statement.receipt.sha256,
      revision: sourceRevision,
      status,
      freshness: 'FRESH',
      rowCount: statement.rows.length,
      originalFileName: statement.receipt.originalFileName,
      mimeType: statement.receipt.mimeType,
      byteLength: statement.receipt.byteLength,
      acquiredAt: statement.receipt.acquiredAt,
      acquiredBy: statement.receipt.acquiredBy,
      supersedesArtifactKey: statement.receipt.supersedesArtifactId,
      originalFiles: [{ id: statement.receipt.originalFileId }],
      statementControls: JSON.stringify(statement.controls),
    }],
    importReceipts: [{
      receiptKey: `receipt-${receiptScope}`,
      artifactKey: statement.receipt.artifactId,
      status,
      attempts: 1,
      importedRows: result.importedRows,
      deduplicatedRows: result.duplicateRows,
      sourceRevision,
      contentHash: statement.receipt.sha256,
      checkpoint: result.checkpoint ? JSON.stringify(result.checkpoint) : undefined,
      rejectedRows: result.rejectedRows.length,
      parserProfile: profile,
    }],
    financeFacts: rows.map((row) => ({
      factKey: `fact-${row.accountKey}-${row.artifactId}-${row.sourceRecordId}-r${row.rowRevision}`,
      sourceRowKey: row.sourceLocation,
      artifactKey: row.artifactId,
      period: row.transactionDate.slice(0, 7),
      amount: row.amountMinor / 100,
      classification: 'UNCLASSIFIED',
      status: 'POSTED',
      revision: row.rowRevision,
      includedInTotals: false,
      exclusionReason: 'SOURCE_UNRECONCILED',
      description: row.description,
      sourceLocation: row.sourceLocation,
      sourceAmount: row.sourceAmount,
      sourceSignConvention: 'SIGNED_AMOUNT_POSITIVE_INFLOW',
      transactionDate: row.transactionDate,
      postedDate: row.postedDate,
      rawValues: JSON.stringify(row.rawValues),
    })),
  };
};
