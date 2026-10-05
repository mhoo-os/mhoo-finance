import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  CORRECTED_SOURCE_ARTIFACT_CONTENT,
  buildFixtureDataset,
} from 'src/fixtures/fixture-pack';
import { FINANCE_FIXTURE_READER_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  FINANCE_FIXTURE_READER_ROLE,
  FINANCE_FIXTURE_WORKSPACE_ID,
  financeFixtureAdapter,
} from 'src/fixtures/fixture-adapter';

describe('Mhoo Finance fixture-first vertical slice', () => {
  it('contains the required synthetic source and edge-case coverage', () => {
    const dataset = buildFixtureDataset();

    expect(dataset.artifacts.some((artifact) => artifact.duplicateOf)).toBe(true);
    expect(dataset.rawRows.some((sourceRow) => sourceRow.classification === 'REFUND')).toBe(true);
    expect(dataset.rawRows.some((sourceRow) => sourceRow.classification === 'VOID')).toBe(true);
    expect(dataset.rawRows.some((sourceRow) => sourceRow.classification === 'DISCOUNT')).toBe(true);
    expect(dataset.rawRows.some((sourceRow) => sourceRow.classification === 'INTERNAL_TRANSFER')).toBe(true);
    expect(dataset.rawRows.some((sourceRow) => sourceRow.classification === 'CARD_PAYMENT')).toBe(true);
    expect(dataset.rawRows.some((sourceRow) => sourceRow.status === 'SUPERSEDED')).toBe(true);
    expect(dataset.coverage.some((item) => item.status === 'NO_DATA')).toBe(true);
    expect(dataset.coverage.some((item) => item.status === 'NO_ACTIVITY')).toBe(true);
    expect(dataset.coverage.some((item) => item.status === 'STALE')).toBe(true);
    expect(dataset.coverage.some((item) => item.status === 'PARTIAL')).toBe(true);
    expect(dataset.exceptions.some((exception) => exception.status === 'RESOLVED')).toBe(true);
    expect(dataset.exceptions.some((exception) => exception.status === 'OPEN')).toBe(true);
  });

  it('suppresses duplicate files, rows, and retries without changing authoritative facts', () => {
    const dataset = buildFixtureDataset();
    const rerun = buildFixtureDataset();

    expect(dataset.headline.duplicateSuppressedCount).toBeGreaterThan(0);
    expect(dataset.headline.factCount).toBe(rerun.headline.factCount);
    expect(dataset.headline.exposureCents).toBe(rerun.headline.exposureCents);
    expect(dataset.facts).toEqual(rerun.facts);
    expect(dataset.receipts.find((receipt) => receipt.status === 'DUPLICATE')).toMatchObject({
      attempts: 2,
      importedRows: 0,
    });
  });

  it('keeps source correction and pending-to-posted transitions on immutable v1/v2 lineage', () => {
    const original = buildFixtureDataset('original');
    const corrected = buildFixtureDataset('corrected');
    const originalFebruary = original.periods.find((period) => period.period === '2026-02');
    const correctedFebruary = corrected.periods.find((period) => period.period === '2026-02');
    const correctedToast = corrected.facts.find((fact) => fact.sourceRowKey === 'toast-2026-02-002');
    const correctedCard = corrected.facts.find((fact) => fact.sourceRowKey === 'card-2026-02-001');
    const originalToast = original.facts.find((fact) => fact.sourceRowKey === 'toast-2026-02-002');
    const originalCard = original.facts.find((fact) => fact.sourceRowKey === 'card-2026-02-001');

    expect(correctedFebruary?.operatingTotalCents).toBe(
      (originalFebruary?.operatingTotalCents ?? 0) - 1600,
    );
    expect(originalToast).toMatchObject({
      artifactId: 'artifact-toast-2026-02-v1',
      amountCents: 11900,
      revision: 1,
      revisionCount: 1,
    });
    expect(correctedToast).toMatchObject({
      artifactId: 'artifact-toast-2026-02-v2',
      amountCents: 12100,
      revision: 2,
      revisionCount: 2,
    });
    expect(originalCard).toMatchObject({
      artifactId: 'artifact-card-2026-02-v1',
      status: 'PENDING',
      includedInTotals: false,
      revision: 1,
      revisionCount: 1,
    });
    expect(correctedCard).toMatchObject({
      artifactId: 'artifact-card-2026-02-v2',
      status: 'POSTED',
      revision: 2,
      revisionCount: 2,
    });

    for (const [artifactId, content] of Object.entries(
      CORRECTED_SOURCE_ARTIFACT_CONTENT,
    )) {
      const expectedHash = createHash('sha256').update(content).digest('hex');
      const artifact = corrected.artifacts.find(
        (candidate) => candidate.artifactId === artifactId,
      );
      const receipt = corrected.receipts.find(
        (candidate) => candidate.artifactId === artifactId,
      );

      expect(artifact).toMatchObject({
        contentHash: expectedHash,
        revision: artifactId.endsWith('-v2') ? 2 : 1,
      });
      expect(receipt).toMatchObject({
        receiptId: `receipt-${artifactId}`,
        artifactId,
        contentHash: expectedHash,
        sourceRevision: artifactId.endsWith('-v2') ? 2 : 1,
        status: 'IMPORTED',
      });
    }

    expect(original.artifacts.map((artifact) => artifact.artifactId)).not.toContain(
      'artifact-card-2026-02-v2',
    );
    expect(original.artifacts.map((artifact) => artifact.artifactId)).not.toContain(
      'artifact-toast-2026-02-v2',
    );
  });

  it('limits corrected selection deltas to the affected February summary and source revisions', () => {
    const original = buildFixtureDataset('original');
    const corrected = buildFixtureDataset('corrected');
    const changedSummaries = corrected.periods.filter((summary, index) => {
      const previous = original.periods[index];

      return JSON.stringify(summary) !== JSON.stringify(previous);
    });

    expect(changedSummaries).toHaveLength(1);
    expect(changedSummaries[0]).toMatchObject({
      period: '2026-02',
      factCount: 7,
      includedFactCount: 5,
      operatingTotalCents: 36400,
      excludedAmountCents: 9800,
    });
    expect(original.headline.artifactCount).toBe(original.artifacts.length);
    expect(corrected.headline.artifactCount).toBe(corrected.artifacts.length);
    expect(corrected.headline.artifactCount).toBe(
      original.headline.artifactCount + 2,
    );
    expect(corrected.exceptions).toEqual(original.exceptions);
  });

  it('maps one authorized fixture selection to native-object-shaped records and denies others', () => {
    const dataset = buildFixtureDataset('corrected');
    expect(FINANCE_FIXTURE_READER_ROLE).toBe(
      FINANCE_FIXTURE_READER_ROLE_UNIVERSAL_IDENTIFIER,
    );
    const authorized = financeFixtureAdapter.select(
      {
        workspaceId: FINANCE_FIXTURE_WORKSPACE_ID,
        roleIds: [FINANCE_FIXTURE_READER_ROLE],
      },
      dataset,
    );
    const missingRole = financeFixtureAdapter.select(
      { workspaceId: FINANCE_FIXTURE_WORKSPACE_ID, roleIds: [] },
      dataset,
    );
    const otherWorkspace = financeFixtureAdapter.select(
      {
        workspaceId: 'another-workspace',
        roleIds: [FINANCE_FIXTURE_READER_ROLE],
      },
      dataset,
    );

    expect(authorized.status).toBe('AUTHORIZED');
    if (authorized.status === 'AUTHORIZED') {
      expect(authorized.dataset).toBe(dataset);
      expect(authorized.nativeRecords.financeFacts).toEqual(
        dataset.facts.map((fact) =>
          expect.objectContaining({
            factKey: fact.factKey,
            artifactKey: fact.artifactId,
            amount: fact.amountCents / 100,
          }),
        ),
      );
      expect(authorized.nativeRecords.sourceArtifacts).toEqual(
        dataset.artifacts.map((artifact) =>
          expect.objectContaining({
            artifactKey: artifact.artifactId,
            contentHash: artifact.contentHash,
          }),
        ),
      );
    }
    expect(missingRole).toEqual({ status: 'DENIED', reason: 'ROLE_MISSING' });
    expect(otherWorkspace).toEqual({
      status: 'DENIED',
      reason: 'WORKSPACE_MISMATCH',
    });
  });

  it('excludes internal movements and POS overlap while retaining lineage', () => {
    const dataset = buildFixtureDataset();
    expect(dataset.facts.find((fact) => fact.sourceRowKey === 'bank-2026-01-002')).toMatchObject({
      includedInTotals: false,
      exclusionReason: 'INTERNAL_MOVEMENT',
    });
    expect(dataset.facts.find((fact) => fact.sourceRowKey === 'bank-2026-01-003')).toMatchObject({
      includedInTotals: false,
      exclusionReason: 'INTERNAL_MOVEMENT',
    });
    expect(dataset.facts.find((fact) => fact.sourceRowKey === 'clover-2026-02-001')).toMatchObject({
      includedInTotals: false,
      exclusionReason: 'POS_OVERLAP',
    });
    expect(dataset.trace.map((step) => step.kind)).toEqual([
      'DASHBOARD',
      'EXCEPTION',
      'FACT',
      'ARTIFACT_ROW',
    ]);
    expect(dataset.trace[3].reference).toContain('artifact-clover-2026-02');
  });

  it('explains an exception with evidence, limitations, and a bounded action', () => {
    const exception = buildFixtureDataset().exceptions.find(
      (candidate) => candidate.status === 'OPEN',
    );

    expect(exception).toBeDefined();
    expect(exception).toMatchObject({
      reason: expect.any(String),
      supportingEvidence: expect.any(String),
      limitingEvidence: expect.any(String),
      nextAction: expect.any(String),
    });
  });
});
