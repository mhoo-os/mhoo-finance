import { currency, minor, sumMoney, type Currency } from '../contracts/money';
import { parseFinanceCompletenessReceipt } from './completeness-receipt';
import {
  hasExactSelectedRecipients,
  isFinanceFollowUpTransitionAllowed,
  type FinanceDraftEmail,
  type FinanceFollowUpPerson,
  type FinanceFollowUpState,
} from './finance-follow-up-contract';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const nonEmpty = (value: string) => value.trim().length > 0;
const exactDate = (value: string) => {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};
const exactInstant = (value: string) =>
  nonEmpty(value) && !Number.isNaN(Date.parse(value));

export type InvestigationScope = Readonly<{
  runId: string;
  entityScope: string;
  accountScope: readonly string[];
  periodStart: string;
  periodEnd: string;
  timezone: string;
  basis: string;
  intendedUse: string;
  prohibitedOutputs: readonly string[];
  createdAt: string;
}>;

export const defineInvestigationScope = (
  input: InvestigationScope,
): InvestigationScope => {
  if (
    !UUID.test(input.runId) ||
    !nonEmpty(input.entityScope) ||
    !input.accountScope.length ||
    input.accountScope.some((value) => !nonEmpty(value)) ||
    !exactDate(input.periodStart) ||
    !exactDate(input.periodEnd) ||
    input.periodStart > input.periodEnd ||
    !nonEmpty(input.timezone) ||
    !nonEmpty(input.basis) ||
    !nonEmpty(input.intendedUse) ||
    !input.prohibitedOutputs.length ||
    input.prohibitedOutputs.some((value) => !nonEmpty(value)) ||
    !exactInstant(input.createdAt)
  ) {
    throw new Error('Invalid InvestigationRun scope');
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: input.timezone }).format();
  } catch {
    throw new Error('Invalid InvestigationRun timezone');
  }
  return Object.freeze({
    ...input,
    accountScope: Object.freeze([...new Set(input.accountScope)]),
    prohibitedOutputs: Object.freeze([...new Set(input.prohibitedOutputs)]),
  });
};

export type ExplanationEvent = Readonly<{
  sequence: number;
  type: 'EXPLANATION_RECORDED' | 'EXPLANATION_DISPOSED' | 'EVIDENCE_ADDED';
  explanationId: string;
  assertion?: string;
  disposition?: string;
  evidenceReferences?: readonly string[];
  contradicts?: boolean;
  occurredAt: string;
}>;

export type ExplanationState = Readonly<{
  explanationId: string;
  assertion: string;
  disposition: string | null;
  workflowState: 'INVESTIGATING' | 'DISPOSED' | 'REOPENED';
  evidenceReferences: readonly string[];
  history: readonly ExplanationEvent[];
}>;

export const reduceExplanationHistory = (
  events: readonly ExplanationEvent[],
): ExplanationState => {
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  if (!ordered.length || ordered[0].type !== 'EXPLANATION_RECORDED') {
    throw new Error('Explanation history must start with a recorded assertion');
  }
  if (
    ordered.some(
      (event, index) =>
        event.sequence !== index + 1 ||
        event.explanationId !== ordered[0].explanationId ||
        !exactInstant(event.occurredAt),
    )
  ) {
    throw new Error('Invalid explanation event sequence');
  }
  const assertion = ordered[0].assertion?.trim();
  if (!assertion) throw new Error('Explanation assertion required');
  let disposition: string | null = null;
  let workflowState: ExplanationState['workflowState'] = 'INVESTIGATING';
  const evidence: string[] = [];
  for (const event of ordered.slice(1)) {
    if (event.type === 'EXPLANATION_RECORDED')
      throw new Error('Explanation cannot be silently replaced');
    if (event.type === 'EXPLANATION_DISPOSED') {
      if (!event.disposition?.trim()) throw new Error('Disposition required');
      disposition = event.disposition;
      workflowState = 'DISPOSED';
    }
    if (event.type === 'EVIDENCE_ADDED') {
      const references = event.evidenceReferences ?? [];
      if (!references.length || references.some((value) => !nonEmpty(value)))
        throw new Error('Evidence reference required');
      evidence.push(...references);
      if (disposition && event.contradicts === true) workflowState = 'REOPENED';
    }
  }
  return Object.freeze({
    explanationId: ordered[0].explanationId,
    assertion,
    disposition,
    workflowState,
    evidenceReferences: Object.freeze([...new Set(evidence)]),
    history: Object.freeze(ordered),
  });
};

export type MatchGroupType =
  | 'EXACT_ONE_TO_ONE'
  | 'SPLIT_ONE_TO_MANY'
  | 'BATCH_MANY_TO_ONE'
  | 'MANY_TO_MANY';
export type MatchGroupMember = Readonly<{
  factReference: string;
  side: 'SOURCE' | 'TARGET';
  amountMinor: string;
  currency: string;
  explicitReference: string | null;
}>;

export const evaluateMatchGroup = (
  type: MatchGroupType,
  members: readonly MatchGroupMember[],
) => {
  if (members.length < 2 || members.length > 100)
    throw new Error('Invalid MatchGroup size');
  const sources = members.filter((member) => member.side === 'SOURCE');
  const targets = members.filter((member) => member.side === 'TARGET');
  const cardinalityValid =
    (type === 'EXACT_ONE_TO_ONE' &&
      sources.length === 1 &&
      targets.length === 1) ||
    (type === 'SPLIT_ONE_TO_MANY' &&
      sources.length === 1 &&
      targets.length > 1) ||
    (type === 'BATCH_MANY_TO_ONE' &&
      sources.length > 1 &&
      targets.length === 1) ||
    (type === 'MANY_TO_MANY' && sources.length > 1 && targets.length > 1);
  if (!cardinalityValid) throw new Error('MatchGroup cardinality mismatch');
  if (
    new Set(members.map((member) => member.factReference)).size !==
    members.length
  )
    throw new Error('Duplicate MatchGroup member');
  const currencies = new Set(
    members.map((member) => currency(member.currency)),
  );
  if (currencies.size !== 1) throw new Error('Mixed currency MatchGroup');
  const unit = [...currencies][0] as Currency;
  const total = (rows: readonly MatchGroupMember[]) =>
    sumMoney(
      rows.map((row) => ({
        currency: unit,
        minor: minor(row.amountMinor).toString(),
      })),
      unit,
    ).minor;
  const sourceMinor = total(sources);
  const targetMinor = total(targets);
  const residualMinor = minor(
    (minor(sourceMinor) - minor(targetMinor)).toString(),
  ).toString();
  const references = new Set(
    members.map((member) => member.explicitReference).filter(Boolean),
  );
  const exact = residualMinor === '0';
  return Object.freeze({
    type,
    currency: unit,
    sourceMinor,
    targetMinor,
    residualMinor,
    status: exact ? ('EXACT' as const) : ('REVIEW_REQUIRED' as const),
    autoLinkEligible:
      exact &&
      references.size === 1 &&
      members.every((member) => member.explicitReference !== null),
    preservesOriginals: true as const,
  });
};

type OptionalAmount = string | null;
export type CloverFundingBridgeInput = Readonly<{
  currency: string;
  merchantReference: string | null;
  businessDate: string | null;
  timezone: string | null;
  batchReference: string | null;
  batchMembership: 'EXPLICIT' | 'INFERRED' | null;
  saleBaseMinor: OptionalAmount;
  taxMinor: OptionalAmount;
  tipMinor: OptionalAmount;
  chargeMinor: OptionalAmount;
  refundMinor: OptionalAmount;
  adjustmentMinor: OptionalAmount;
  grossSalesMinor: OptionalAmount;
  totalTenderMinor: OptionalAmount;
  cardTenderMinor: OptionalAmount;
  cashTenderMinor: OptionalAmount;
  feeMinor: OptionalAmount;
  reserveMinor: OptionalAmount;
  fundingAdjustmentMinor: OptionalAmount;
  payoutMinor: OptionalAmount;
  bankDepositMinor: OptionalAmount;
}>;

export const evaluateCloverFundingBridge = (
  input: CloverFundingBridgeInput,
) => {
  const unit = currency(input.currency);
  for (const [label, value] of [
    ['merchantReference', input.merchantReference],
    ['batchReference', input.batchReference],
  ] as const) {
    if (value !== null && !nonEmpty(value))
      throw new Error(`Invalid Clover ${label}`);
  }
  if (input.businessDate !== null && !exactDate(input.businessDate))
    throw new Error('Invalid Clover business date');
  if (
    input.batchMembership !== null &&
    input.batchMembership !== 'EXPLICIT' &&
    input.batchMembership !== 'INFERRED'
  )
    throw new Error('Invalid Clover batch membership');
  if (input.timezone !== null) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: input.timezone }).format();
    } catch {
      throw new Error('Invalid Clover timezone');
    }
  }

  const signedAmountKeys = new Set([
    'adjustmentMinor',
    'fundingAdjustmentMinor',
  ]);
  const amounts = new Map<string, bigint | null>();
  for (const [key, value] of Object.entries(input)) {
    if (!key.endsWith('Minor')) continue;
    if (value === null) {
      amounts.set(key, null);
      continue;
    }
    const parsed = minor(value);
    if (!signedAmountKeys.has(key) && parsed < 0n)
      throw new Error('Clover bridge components must be non-negative');
    amounts.set(key, parsed);
  }
  const get = (key: string) => amounts.get(key) ?? null;
  const missing = Object.entries(input)
    .filter(([key, value]) => key !== 'currency' && value === null)
    .map(([key]) => key);
  const allKnown = (keys: readonly string[]) =>
    keys.every((key) => get(key) !== null);

  const expectedGross = allKnown([
    'saleBaseMinor',
    'taxMinor',
    'tipMinor',
    'chargeMinor',
    'refundMinor',
    'adjustmentMinor',
  ])
    ? minor(
        (
          (get('saleBaseMinor') as bigint) +
          (get('taxMinor') as bigint) +
          (get('tipMinor') as bigint) +
          (get('chargeMinor') as bigint) -
          (get('refundMinor') as bigint) +
          (get('adjustmentMinor') as bigint)
        ).toString(),
      )
    : null;
  const tenderBreakdown = allKnown(['cardTenderMinor', 'cashTenderMinor'])
    ? minor(
        (
          (get('cardTenderMinor') as bigint) +
          (get('cashTenderMinor') as bigint)
        ).toString(),
      )
    : null;
  const expectedPayout = allKnown([
    'cardTenderMinor',
    'feeMinor',
    'reserveMinor',
    'fundingAdjustmentMinor',
  ])
    ? minor(
        (
          (get('cardTenderMinor') as bigint) -
          (get('feeMinor') as bigint) -
          (get('reserveMinor') as bigint) +
          (get('fundingAdjustmentMinor') as bigint)
        ).toString(),
      )
    : null;
  const contradictions = [
    ...(expectedGross === null ||
    get('grossSalesMinor') === null ||
    expectedGross === get('grossSalesMinor')
      ? []
      : ['SALE_COMPONENT_MISMATCH']),
    ...(tenderBreakdown === null ||
    get('totalTenderMinor') === null ||
    tenderBreakdown === get('totalTenderMinor')
      ? []
      : ['TENDER_COMPONENT_MISMATCH']),
    ...(get('grossSalesMinor') === null ||
    get('totalTenderMinor') === null ||
    get('grossSalesMinor') === get('totalTenderMinor')
      ? []
      : ['GROSS_TENDER_MISMATCH']),
    ...(expectedPayout === null ||
    get('payoutMinor') === null ||
    expectedPayout === get('payoutMinor')
      ? []
      : ['PAYOUT_COMPONENT_MISMATCH']),
    ...(get('payoutMinor') === null ||
    get('bankDepositMinor') === null ||
    get('payoutMinor') === get('bankDepositMinor')
      ? []
      : ['PAYOUT_BANK_MISMATCH']),
  ];
  const residual =
    get('payoutMinor') !== null && get('bankDepositMinor') !== null
      ? minor(
          (
            (get('payoutMinor') as bigint) - (get('bankDepositMinor') as bigint)
          ).toString(),
        )
      : null;

  return Object.freeze({
    status: contradictions.length
      ? ('CONTRADICTED' as const)
      : missing.length
        ? ('PARTIAL' as const)
        : input.batchMembership === 'INFERRED'
          ? ('REVIEW_REQUIRED' as const)
          : ('ARITHMETICALLY_BALANCED' as const),
    currency: unit,
    merchantReference: input.merchantReference,
    businessDate: input.businessDate,
    timezone: input.timezone,
    batchReference: input.batchReference,
    batchMembership: input.batchMembership,
    expectedGrossMinor: expectedGross?.toString() ?? null,
    expectedPayoutMinor: expectedPayout?.toString() ?? null,
    residualMinor: residual?.toString() ?? null,
    contradictions: Object.freeze(contradictions),
    gaps: Object.freeze(missing),
    autoReconciled: false as const,
  });
};

export type BankLifecycleEvent = Readonly<{
  sequence: number;
  sourceRecordId: string;
  state: 'PENDING' | 'POSTED' | 'REMOVED' | 'REPLACED' | 'SUPERSEDED';
  replacesSourceRecordId: string | null;
}>;

export const reduceBankLifecycle = (events: readonly BankLifecycleEvent[]) => {
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  if (ordered.some((event, index) => event.sequence !== index + 1))
    throw new Error('Invalid provider lifecycle sequence');
  const current = new Map<
    string,
    { counted: boolean; state: BankLifecycleEvent['state'] }
  >();
  const successorBySourceRecordId = new Map<string, string>();
  for (const event of ordered) {
    if (!nonEmpty(event.sourceRecordId))
      throw new Error('Source record ID required');
    if (event.replacesSourceRecordId === event.sourceRecordId)
      throw new Error('Bank record cannot replace itself');
    const previous = current.get(event.sourceRecordId);
    if (previous) {
      const validTransition =
        (previous.state === 'PENDING' && event.state === 'POSTED') ||
        ((previous.state === 'POSTED' || previous.state === 'REPLACED') &&
          (event.state === 'REMOVED' || event.state === 'SUPERSEDED'));
      if (!validTransition)
        throw new Error('Invalid provider lifecycle transition');
      if (event.replacesSourceRecordId)
        throw new Error(
          'Existing record transition cannot replace another row',
        );
    } else if (event.state === 'REMOVED' || event.state === 'SUPERSEDED') {
      throw new Error('Provider lifecycle transition requires an existing row');
    }

    if (event.state === 'REPLACED' && !event.replacesSourceRecordId)
      throw new Error('Replacement source record required');
    if (event.replacesSourceRecordId) {
      const replaced = current.get(event.replacesSourceRecordId);
      if (!replaced)
        throw new Error('Replacement target must exist in lifecycle history');
      const validReplacement =
        (event.state === 'POSTED' && replaced.state === 'PENDING') ||
        (event.state === 'REPLACED' &&
          (replaced.state === 'POSTED' || replaced.state === 'REMOVED'));
      if (!validReplacement)
        throw new Error('Invalid provider replacement transition');
      if (successorBySourceRecordId.has(event.replacesSourceRecordId))
        throw new Error('Provider record already has a successor');
      successorBySourceRecordId.set(
        event.replacesSourceRecordId,
        event.sourceRecordId,
      );
      current.set(event.replacesSourceRecordId, {
        counted: false,
        state: 'SUPERSEDED',
      });
    }
    current.set(event.sourceRecordId, {
      counted: event.state === 'POSTED' || event.state === 'REPLACED',
      state: event.state,
    });
  }
  return Object.freeze({
    countedSourceRecordIds: Object.freeze(
      [...current].filter(([, record]) => record.counted).map(([id]) => id),
    ),
    history: Object.freeze(ordered.map((event) => Object.freeze({ ...event }))),
    preservesAllSourceRecords: true as const,
  });
};

export type MonthCoverage = Readonly<{
  month: string;
  state: 'PROVEN_COMPLETE' | 'PARTIAL' | 'MISSING';
  receiptJson: string | null;
}>;

export type PeriodCompletenessScope = Readonly<{
  entityScope: string;
  accountScope: string;
  populationKey: string;
  periodStart: string;
  periodEnd: string;
  timezone: string;
  basis: string;
}>;

const monthEnd = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const day = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${month}-${String(day).padStart(2, '0')}`;
};

const inclusiveMonths = (start: string, end: string) => {
  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);
  const startIndex = startYear * 12 + startMonth - 1;
  const endIndex = endYear * 12 + endMonth - 1;
  if (endIndex < startIndex || endIndex - startIndex > 600)
    throw new Error('Invalid completeness period');
  return Array.from({ length: endIndex - startIndex + 1 }, (_, offset) => {
    const index = startIndex + offset;
    return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
  });
};

export const evaluatePeriodCompleteness = (
  scope: PeriodCompletenessScope,
  receipts: readonly MonthCoverage[],
) => {
  const validMonth = (value: string) => /^\d{4}-(?:0[1-9]|1[0-2])$/.test(value);
  if (
    !nonEmpty(scope.entityScope) ||
    !nonEmpty(scope.accountScope) ||
    !nonEmpty(scope.populationKey) ||
    !validMonth(scope.periodStart) ||
    !validMonth(scope.periodEnd) ||
    !nonEmpty(scope.timezone) ||
    !nonEmpty(scope.basis)
  )
    throw new Error('Invalid completeness scope');
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: scope.timezone }).format();
  } catch {
    throw new Error('Invalid completeness timezone');
  }
  const expectedMonths = inclusiveMonths(scope.periodStart, scope.periodEnd);
  if (
    new Set(receipts.map((receipt) => receipt.month)).size !== receipts.length
  )
    throw new Error('Receipt months must be unique');
  const verifiedReceipts = receipts.map((receipt) => {
    if (!expectedMonths.includes(receipt.month) || !validMonth(receipt.month))
      throw new Error('Receipt month is outside the expected period');
    if (receipt.state === 'MISSING') {
      if (receipt.receiptJson !== null)
        throw new Error('Missing month cannot carry a completeness receipt');
      return Object.freeze({
        month: receipt.month,
        state: receipt.state,
        receiptReference: null,
      });
    }
    const parsed = parseFinanceCompletenessReceipt(receipt.receiptJson);
    if (
      !parsed ||
      parsed.periodStart !== `${receipt.month}-01` ||
      parsed.periodEnd !== monthEnd(receipt.month) ||
      parsed.entityScope !== scope.entityScope ||
      parsed.accountScope !== scope.accountScope ||
      parsed.populationKey !== scope.populationKey ||
      parsed.timezone !== scope.timezone ||
      parsed.basis !== scope.basis ||
      (receipt.state === 'PROVEN_COMPLETE'
        ? parsed.coverageState !== 'PROVEN_COMPLETE'
        : parsed.coverageState === 'PROVEN_COMPLETE' ||
          parsed.coverageState === 'MISSING')
    )
      throw new Error('Month coverage requires a scope-matched receipt');
    return Object.freeze({
      month: receipt.month,
      state: receipt.state,
      receiptReference: parsed.receiptId,
      authorityReceiptReference: parsed.authorityReceiptId,
    });
  });
  const byMonth = new Map(
    verifiedReceipts.map((receipt) => [receipt.month, receipt]),
  );
  const months = expectedMonths.map(
    (month) =>
      byMonth.get(month) ?? {
        month,
        state: 'MISSING' as const,
        receiptReference: null,
      },
  );
  const gaps = months.filter((month) => month.state !== 'PROVEN_COMPLETE');
  return Object.freeze({
    status: gaps.length
      ? ('INCOMPLETE' as const)
      : ('PROVEN_COMPLETE' as const),
    months: Object.freeze(months),
    gaps: Object.freeze(gaps.map((month) => month.month)),
    missingIsZeroActivity: false as const,
  });
};

export type FinanceFollowUpEvent = Readonly<{
  sequence: number;
  type:
    | 'CREATED'
    | 'EVIDENCE_ATTACHED'
    | 'DRAFT_PREPARED'
    | 'DRAFT_APPROVED_NOT_SENT'
    | 'REPLY_CORRELATED'
    | 'STATE_CHANGED';
  taskId: string;
  at: string;
  state?: FinanceFollowUpState;
  to?: FinanceFollowUpState;
  evidenceReference?: string;
  replyReference?: string;
  correlationKey?: string;
  draft?: FinanceDraftEmail;
}>;

export const reduceFinanceFollowUpEvents = (
  events: readonly FinanceFollowUpEvent[],
  people: readonly FinanceFollowUpPerson[],
) => {
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  if (!ordered.length || ordered[0].type !== 'CREATED' || !ordered[0].state)
    throw new Error('Follow-up must start with native Task creation');
  if (
    !UUID.test(ordered[0].taskId) ||
    ordered.some(
      (event, index) =>
        event.sequence !== index + 1 ||
        event.taskId !== ordered[0].taskId ||
        !exactInstant(event.at),
    )
  )
    throw new Error('Invalid follow-up event sequence');
  let state = ordered[0].state;
  let draft: FinanceDraftEmail | null = null;
  let approvedNotSent = false;
  const evidence: string[] = [];
  const replies: string[] = [];
  for (const event of ordered.slice(1)) {
    if (event.type === 'CREATED') throw new Error('Task cannot be recreated');
    if (event.type === 'STATE_CHANGED') {
      if (!event.to || !isFinanceFollowUpTransitionAllowed(state, event.to))
        throw new Error('Invalid Finance follow-up transition');
      state = event.to;
    }
    if (event.type === 'EVIDENCE_ATTACHED') {
      if (!event.evidenceReference?.trim())
        throw new Error('Evidence required');
      evidence.push(event.evidenceReference);
    }
    if (event.type === 'DRAFT_PREPARED') {
      if (!event.draft || !hasExactSelectedRecipients(event.draft, people))
        throw new Error('Draft recipients are not explicitly selected People');
      draft = event.draft;
      approvedNotSent = false;
    }
    if (event.type === 'DRAFT_APPROVED_NOT_SENT') {
      if (!draft) throw new Error('No request draft to approve');
      approvedNotSent = true;
    }
    if (event.type === 'REPLY_CORRELATED') {
      if (!event.replyReference?.trim() || !event.correlationKey?.trim())
        throw new Error('Attributed reply and correlation key required');
      replies.push(event.replyReference);
    }
  }
  return Object.freeze({
    taskId: ordered[0].taskId,
    state,
    evidenceReferences: Object.freeze([...new Set(evidence)]),
    draft,
    approval: approvedNotSent
      ? ('APPROVED_NOT_SENT' as const)
      : draft
        ? ('DRAFT' as const)
        : null,
    replyReferences: Object.freeze([...new Set(replies)]),
    sendAuthorized: false as const,
    history: Object.freeze(ordered),
  });
};
