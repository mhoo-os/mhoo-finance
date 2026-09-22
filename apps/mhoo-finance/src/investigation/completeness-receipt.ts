export type FinanceCoverageState =
  | 'PROVEN_COMPLETE'
  | 'SOURCE_COMPLETE_UNRECONCILED'
  | 'PARTIAL'
  | 'MISSING'
  | 'OUT_OF_SCOPE'
  | 'SUPERSEDED';

const validatedCompletenessReceipt: unique symbol = Symbol(
  'validatedCompletenessReceipt',
);

export type FinanceCompletenessReceipt = Readonly<{
  [validatedCompletenessReceipt]: true;
  version: 'finance-completeness/v1';
  receiptId: string;
  populationKey: string;
  population: string;
  entityScope: string;
  accountScope: string;
  periodStart: string;
  periodEnd: string;
  timezone: string;
  basis: string;
  acquisitionMethod: string;
  acquiredAt: string;
  authorityReceiptId: string;
  contentHash: string | null;
  sourceLocator: string | null;
  lifecycleState: string;
  expectedPopulation: string;
  observedPopulation: string;
  tests: readonly Readonly<{
    id: string;
    result: 'PASS' | 'FAIL';
    detail: string;
  }>[];
  gaps: readonly string[];
  exclusions: readonly string[];
  accessState: 'AUTHORIZED' | 'ACCESS_NOT_AUTHORIZED';
  coverageState: FinanceCoverageState;
  reviewerReference: string;
  reviewedAt: string;
}>;

const COVERAGE_STATES = new Set<FinanceCoverageState>([
  'PROVEN_COMPLETE',
  'SOURCE_COMPLETE_UNRECONCILED',
  'PARTIAL',
  'MISSING',
  'OUT_OF_SCOPE',
  'SUPERSEDED',
]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/i;
const COMPLETE_LIFECYCLE_STATES = new Set([
  'ACTIVE',
  'POSTED',
  'SNAPSHOT_ONLY',
]);
const COMPLETENESS_PROCEDURES = new Set([
  'authority-check',
  'balance-control',
  'hash-locator',
  'page-continuity',
  'pagination-cursor',
  'period-continuity',
  'population-count',
  'statement-balance',
]);
const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const validInstant = (value: unknown): value is string =>
  nonEmpty(value) && !Number.isNaN(Date.parse(value));
const validIsoDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};
const validTimezone = (value: unknown): value is string => {
  if (!nonEmpty(value)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};
const stringArray = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 100 &&
  value.every((item) => nonEmpty(item));

/**
 * Validates the proof behind a named coverage claim. The legacy Coverage
 * status remains presentation metadata; only this receipt can support
 * PROVEN_COMPLETE.
 */
export const parseFinanceCompletenessReceipt = (
  value: string | null,
): FinanceCompletenessReceipt | null => {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    const row = parsed as Record<string, unknown>;
    const tests = row.tests;
    if (
      row.version !== 'finance-completeness/v1' ||
      !nonEmpty(row.receiptId) ||
      !nonEmpty(row.populationKey) ||
      !nonEmpty(row.population) ||
      !nonEmpty(row.entityScope) ||
      !nonEmpty(row.accountScope) ||
      !validIsoDate(row.periodStart) ||
      !validIsoDate(row.periodEnd) ||
      row.periodStart > row.periodEnd ||
      !validTimezone(row.timezone) ||
      !nonEmpty(row.basis) ||
      !nonEmpty(row.acquisitionMethod) ||
      !validInstant(row.acquiredAt) ||
      !nonEmpty(row.authorityReceiptId) ||
      (row.contentHash !== null &&
        (typeof row.contentHash !== 'string' ||
          !SHA256.test(row.contentHash))) ||
      (row.sourceLocator !== null && !nonEmpty(row.sourceLocator)) ||
      !nonEmpty(row.lifecycleState) ||
      !nonEmpty(row.expectedPopulation) ||
      !nonEmpty(row.observedPopulation) ||
      !Array.isArray(tests) ||
      !tests.length ||
      tests.length > 100 ||
      !tests.every((test) => {
        if (!test || typeof test !== 'object') return false;
        const candidate = test as Record<string, unknown>;
        return (
          nonEmpty(candidate.id) &&
          (candidate.result === 'PASS' || candidate.result === 'FAIL') &&
          nonEmpty(candidate.detail)
        );
      }) ||
      !stringArray(row.gaps) ||
      !stringArray(row.exclusions) ||
      (row.accessState !== 'AUTHORIZED' &&
        row.accessState !== 'ACCESS_NOT_AUTHORIZED') ||
      !COVERAGE_STATES.has(row.coverageState as FinanceCoverageState) ||
      !nonEmpty(row.reviewerReference) ||
      !validInstant(row.reviewedAt)
    ) {
      return null;
    }

    if (
      row.coverageState === 'PROVEN_COMPLETE' &&
      (row.accessState !== 'AUTHORIZED' ||
        row.contentHash === null ||
        row.sourceLocator === null ||
        !COMPLETE_LIFECYCLE_STATES.has(row.lifecycleState as string) ||
        row.expectedPopulation !== row.observedPopulation ||
        row.gaps.length > 0 ||
        Date.parse(row.reviewedAt as string) <
          Date.parse(row.acquiredAt as string) ||
        !tests.some(
          (test) =>
            COMPLETENESS_PROCEDURES.has(
              (test as Record<string, unknown>).id as string,
            ) && (test as Record<string, unknown>).result === 'PASS',
        ) ||
        tests.some(
          (test) =>
            !COMPLETENESS_PROCEDURES.has(
              (test as Record<string, unknown>).id as string,
            ),
        ) ||
        tests.some(
          (test) => (test as Record<string, unknown>).result !== 'PASS',
        ))
    ) {
      return null;
    }

    return Object.freeze({
      version: 'finance-completeness/v1',
      receiptId: row.receiptId,
      populationKey: row.populationKey,
      population: row.population,
      entityScope: row.entityScope,
      accountScope: row.accountScope,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      timezone: row.timezone,
      basis: row.basis,
      acquisitionMethod: row.acquisitionMethod,
      acquiredAt: row.acquiredAt,
      authorityReceiptId: row.authorityReceiptId,
      contentHash: row.contentHash,
      sourceLocator: row.sourceLocator,
      lifecycleState: row.lifecycleState,
      expectedPopulation: row.expectedPopulation,
      observedPopulation: row.observedPopulation,
      tests: Object.freeze(
        tests.map((test) => Object.freeze({ ...(test as object) })),
      ),
      gaps: Object.freeze([...row.gaps]),
      exclusions: Object.freeze([...row.exclusions]),
      accessState: row.accessState,
      coverageState: row.coverageState as FinanceCoverageState,
      reviewerReference: row.reviewerReference,
      reviewedAt: row.reviewedAt,
      [validatedCompletenessReceipt]: true as const,
    }) as FinanceCompletenessReceipt;
  } catch {
    return null;
  }
};
