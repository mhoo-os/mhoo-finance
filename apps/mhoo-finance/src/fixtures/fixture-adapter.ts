import type {
  CoveragePeriod,
  FixtureDataset,
  FixtureVariant,
  ImportReceipt,
  NormalizedFact,
  ReconciliationException,
  SourceArtifact,
} from './fixture-pack';

/**
 * Phase A has no runtime identity provider or installed Workspace. This is the
 * one source-level contract for choosing and mapping synthetic fixture data;
 * callers must supply an explicit Workspace and role context. It is deliberately
 * fail-closed and is not evidence that the Twenty runtime enforces this policy.
 */
export const FINANCE_FIXTURE_WORKSPACE_ID = 'mhoo-finance-fixture-workspace';
// Matches FINANCE_FIXTURE_READER_ROLE_UNIVERSAL_IDENTIFIER without importing a
// manifest module into the fixture generator's Node-only path.
export const FINANCE_FIXTURE_READER_ROLE = '2d981602-93e3-4f0a-9cf3-bb14a001f85c';

export type FixtureSelectionRequest = {
  workspaceId: string;
  roleIds: readonly string[];
};

export type FinanceFixtureNativeRecords = {
  sourceArtifacts: Array<{
    artifactKey: SourceArtifact['artifactId'];
    accountKey?: string;
    sourceKind: SourceArtifact['sourceKind'];
    period: SourceArtifact['period'];
    contentHash: SourceArtifact['contentHash'];
    revision: SourceArtifact['revision'];
    status: ImportReceipt['status'];
    freshness: SourceArtifact['freshness'];
    rowCount: SourceArtifact['rowCount'];
    originalFileName?: string;
    mimeType?: string;
    byteLength?: number;
    acquiredAt?: string;
    acquiredBy?: string;
    supersedesArtifactKey?: string;
    originalFiles?: readonly { id: string }[];
    statementControls?: string;
  }>;
  importReceipts: Array<{
    receiptKey: ImportReceipt['receiptId'];
    artifactKey: ImportReceipt['artifactId'];
    status: ImportReceipt['status'];
    attempts: ImportReceipt['attempts'];
    importedRows: ImportReceipt['importedRows'];
    deduplicatedRows: ImportReceipt['deduplicatedRows'];
    sourceRevision: ImportReceipt['sourceRevision'];
    contentHash: ImportReceipt['contentHash'];
    checkpoint?: string;
    rejectedRows?: number;
    parserProfile?: string;
  }>;
  financeFacts: Array<{
    factKey: NormalizedFact['factKey'];
    sourceRowKey: NormalizedFact['sourceRowKey'];
    artifactKey: NormalizedFact['artifactId'];
    period: NormalizedFact['period'];
    amount: number;
    classification: NormalizedFact['classification'];
    status: NormalizedFact['status'];
    revision: NormalizedFact['revision'];
    includedInTotals: NormalizedFact['includedInTotals'];
    exclusionReason: NormalizedFact['exclusionReason'];
    description: NormalizedFact['description'];
    sourceLocation?: string;
    sourceAmount?: string;
    sourceSignConvention?: string;
    transactionDate?: string;
    postedDate?: string;
    rawValues?: string;
    originalFiles?: readonly { id: string }[];
    statementControls?: string;
  }>;
  coveragePeriods: Array<
    Pick<
      CoveragePeriod,
      | 'coverageKey'
      | 'period'
      | 'sourceKind'
      | 'status'
      | 'expectedPopulation'
      | 'observedRows'
      | 'freshness'
      | 'lineage'
    >
  >;
  reconciliationExceptions: Array<{
    exceptionKey: ReconciliationException['exceptionKey'];
    period: ReconciliationException['period'];
    severity: ReconciliationException['severity'];
    status: ReconciliationException['status'];
    expectedAmount: number;
    observedAmount: number;
    difference: number;
    reason: ReconciliationException['reason'];
    supportingEvidence: ReconciliationException['supportingEvidence'];
    limitingEvidence: ReconciliationException['limitingEvidence'];
    nextAction: ReconciliationException['nextAction'];
    artifactKey: ReconciliationException['artifactId'];
  }>;
};

export type FixtureSelection =
  | {
      status: 'AUTHORIZED';
      dataset: FixtureDataset;
      nativeRecords: FinanceFixtureNativeRecords;
    }
  | {
      status: 'DENIED';
      reason: 'WORKSPACE_MISMATCH' | 'ROLE_MISSING';
    };

const hasFixtureReaderRole = (roleIds: readonly string[]): boolean =>
  roleIds.includes(FINANCE_FIXTURE_READER_ROLE);

const toNativeRecords = (dataset: FixtureDataset): FinanceFixtureNativeRecords => ({
  sourceArtifacts: dataset.artifacts.map(
    ({
      artifactId,
      sourceKind,
      period,
      contentHash,
      revision,
      freshness,
      rowCount,
    }) => ({
      artifactKey: artifactId,
      sourceKind,
      period,
      contentHash,
      revision,
      status:
        dataset.receipts.find((receipt) => receipt.artifactId === artifactId)
          ?.status ?? 'IMPORTED',
      freshness,
      rowCount,
    }),
  ),
  importReceipts: dataset.receipts.map(
    ({
      receiptId,
      artifactId,
      status,
      attempts,
      importedRows,
      deduplicatedRows,
      sourceRevision,
      contentHash,
    }) => ({
      receiptKey: receiptId,
      artifactKey: artifactId,
      status,
      attempts,
      importedRows,
      deduplicatedRows,
      sourceRevision,
      contentHash,
    }),
  ),
  financeFacts: dataset.facts.map(
    ({
      factKey,
      sourceRowKey,
      artifactId,
      period,
      amountCents,
      classification,
      status,
      revision,
      includedInTotals,
      exclusionReason,
      description,
    }) => ({
      factKey,
      sourceRowKey,
      artifactKey: artifactId,
      period,
      amount: amountCents / 100,
      classification,
      status,
      revision,
      includedInTotals,
      exclusionReason,
      description,
    }),
  ),
  coveragePeriods: dataset.coverage.map(
    ({
      coverageKey,
      period,
      sourceKind,
      status,
      expectedPopulation,
      observedRows,
      freshness,
      lineage,
    }) => ({
      coverageKey,
      period,
      sourceKind,
      status,
      expectedPopulation,
      observedRows,
      freshness,
      lineage,
    }),
  ),
  reconciliationExceptions: dataset.exceptions.map(
    ({
      exceptionKey,
      period,
      severity,
      status,
      expectedCents,
      observedCents,
      differenceCents,
      reason,
      supportingEvidence,
      limitingEvidence,
      nextAction,
      artifactId,
    }) => ({
      exceptionKey,
      period,
      severity,
      status,
      expectedAmount: expectedCents / 100,
      observedAmount: observedCents / 100,
      difference: differenceCents / 100,
      reason,
      supportingEvidence,
      limitingEvidence,
      nextAction,
      artifactKey: artifactId,
    }),
  ),
});

const select = (
  request: FixtureSelectionRequest,
  dataset: FixtureDataset,
): FixtureSelection => {
  if (request.workspaceId !== FINANCE_FIXTURE_WORKSPACE_ID) {
    return { status: 'DENIED', reason: 'WORKSPACE_MISMATCH' };
  }

  if (!hasFixtureReaderRole(request.roleIds)) {
    return { status: 'DENIED', reason: 'ROLE_MISSING' };
  }

  return {
    status: 'AUTHORIZED',
    dataset,
    nativeRecords: toNativeRecords(dataset),
  };
};

export const financeFixtureAdapter = {
  fixtureWorkspaceId: FINANCE_FIXTURE_WORKSPACE_ID,
  fixtureReaderRole: FINANCE_FIXTURE_READER_ROLE,
  select,
  toNativeRecords,
  toGeneratedFixturePack: (generatedAt: string, dataset: FixtureDataset) => ({
    generatedAt,
    dataset,
    nativeRecords: toNativeRecords(dataset),
  }),
  buildSelectionRequest: (
    variant: FixtureVariant,
  ): FixtureSelectionRequest & { variant: FixtureVariant } => ({
    workspaceId: FINANCE_FIXTURE_WORKSPACE_ID,
    roleIds: [FINANCE_FIXTURE_READER_ROLE],
    variant,
  }),
} as const;
