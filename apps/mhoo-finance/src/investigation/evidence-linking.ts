export type EvidenceSourceType = 'BANK' | 'POS' | 'STATEMENT' | 'EMAIL';
export type EvidenceDirection = 'in' | 'out' | 'unknown';

export type EvidenceLinkInput = Readonly<{
  id: string;
  sourceType: EvidenceSourceType;
  sourceReference: string;
  sourceRecordId?: string;
  settlementReference?: string;
  transferReference?: string;
  account: string;
  date: string;
  direction: EvidenceDirection;
  amountMinor: string;
  currency: string;
}>;

const evaluatedEvidenceLink: unique symbol = Symbol('evaluatedEvidenceLink');

export type EvaluatedEvidenceLink = Readonly<{
  [evaluatedEvidenceLink]: true;
  ruleVersion: 'finance-evidence-link/v1';
  kind: 'AUTO_LINK' | 'REVIEW_REQUIRED' | 'NO_LINK';
  reasonCode:
    | 'DUPLICATE_SOURCE_RECORD'
    | 'EXPLICIT_SETTLEMENT_REFERENCE'
    | 'EXPLICIT_TRANSFER_PAIR'
    | 'CURRENCY_MISMATCH'
    | 'DIRECTION_MISMATCH'
    | 'AMOUNT_DATE_CANDIDATE'
    | 'INSUFFICIENT_EXPLICIT_EVIDENCE';
  explanation: string;
  sourceReferences: readonly [string, string];
  preservesOriginals: true;
  preventsDuplicateFinancialEntry: boolean;
  incomeExpenseClassification: 'UNCHANGED';
}>;

const dateDistance = (left: string, right: string) =>
  Math.abs(Date.parse(`${left}T00:00:00Z`) - Date.parse(`${right}T00:00:00Z`)) /
  86_400_000;

const seal = (
  value: Omit<EvaluatedEvidenceLink, typeof evaluatedEvidenceLink>,
): EvaluatedEvidenceLink =>
  Object.freeze({
    ...value,
    sourceReferences: Object.freeze([...value.sourceReferences]) as readonly [
      string,
      string,
    ],
    [evaluatedEvidenceLink]: true as const,
  });

/**
 * Relates two already-normalized synthetic records using explicit identifiers,
 * amounts, dates and directions. Descriptions are deliberately never read.
 */
export const evaluateEvidenceLink = (
  entry: EvidenceLinkInput,
  evidence: EvidenceLinkInput,
): EvaluatedEvidenceLink => {
  const common = {
    ruleVersion: 'finance-evidence-link/v1' as const,
    sourceReferences: [
      entry.sourceReference,
      evidence.sourceReference,
    ] as const,
    preservesOriginals: true as const,
    incomeExpenseClassification: 'UNCHANGED' as const,
  };

  if (
    entry.sourceType === evidence.sourceType &&
    entry.sourceRecordId &&
    entry.sourceRecordId === evidence.sourceRecordId
  ) {
    return seal({
      ...common,
      kind: 'AUTO_LINK',
      reasonCode: 'DUPLICATE_SOURCE_RECORD',
      explanation:
        'The source type and stable source record ID are identical. Keep one financial entry and retain both acquisition references.',
      preventsDuplicateFinancialEntry: true,
    });
  }

  const sameAmount = entry.amountMinor === evidence.amountMinor;
  const sameCurrency =
    entry.currency.length > 0 && entry.currency === evidence.currency;
  const sameDirection =
    entry.direction !== 'unknown' && entry.direction === evidence.direction;

  if (
    sameAmount &&
    !sameCurrency &&
    ((entry.settlementReference &&
      entry.settlementReference === evidence.settlementReference) ||
      (entry.transferReference &&
        entry.transferReference === evidence.transferReference))
  ) {
    return seal({
      ...common,
      kind: 'REVIEW_REQUIRED',
      reasonCode: 'CURRENCY_MISMATCH',
      explanation:
        'The explicit reference agrees, but currency does not. Keep both records visible and require human review.',
      preventsDuplicateFinancialEntry: false,
    });
  }

  if (
    sameAmount &&
    sameCurrency &&
    entry.settlementReference &&
    entry.settlementReference === evidence.settlementReference &&
    !sameDirection
  ) {
    return seal({
      ...common,
      kind: 'REVIEW_REQUIRED',
      reasonCode: 'DIRECTION_MISMATCH',
      explanation:
        'The settlement reference and currency agree, but cash direction conflicts. Keep both records visible and require human review.',
      preventsDuplicateFinancialEntry: false,
    });
  }

  if (
    sameAmount &&
    sameCurrency &&
    sameDirection &&
    entry.settlementReference &&
    entry.settlementReference === evidence.settlementReference &&
    new Set([entry.sourceType, evidence.sourceType]).has('BANK') &&
    new Set([entry.sourceType, evidence.sourceType]).has('POS')
  ) {
    return seal({
      ...common,
      kind: 'AUTO_LINK',
      reasonCode: 'EXPLICIT_SETTLEMENT_REFERENCE',
      explanation:
        'Bank and POS records share an explicit settlement reference and amount. Link their evidence without counting a second cash entry.',
      preventsDuplicateFinancialEntry: true,
    });
  }

  if (
    sameAmount &&
    sameCurrency &&
    entry.transferReference &&
    entry.transferReference === evidence.transferReference &&
    entry.account !== evidence.account &&
    entry.direction !== 'unknown' &&
    evidence.direction !== 'unknown' &&
    entry.direction !== evidence.direction
  ) {
    return seal({
      ...common,
      kind: 'AUTO_LINK',
      reasonCode: 'EXPLICIT_TRANSFER_PAIR',
      explanation:
        'Opposite directions across two owned accounts share an explicit transfer reference and amount. Link the pair, but do not classify it as income or expense.',
      preventsDuplicateFinancialEntry: false,
    });
  }

  if (
    sameAmount &&
    sameCurrency &&
    sameDirection &&
    dateDistance(entry.date, evidence.date) <= 2
  ) {
    return seal({
      ...common,
      kind: 'REVIEW_REQUIRED',
      reasonCode: 'AMOUNT_DATE_CANDIDATE',
      explanation:
        evidence.sourceType === 'EMAIL'
          ? 'The email evidence has a compatible amount, date and direction, but email never creates or auto-links a financial entry.'
          : 'Amount, date and direction are compatible, but no stable shared identifier proves the relationship.',
      preventsDuplicateFinancialEntry: evidence.sourceType === 'EMAIL',
    });
  }

  return seal({
    ...common,
    kind: 'NO_LINK',
    reasonCode: 'INSUFFICIENT_EXPLICIT_EVIDENCE',
    explanation:
      'No explicit identifier rule matched. Direction remains unchanged and no relationship is inferred from description text.',
    preventsDuplicateFinancialEntry: evidence.sourceType === 'EMAIL',
  });
};

export type EvaluatedEvidenceCandidateSet = Readonly<{
  ruleVersion: 'finance-evidence-candidates/v1';
  kind: 'AUTO_LINK' | 'REVIEW_REQUIRED' | 'NO_LINK';
  reasonCode:
    | 'SINGLE_EXPLICIT_MATCH'
    | 'MULTIPLE_EXPLICIT_CANDIDATES'
    | 'CANDIDATES_REQUIRE_REVIEW'
    | 'NO_SUPPORTED_CANDIDATE';
  selectedEvidenceId: string | null;
  alternatives: readonly Readonly<{
    evidenceId: string;
    sourceReference: string;
    verdict: EvaluatedEvidenceLink['kind'];
    reasonCode: EvaluatedEvidenceLink['reasonCode'];
  }>[];
  requiresHumanReview: boolean;
}>;

/**
 * Applies the pairwise rule to a bounded candidate set. Explicit evidence wins
 * only when it identifies exactly one candidate; ties remain visible and never
 * fall through to source ordering.
 */
export const evaluateEvidenceCandidates = (
  entry: EvidenceLinkInput,
  candidates: readonly EvidenceLinkInput[],
): EvaluatedEvidenceCandidateSet => {
  if (candidates.length > 100) {
    throw new Error('Evidence candidate bound exceeded');
  }
  const alternatives = candidates
    .map((candidate) => ({
      evidenceId: candidate.id,
      sourceReference: candidate.sourceReference,
      result: evaluateEvidenceLink(entry, candidate),
    }))
    .filter(({ result }) => result.kind !== 'NO_LINK')
    .sort(
      (left, right) =>
        left.sourceReference.localeCompare(right.sourceReference) ||
        left.evidenceId.localeCompare(right.evidenceId),
    );
  const explicit = alternatives.filter(
    ({ result }) => result.kind === 'AUTO_LINK',
  );
  const publicAlternatives = Object.freeze(
    alternatives.map(({ evidenceId, sourceReference, result }) =>
      Object.freeze({
        evidenceId,
        sourceReference,
        verdict: result.kind,
        reasonCode: result.reasonCode,
      }),
    ),
  );

  if (explicit.length === 1) {
    return Object.freeze({
      ruleVersion: 'finance-evidence-candidates/v1',
      kind: 'AUTO_LINK',
      reasonCode: 'SINGLE_EXPLICIT_MATCH',
      selectedEvidenceId: explicit[0].evidenceId,
      alternatives: publicAlternatives,
      requiresHumanReview: false,
    });
  }
  if (explicit.length > 1) {
    return Object.freeze({
      ruleVersion: 'finance-evidence-candidates/v1',
      kind: 'REVIEW_REQUIRED',
      reasonCode: 'MULTIPLE_EXPLICIT_CANDIDATES',
      selectedEvidenceId: null,
      alternatives: publicAlternatives,
      requiresHumanReview: true,
    });
  }
  if (alternatives.length) {
    return Object.freeze({
      ruleVersion: 'finance-evidence-candidates/v1',
      kind: 'REVIEW_REQUIRED',
      reasonCode: 'CANDIDATES_REQUIRE_REVIEW',
      selectedEvidenceId: null,
      alternatives: publicAlternatives,
      requiresHumanReview: true,
    });
  }
  return Object.freeze({
    ruleVersion: 'finance-evidence-candidates/v1',
    kind: 'NO_LINK',
    reasonCode: 'NO_SUPPORTED_CANDIDATE',
    selectedEvidenceId: null,
    alternatives: publicAlternatives,
    requiresHumanReview: false,
  });
};

export type EvidenceLinkHistoryItem = Readonly<{
  at: string;
  action: 'AUTO_LINKED' | 'LINKED_AFTER_REVIEW' | 'UNLINKED' | 'RESTORED';
}>;

export type EvidenceLinkState = Readonly<{
  status: 'LINKED' | 'NEEDS_REVIEW' | 'UNLINKED' | 'NO_LINK';
  history: readonly EvidenceLinkHistoryItem[];
}>;

export type EvidenceLinkAction = Readonly<{
  type: 'LINK_AFTER_REVIEW' | 'UNLINK' | 'RESTORE';
  at: string;
}>;

export const initialEvidenceLinkState = (
  verdict: EvaluatedEvidenceLink,
  at = '2025-09-14T00:00:00.000Z',
): EvidenceLinkState =>
  Object.freeze({
    status:
      verdict.kind === 'AUTO_LINK'
        ? 'LINKED'
        : verdict.kind === 'REVIEW_REQUIRED'
          ? 'NEEDS_REVIEW'
          : 'NO_LINK',
    history: Object.freeze(
      verdict.kind === 'AUTO_LINK'
        ? [{ at, action: 'AUTO_LINKED' as const }]
        : [],
    ),
  });

export const reduceEvidenceLink = (
  state: EvidenceLinkState,
  action: EvidenceLinkAction,
): EvidenceLinkState => {
  const allowed =
    (action.type === 'LINK_AFTER_REVIEW' && state.status === 'NEEDS_REVIEW') ||
    (action.type === 'UNLINK' && state.status === 'LINKED') ||
    (action.type === 'RESTORE' && state.status === 'UNLINKED');
  if (!allowed) return state;

  const next =
    action.type === 'UNLINK'
      ? { status: 'UNLINKED' as const, action: 'UNLINKED' as const }
      : action.type === 'RESTORE'
        ? { status: 'LINKED' as const, action: 'RESTORED' as const }
        : {
            status: 'LINKED' as const,
            action: 'LINKED_AFTER_REVIEW' as const,
          };
  return Object.freeze({
    status: next.status,
    history: Object.freeze([
      ...state.history,
      { at: action.at, action: next.action },
    ]),
  });
};
