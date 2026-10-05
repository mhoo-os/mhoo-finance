export type FixtureVariant = 'original' | 'corrected';

export type SourceKind = 'BANK' | 'CARD' | 'TOAST' | 'CLOVER';
export type CoverageStatus =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'NO_DATA'
  | 'NO_ACTIVITY'
  | 'STALE';
export type FactStatus = 'POSTED' | 'PENDING' | 'SUPERSEDED';
export type FactClassification =
  | 'REVENUE'
  | 'OPERATING_EXPENSE'
  | 'REFUND'
  | 'VOID'
  | 'DISCOUNT'
  | 'INTERNAL_TRANSFER'
  | 'CARD_PAYMENT'
  | 'UNCLASSIFIED';

export type SourceArtifact = {
  artifactId: string;
  fileName: string;
  sourceKind: SourceKind;
  period: string;
  contentHash: string;
  revision: number;
  freshness: 'FRESH' | 'STALE';
  rowCount: number;
  duplicateOf?: string;
};

export type SourceRow = {
  sourceRowKey: string;
  artifactId: string;
  rowNumber: number;
  period: string;
  sourceKind: SourceKind;
  eventKey: string;
  amountCents: number;
  description: string;
  classification: FactClassification;
  status: FactStatus;
  revision: number;
};

export type ImportReceipt = {
  receiptId: string;
  artifactId: string;
  status: 'IMPORTED' | 'DUPLICATE' | 'PARTIAL' | 'REJECTED' | 'IMPORTED_WITH_REJECTIONS';
  attempts: number;
  importedRows: number;
  deduplicatedRows: number;
  sourceRevision: number;
  contentHash: string;
};

export type NormalizedFact = {
  factKey: string;
  sourceRowKey: string;
  artifactId: string;
  rowNumber: number;
  period: string;
  sourceKind: SourceKind;
  eventKey: string;
  amountCents: number;
  description: string;
  classification: FactClassification;
  status: FactStatus;
  revision: number;
  revisionCount: number;
  includedInTotals: boolean;
  exclusionReason?:
    | 'DUPLICATE_ROW'
    | 'PENDING_NOT_POSTED'
    | 'INTERNAL_MOVEMENT'
    | 'POS_OVERLAP'
    | 'SOURCE_UNRECONCILED';
};

export type CoveragePeriod = {
  coverageKey: string;
  period: string;
  sourceKind: SourceKind;
  status: CoverageStatus;
  artifactIds: string[];
  expectedPopulation: string;
  observedRows: number;
  freshness: 'FRESH' | 'STALE' | 'NOT_APPLICABLE';
  lineage: string;
};

export type ReconciliationException = {
  exceptionKey: string;
  period: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'RESOLVED';
  expectedCents: number;
  observedCents: number;
  differenceCents: number;
  reason: string;
  supportingEvidence: string;
  limitingEvidence: string;
  nextAction: string;
  artifactId: string;
  sourceRowKeys: string[];
};

export type PeriodSummary = {
  period: string;
  coverageStatus: CoverageStatus;
  factCount: number;
  includedFactCount: number;
  operatingTotalCents: number;
  excludedAmountCents: number;
  freshness: 'FRESH' | 'STALE' | 'NOT_APPLICABLE';
  lineage: string;
};

export type TraceStep = {
  kind: 'DASHBOARD' | 'EXCEPTION' | 'FACT' | 'ARTIFACT_ROW';
  label: string;
  reference: string;
};

export type DashboardModel = {
  datasetId: string;
  variant: FixtureVariant;
  headline: {
    artifactCount: number;
    receiptCount: number;
    factCount: number;
    completeCoverageCount: number;
    noDataCoverageCount: number;
    noActivityCoverageCount: number;
    openExceptionCount: number;
    exposureCents: number;
    revisionCount: number;
    duplicateSuppressedCount: number;
  };
  coverage: CoveragePeriod[];
  periods: PeriodSummary[];
  exceptions: ReconciliationException[];
  facts: NormalizedFact[];
  artifacts: SourceArtifact[];
  receipts: ImportReceipt[];
  trace: TraceStep[];
};

export type FixtureDataset = DashboardModel & {
  rawRows: SourceRow[];
  replayedRows: SourceRow[];
};

export const FIXTURE_DATASET_ID = 'mhoo-finance-fixture-2026-09-v1';
export const FIXTURE_GENERATED_AT = '2026-09-01T00:00:00.000Z';

// These are canonical, synthetic source payloads. Their SHA-256 identities are
// deliberately stored with the immutable artifact revision rather than derived
// from a dashboard row. The unit suite recomputes the hashes with node:crypto.
export const CORRECTED_SOURCE_ARTIFACT_CONTENT = {
  'artifact-card-2026-02-v1':
    '{"period":"2026-02","revision":1,"source":"CARD","rows":[{"amountCents":-1800,"eventKey":"card-expense-2026-02-001","status":"PENDING"},{"amountCents":-1400,"eventKey":"card-expense-2026-02-002","status":"POSTED"}]}',
  'artifact-card-2026-02-v2':
    '{"period":"2026-02","revision":2,"source":"CARD","rows":[{"amountCents":-1800,"eventKey":"card-expense-2026-02-001","status":"POSTED"},{"amountCents":-1400,"eventKey":"card-expense-2026-02-002","status":"POSTED"}]}',
  'artifact-toast-2026-02-v1':
    '{"period":"2026-02","revision":1,"source":"TOAST","rows":[{"amountCents":12500,"eventKey":"pos-revenue-2026-02","status":"POSTED"},{"amountCents":11900,"eventKey":"pos-corrected-revenue-2026-02","status":"POSTED"}]}',
  'artifact-toast-2026-02-v2':
    '{"period":"2026-02","revision":2,"source":"TOAST","rows":[{"amountCents":12500,"eventKey":"pos-revenue-2026-02","status":"POSTED"},{"amountCents":12100,"eventKey":"pos-corrected-revenue-2026-02","status":"POSTED"}]}',
} as const;

const ARTIFACTS: SourceArtifact[] = [
  {
    artifactId: 'artifact-bank-2026-01',
    fileName: 'synthetic-bank-2026-01.csv',
    sourceKind: 'BANK',
    period: '2026-01',
    contentHash: 'fixture-bank-2026-01-v1',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 3,
  },
  {
    artifactId: 'artifact-bank-2026-01-copy',
    fileName: 'synthetic-bank-2026-01-copy.csv',
    sourceKind: 'BANK',
    period: '2026-01',
    contentHash: 'fixture-bank-2026-01-v1',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 1,
    duplicateOf: 'artifact-bank-2026-01',
  },
  {
    artifactId: 'artifact-card-2026-01',
    fileName: 'synthetic-card-2026-01.csv',
    sourceKind: 'CARD',
    period: '2026-01',
    contentHash: 'fixture-card-2026-01-v1',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 2,
  },
  {
    artifactId: 'artifact-toast-2026-01',
    fileName: 'synthetic-toast-2026-01.json',
    sourceKind: 'TOAST',
    period: '2026-01',
    contentHash: 'fixture-toast-2026-01-v1',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 3,
  },
  {
    artifactId: 'artifact-bank-2026-02',
    fileName: 'synthetic-bank-2026-02.csv',
    sourceKind: 'BANK',
    period: '2026-02',
    contentHash: 'fixture-bank-2026-02-v1',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 2,
  },
  {
    artifactId: 'artifact-card-2026-02-v1',
    fileName: 'synthetic-card-2026-02-v1.csv',
    sourceKind: 'CARD',
    period: '2026-02',
    contentHash: '7f9b958a63aadbcf2f4519cf11be95a8516347d10016a9009e5a75f02cde9f37',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 2,
  },
  {
    artifactId: 'artifact-card-2026-02-v2',
    fileName: 'synthetic-card-2026-02-v2.csv',
    sourceKind: 'CARD',
    period: '2026-02',
    contentHash: 'ab9e676d3ef759a0c01750b058ad6fb88f85bc58c4b92fb081522489cd5c7315',
    revision: 2,
    freshness: 'FRESH',
    rowCount: 2,
  },
  {
    artifactId: 'artifact-toast-2026-02-v1',
    fileName: 'synthetic-toast-2026-02-v1.json',
    sourceKind: 'TOAST',
    period: '2026-02',
    contentHash: 'fb74c41b56131e72fd8e9c273b424be89fc5afe56910ef0cb129e7281356e94b',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 2,
  },
  {
    artifactId: 'artifact-toast-2026-02-v2',
    fileName: 'synthetic-toast-2026-02-v2.json',
    sourceKind: 'TOAST',
    period: '2026-02',
    contentHash: '3c9a9d11c088faf550be18d7f7c3e891b4ed4d3fd2fdfd52fb33162fa57a982c',
    revision: 2,
    freshness: 'FRESH',
    rowCount: 2,
  },
  {
    artifactId: 'artifact-clover-2026-02',
    fileName: 'synthetic-clover-2026-02.json',
    sourceKind: 'CLOVER',
    period: '2026-02',
    contentHash: 'fixture-clover-2026-02-v1',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 1,
  },
  {
    artifactId: 'artifact-bank-2026-03',
    fileName: 'synthetic-bank-2026-03.csv',
    sourceKind: 'BANK',
    period: '2026-03',
    contentHash: 'fixture-bank-2026-03-v1',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 2,
  },
  {
    artifactId: 'artifact-card-2026-03',
    fileName: 'synthetic-card-2026-03.csv',
    sourceKind: 'CARD',
    period: '2026-03',
    contentHash: 'fixture-card-2026-03-v1',
    revision: 1,
    freshness: 'STALE',
    rowCount: 1,
  },
  {
    artifactId: 'artifact-clover-2026-03',
    fileName: 'synthetic-clover-2026-03.json',
    sourceKind: 'CLOVER',
    period: '2026-03',
    contentHash: 'fixture-clover-2026-03-v1',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 2,
  },
  {
    artifactId: 'artifact-bank-2026-05-zero',
    fileName: 'synthetic-bank-2026-05-zero.csv',
    sourceKind: 'BANK',
    period: '2026-05',
    contentHash: 'fixture-bank-2026-05-zero-v1',
    revision: 1,
    freshness: 'FRESH',
    rowCount: 0,
  },
];

const row = (
  sourceRowKey: string,
  artifactId: string,
  rowNumber: number,
  period: string,
  sourceKind: SourceKind,
  eventKey: string,
  amountCents: number,
  description: string,
  classification: FactClassification,
  status: FactStatus,
  revision: number,
): SourceRow => ({
  sourceRowKey,
  artifactId,
  rowNumber,
  period,
  sourceKind,
  eventKey,
  amountCents,
  description,
  classification,
  status,
  revision,
});

export const createFixtureRows = (variant: FixtureVariant): SourceRow[] => {
  const rows: SourceRow[] = [
    row('bank-2026-01-001', 'artifact-bank-2026-01', 1, '2026-01', 'BANK', 'bank-settlement-2026-01', 12500, 'Synthetic January settlement', 'REVENUE', 'POSTED', 1),
    row('bank-2026-01-002', 'artifact-bank-2026-01', 2, '2026-01', 'BANK', 'transfer-2026-01', -1000, 'Transfer between synthetic business accounts', 'INTERNAL_TRANSFER', 'POSTED', 1),
    row('bank-2026-01-003', 'artifact-bank-2026-01', 3, '2026-01', 'BANK', 'card-payment-2026-01', -2500, 'Synthetic credit-card payment', 'CARD_PAYMENT', 'POSTED', 1),
    row('bank-2026-01-001', 'artifact-bank-2026-01-copy', 1, '2026-01', 'BANK', 'bank-settlement-2026-01', 12500, 'Synthetic January settlement duplicate row', 'REVENUE', 'POSTED', 1),
    row('card-2026-01-001', 'artifact-card-2026-01', 1, '2026-01', 'CARD', 'card-expense-2026-01-001', -6000, 'Synthetic supplies expense', 'OPERATING_EXPENSE', 'POSTED', 1),
    row('card-2026-01-002', 'artifact-card-2026-01', 2, '2026-01', 'CARD', 'card-expense-2026-01-002', -1500, 'Synthetic software expense', 'OPERATING_EXPENSE', 'POSTED', 1),
    row('toast-2026-01-001', 'artifact-toast-2026-01', 1, '2026-01', 'TOAST', 'pos-revenue-2026-01', 11000, 'Synthetic Toast revenue', 'REVENUE', 'POSTED', 1),
    row('toast-2026-01-002', 'artifact-toast-2026-01', 2, '2026-01', 'TOAST', 'pos-refund-2026-01', -200, 'Synthetic customer refund', 'REFUND', 'POSTED', 1),
    row('toast-2026-01-003', 'artifact-toast-2026-01', 3, '2026-01', 'TOAST', 'pos-discount-2026-01', -50, 'Synthetic promotional discount', 'DISCOUNT', 'POSTED', 1),
    row('bank-2026-02-001', 'artifact-bank-2026-02', 1, '2026-02', 'BANK', 'bank-settlement-2026-02', 15000, 'Synthetic February settlement', 'REVENUE', 'POSTED', 1),
    row('bank-2026-02-002', 'artifact-bank-2026-02', 2, '2026-02', 'BANK', 'card-payment-2026-02', -2700, 'Synthetic credit-card payment', 'CARD_PAYMENT', 'POSTED', 1),
    row('card-2026-02-001', 'artifact-card-2026-02-v1', 1, '2026-02', 'CARD', 'card-expense-2026-02-001', -1800, 'Synthetic expense pending settlement', 'OPERATING_EXPENSE', variant === 'original' ? 'PENDING' : 'SUPERSEDED', 1),
    row('card-2026-02-002', 'artifact-card-2026-02-v1', 2, '2026-02', 'CARD', 'card-expense-2026-02-002', -1400, 'Synthetic travel expense', 'OPERATING_EXPENSE', 'POSTED', 1),
    row('toast-2026-02-001', 'artifact-toast-2026-02-v1', 1, '2026-02', 'TOAST', 'pos-revenue-2026-02', 12500, 'Synthetic Toast revenue before POS overlap review', 'REVENUE', 'POSTED', 1),
    row('toast-2026-02-002', 'artifact-toast-2026-02-v1', 2, '2026-02', 'TOAST', 'pos-corrected-revenue-2026-02', 11900, 'Synthetic Toast revenue before source correction', 'REVENUE', variant === 'original' ? 'POSTED' : 'SUPERSEDED', 1),
    row('bank-2026-03-001', 'artifact-bank-2026-03', 1, '2026-03', 'BANK', 'bank-settlement-2026-03', 17000, 'Synthetic March settlement control total', 'REVENUE', 'POSTED', 1),
    row('bank-2026-03-002', 'artifact-bank-2026-03', 2, '2026-03', 'BANK', 'transfer-2026-03', -1200, 'Transfer between synthetic business accounts', 'INTERNAL_TRANSFER', 'POSTED', 1),
    row('card-2026-03-001', 'artifact-card-2026-03', 1, '2026-03', 'CARD', 'card-expense-2026-03-001', -6500, 'Synthetic March expense with stale statement source', 'OPERATING_EXPENSE', 'POSTED', 1),
    row('clover-2026-02-001', 'artifact-clover-2026-02', 1, '2026-02', 'CLOVER', 'pos-revenue-2026-02', 12500, 'Synthetic Clover overlap with Toast', 'REVENUE', 'POSTED', 1),
    row('clover-2026-03-001', 'artifact-clover-2026-03', 1, '2026-03', 'CLOVER', 'pos-revenue-2026-03', 17100, 'Synthetic Clover revenue control difference', 'REVENUE', 'POSTED', 1),
    row('clover-2026-03-002', 'artifact-clover-2026-03', 2, '2026-03', 'CLOVER', 'pos-void-2026-03', -300, 'Synthetic void', 'VOID', 'POSTED', 1),
  ];

  if (variant === 'corrected') {
    rows.push(
      row('card-2026-02-001', 'artifact-card-2026-02-v2', 1, '2026-02', 'CARD', 'card-expense-2026-02-001', -1800, 'Synthetic expense posted after pending state', 'OPERATING_EXPENSE', 'POSTED', 2),
      row('toast-2026-02-002', 'artifact-toast-2026-02-v2', 2, '2026-02', 'TOAST', 'pos-corrected-revenue-2026-02', 12100, 'Synthetic Toast revenue corrected by source revision', 'REVENUE', 'POSTED', 2),
    );
  }

  return rows;
};

const artifactsFor = (variant: FixtureVariant): SourceArtifact[] =>
  ARTIFACTS.filter(
    (artifact) =>
      variant === 'corrected' ||
      (artifact.artifactId !== 'artifact-card-2026-02-v2' &&
        artifact.artifactId !== 'artifact-toast-2026-02-v2'),
  );

type IngestionResult = {
  artifacts: SourceArtifact[];
  receipts: ImportReceipt[];
  canonicalRows: SourceRow[];
  duplicateSuppressedCount: number;
};

const ingestFixturePack = (
  artifacts: SourceArtifact[],
  replayedRows: SourceRow[],
): IngestionResult => {
  const canonicalArtifactByHash = new Map<string, SourceArtifact>();
  const receipts: ImportReceipt[] = [];
  for (const artifact of artifacts) {
    const canonicalArtifact = canonicalArtifactByHash.get(artifact.contentHash);
    const isDuplicate = canonicalArtifact !== undefined;
    if (!isDuplicate) {
      canonicalArtifactByHash.set(artifact.contentHash, artifact);
    }
    receipts.push({
      receiptId: `receipt-${artifact.artifactId}`,
      artifactId: artifact.artifactId,
      status: isDuplicate ? 'DUPLICATE' : 'IMPORTED',
      attempts: 2,
      importedRows: isDuplicate ? 0 : artifact.rowCount,
      deduplicatedRows: isDuplicate ? artifact.rowCount : 0,
      sourceRevision: artifact.revision,
      contentHash: artifact.contentHash,
    });
  }

  const rowsByKey = new Map<string, SourceRow[]>();
  for (const sourceRow of replayedRows) {
    const rows = rowsByKey.get(sourceRow.sourceRowKey) ?? [];
    rows.push(sourceRow);
    rowsByKey.set(sourceRow.sourceRowKey, rows);
  }

  const canonicalRowsByRevision = new Map<string, SourceRow>();
  for (const sourceRow of replayedRows) {
    const revisionKey = `${sourceRow.sourceRowKey}#${sourceRow.revision}`;
    const existing = canonicalRowsByRevision.get(revisionKey);
    if (existing === undefined || sourceRow.artifactId.localeCompare(existing.artifactId) < 0) {
      canonicalRowsByRevision.set(revisionKey, sourceRow);
    }
  }
  const canonicalRows = [...canonicalRowsByRevision.values()].sort((left, right) => {
    if (left.sourceRowKey !== right.sourceRowKey) {
      return left.sourceRowKey.localeCompare(right.sourceRowKey);
    }
    return left.revision - right.revision;
  });

  return {
    artifacts,
    receipts,
    canonicalRows,
    duplicateSuppressedCount: replayedRows.length - canonicalRows.length,
  };
};

const normalizeFacts = (
  rows: SourceRow[],
  artifacts: SourceArtifact[],
): NormalizedFact[] => {
  const rowsByKey = new Map<string, SourceRow[]>();
  for (const sourceRow of rows) {
    const revisions = rowsByKey.get(sourceRow.sourceRowKey) ?? [];
    revisions.push(sourceRow);
    rowsByKey.set(sourceRow.sourceRowKey, revisions);
  }
  const artifactById = new Map(artifacts.map((artifact) => [artifact.artifactId, artifact]));
  const latestRows = [...rowsByKey.values()].map((revisions) =>
    [...revisions].sort((left, right) => right.revision - left.revision)[0],
  );
  const posRevenueRows = latestRows.filter(
    (sourceRow) =>
      sourceRow.classification === 'REVENUE' &&
      (sourceRow.sourceKind === 'TOAST' || sourceRow.sourceKind === 'CLOVER'),
  );
  const firstPosRevenueByEvent = new Map<string, SourceRow>();
  for (const sourceRow of posRevenueRows.sort((left, right) => {
    if (left.sourceKind !== right.sourceKind) {
      return left.sourceKind === 'TOAST' ? -1 : 1;
    }
    return left.sourceRowKey.localeCompare(right.sourceRowKey);
  })) {
    if (!firstPosRevenueByEvent.has(sourceRow.eventKey)) {
      firstPosRevenueByEvent.set(sourceRow.eventKey, sourceRow);
    }
  }

  return latestRows
    .map((sourceRow): NormalizedFact => {
      const artifact = artifactById.get(sourceRow.artifactId);
      const duplicatePosRevenue =
        sourceRow.classification === 'REVENUE' &&
        (sourceRow.sourceKind === 'TOAST' || sourceRow.sourceKind === 'CLOVER') &&
        firstPosRevenueByEvent.get(sourceRow.eventKey)?.sourceRowKey !== sourceRow.sourceRowKey;
      const exclusionReason = duplicatePosRevenue
        ? 'POS_OVERLAP'
        : sourceRow.status === 'PENDING'
          ? 'PENDING_NOT_POSTED'
          : sourceRow.classification === 'INTERNAL_TRANSFER' ||
              sourceRow.classification === 'CARD_PAYMENT'
            ? 'INTERNAL_MOVEMENT'
            : undefined;
      return {
        factKey: `fact-${sourceRow.sourceRowKey}-r${sourceRow.revision}`,
        sourceRowKey: sourceRow.sourceRowKey,
        artifactId: artifact?.duplicateOf ?? sourceRow.artifactId,
        rowNumber: sourceRow.rowNumber,
        period: sourceRow.period,
        sourceKind: sourceRow.sourceKind,
        eventKey: sourceRow.eventKey,
        amountCents: sourceRow.amountCents,
        description: sourceRow.description,
        classification: sourceRow.classification,
        status: sourceRow.status,
        revision: sourceRow.revision,
        revisionCount: rowsByKey.get(sourceRow.sourceRowKey)?.length ?? 1,
        includedInTotals: exclusionReason === undefined,
        exclusionReason,
      };
    })
    .sort((left, right) => left.factKey.localeCompare(right.factKey));
};

const latestRowsFor = (rows: SourceRow[]): SourceRow[] => {
  const latestBySourceRowKey = new Map<string, SourceRow>();
  for (const sourceRow of rows) {
    const current = latestBySourceRowKey.get(sourceRow.sourceRowKey);
    if (current === undefined || sourceRow.revision > current.revision) {
      latestBySourceRowKey.set(sourceRow.sourceRowKey, sourceRow);
    }
  }

  return [...latestBySourceRowKey.values()];
};

const coverageFor = (
  artifacts: SourceArtifact[],
  rows: SourceRow[],
): CoveragePeriod[] => {
  const periods = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'];
  const sources: SourceKind[] = ['BANK', 'CARD', 'TOAST', 'CLOVER'];
  return periods.flatMap((period) =>
    sources.map((sourceKind) => {
      const matchingArtifacts = artifacts.filter(
        (artifact) => artifact.period === period && artifact.sourceKind === sourceKind,
      );
      const observedRows = rows.filter(
        (sourceRow) =>
          sourceRow.period === period && sourceRow.sourceKind === sourceKind,
      ).length;
      const stale = matchingArtifacts.some((artifact) => artifact.freshness === 'STALE');
      const status: CoverageStatus =
        stale
          ? 'STALE'
          : matchingArtifacts.length === 0
            ? 'NO_DATA'
            : observedRows === 0
              ? 'NO_ACTIVITY'
              : matchingArtifacts.some((artifact) => artifact.duplicateOf !== undefined)
                ? 'PARTIAL'
                : 'COMPLETE';
      return {
        coverageKey: `coverage-${sourceKind.toLowerCase()}-${period}`,
        period,
        sourceKind,
        status,
        artifactIds: matchingArtifacts.map((artifact) => artifact.artifactId),
        expectedPopulation: sourceKind === 'BANK' || sourceKind === 'CARD' ? 'monthly statement' : 'POS settlement',
        observedRows,
        freshness: stale ? 'STALE' : matchingArtifacts.length === 0 ? 'NOT_APPLICABLE' : 'FRESH',
        lineage: matchingArtifacts.length === 0 ? `no artifact observed for ${sourceKind} ${period}` : matchingArtifacts.map((artifact) => artifact.artifactId).join(', '),
      };
    }),
  );
};

const reconciliationFor = (variant: FixtureVariant): ReconciliationException[] => [
  {
    exceptionKey: 'exception-control-total-2026-01',
    period: '2026-01',
    severity: 'LOW',
    status: 'RESOLVED',
    expectedCents: 11000,
    observedCents: 11000,
    differenceCents: 0,
    reason: 'Toast control total agrees with the synthetic settlement control total.',
    supportingEvidence: 'Toast artifact and bank settlement rows agree for the January fixture.',
    limitingEvidence: 'This is a synthetic control total and does not prove a real source period.',
    nextAction: 'Retain the resolved receipt and use the same control-total procedure for the next source revision.',
    artifactId: 'artifact-toast-2026-01',
    sourceRowKeys: ['toast-2026-01-001', 'bank-2026-01-001'],
  },
  {
    exceptionKey: 'exception-pos-overlap-2026-02',
    period: '2026-02',
    severity: 'HIGH',
    status: 'OPEN',
    expectedCents: 12500,
    observedCents: 25000,
    differenceCents: 12500,
    reason: 'Toast-first and Clover-later POS feeds contain the same February event key.',
    supportingEvidence: 'Both POS rows carry pos-revenue-2026-02 and identical synthetic amounts.',
    limitingEvidence: 'The overlap is fixture-authored; provider settlement identity and historical reach remain unproven.',
    nextAction: 'Choose one authoritative POS source for the overlapping period and retain the excluded row in lineage.',
    artifactId: 'artifact-clover-2026-02',
    sourceRowKeys: ['toast-2026-02-001', 'clover-2026-02-001'],
  },
  {
    exceptionKey: 'exception-bank-control-2026-03',
    period: '2026-03',
    severity: 'MEDIUM',
    status: 'OPEN',
    expectedCents: 17000,
    observedCents: variant === 'original' ? 17100 : 17100,
    differenceCents: 100,
    reason: 'Clover March revenue exceeds the synthetic bank control total by one dollar.',
    supportingEvidence: 'The exact Clover row and bank settlement row are linked by the March control procedure.',
    limitingEvidence: 'The fixture does not establish whether the difference is timing, fee treatment, or a source error.',
    nextAction: 'Request the bounded settlement detail needed to classify the difference before drawing a conclusion.',
    artifactId: 'artifact-clover-2026-03',
    sourceRowKeys: ['clover-2026-03-001', 'bank-2026-03-001'],
  },
];

const periodSummariesFor = (
  coverage: CoveragePeriod[],
  facts: NormalizedFact[],
): PeriodSummary[] => ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'].map((period) => {
  const periodFacts = facts.filter((fact) => fact.period === period);
  const periodCoverage = coverage.filter((item) => item.period === period);
  const status = periodCoverage.some((item) => item.status === 'STALE')
    ? 'STALE'
    : periodCoverage.some((item) => item.status === 'PARTIAL')
      ? 'PARTIAL'
      : periodCoverage.every((item) => item.status === 'NO_DATA')
        ? 'NO_DATA'
        : periodCoverage.some((item) => item.status === 'NO_ACTIVITY') && periodFacts.length === 0
          ? 'NO_ACTIVITY'
          : 'COMPLETE';
  return {
    period,
    coverageStatus: status,
    factCount: periodFacts.length,
    includedFactCount: periodFacts.filter((fact) => fact.includedInTotals).length,
    operatingTotalCents: periodFacts.filter((fact) => fact.includedInTotals).reduce((sum, fact) => sum + fact.amountCents, 0),
    excludedAmountCents: periodFacts.filter((fact) => !fact.includedInTotals).reduce((sum, fact) => sum + fact.amountCents, 0),
    freshness: periodCoverage.some((item) => item.freshness === 'STALE') ? 'STALE' : periodFacts.length === 0 ? 'NOT_APPLICABLE' : 'FRESH',
    lineage: periodFacts.length === 0 ? `coverage records only: ${period}` : periodFacts.map((fact) => fact.factKey).join(', '),
  };
});

const traceFor = (exception: ReconciliationException, fact: NormalizedFact | undefined): TraceStep[] => [
  { kind: 'DASHBOARD', label: 'Open exception exposure', reference: 'headline.exposureCents' },
  { kind: 'EXCEPTION', label: exception.reason, reference: exception.exceptionKey },
  { kind: 'FACT', label: fact?.description ?? 'Synthetic source fact', reference: fact?.factKey ?? exception.sourceRowKeys[0] },
  { kind: 'ARTIFACT_ROW', label: 'Original fixture artifact row', reference: `${exception.artifactId}#row-${fact?.rowNumber ?? 1}` },
];

export const buildFixtureDataset = (variant: FixtureVariant = 'corrected'): FixtureDataset => {
  const rawRows = createFixtureRows(variant);
  const replayedRows = [...rawRows, ...rawRows];
  const artifacts = artifactsFor(variant);
  const ingestion = ingestFixturePack(artifacts, replayedRows);
  const facts = normalizeFacts(ingestion.canonicalRows, artifacts);
  const coverage = coverageFor(artifacts, latestRowsFor(rawRows));
  const exceptions = reconciliationFor(variant);
  const openExceptions = exceptions.filter((exception) => exception.status === 'OPEN');
  const firstException = openExceptions[0];
  const firstFact = facts.find(
    (fact) =>
      fact.sourceRowKey === firstException?.sourceRowKeys[1] ||
      fact.sourceRowKey === firstException?.sourceRowKeys[0],
  );
  const periods = periodSummariesFor(coverage, facts);
  const headline = {
    artifactCount: ingestion.artifacts.length,
    receiptCount: ingestion.receipts.length,
    factCount: facts.length,
    completeCoverageCount: coverage.filter((item) => item.status === 'COMPLETE').length,
    noDataCoverageCount: coverage.filter((item) => item.status === 'NO_DATA').length,
    noActivityCoverageCount: coverage.filter((item) => item.status === 'NO_ACTIVITY').length,
    openExceptionCount: openExceptions.length,
    exposureCents: openExceptions.reduce((sum, exception) => sum + Math.abs(exception.differenceCents), 0),
    revisionCount: facts.filter((fact) => fact.revisionCount > 1).length,
    duplicateSuppressedCount: ingestion.duplicateSuppressedCount,
  };
  return {
    datasetId: FIXTURE_DATASET_ID,
    variant,
    headline,
    coverage,
    periods,
    exceptions,
    facts,
    artifacts: ingestion.artifacts,
    receipts: ingestion.receipts,
    trace: firstException ? traceFor(firstException, firstFact) : [],
    rawRows,
    replayedRows,
  };
};

export const FIXTURE_DASHBOARD = buildFixtureDataset('corrected');
