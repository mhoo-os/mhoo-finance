import { RestApiClient } from 'twenty-client-sdk/rest';

import { currency, minor } from '../contracts/money';
import { parseFinanceCompletenessReceipt } from './completeness-receipt';
import {
  isFinanceFollowUpTransitionAllowed,
  parseFinanceDraftEmail,
  parseFinanceFollowUpState,
} from './finance-follow-up-contract';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^sha256:[0-9a-f]{64}$/i;
const EVENT_TYPES = new Set([
  'RUN_OPENED',
  'CONTRADICTION_RECORDED',
  'DISPOSITION_RECORDED',
  'RUN_REOPENED',
  'MATCH_GROUP_RECORDED',
  'COMPLETENESS_RECEIPT_RECORDED',
  'FOLLOW_UP_CREATED',
  'WORKFLOW_TRANSITIONED',
  'EVIDENCE_ATTACHED',
  'REQUEST_DRAFTED',
  'REQUEST_APPROVED_NOT_SENT',
  'REPLY_CANDIDATE_CORRELATED',
  'REPLY_ACCEPTED',
]);
const AGGREGATE_EVENTS: Readonly<Record<string, ReadonlySet<string>>> = {
  INVESTIGATION_RUN: new Set([
    'RUN_OPENED', 'CONTRADICTION_RECORDED', 'DISPOSITION_RECORDED',
    'RUN_REOPENED', 'MATCH_GROUP_RECORDED', 'COMPLETENESS_RECEIPT_RECORDED',
  ]),
  FOLLOW_UP: new Set([
    'FOLLOW_UP_CREATED', 'WORKFLOW_TRANSITIONED', 'EVIDENCE_ATTACHED',
    'REQUEST_DRAFTED', 'REQUEST_APPROVED_NOT_SENT',
    'REPLY_CANDIDATE_CORRELATED', 'REPLY_ACCEPTED',
  ]),
};

type StoredEvent = Readonly<{
  id: string;
  eventKey: string;
  aggregateKind: string;
  aggregateReference: string;
  sequence: number;
  eventType: string;
  eventPayload: string;
  previousEventReference: string;
  actorWorkspaceMemberId: string;
  occurredAt: string;
  nativeTaskReference: string;
}>;

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const textArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.length <= 100 && value.every(text);

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  return value;
};

const validatedPayload = (eventType: string, raw: unknown): string => {
  if (!EVENT_TYPES.has(eventType) || !raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('Unsupported Finance investigation event');
  const value = raw as Record<string, unknown>;
  const taskId = () => typeof value.taskId === 'string' && UUID.test(value.taskId);
  let valid = false;
  if (eventType === 'RUN_OPENED') {
    valid =
      exactKeys(value, ['scopeHash', 'ruleSetVersion']) &&
      typeof value.scopeHash === 'string' && SHA256.test(value.scopeHash) &&
      text(value.ruleSetVersion);
  }
  if (eventType === 'CONTRADICTION_RECORDED') {
    valid =
      exactKeys(value, [
        'assertion', 'supportingFactIds', 'contradictingFactIds', 'effectMinor',
        'currency', 'periodEffect', 'alternatives', 'procedure', 'nextEvidenceRequest',
      ]) &&
      text(value.assertion) && textArray(value.supportingFactIds) &&
      textArray(value.contradictingFactIds) && text(value.periodEffect) &&
      textArray(value.alternatives) && text(value.procedure) &&
      text(value.nextEvidenceRequest);
    if (valid) {
      minor(value.effectMinor);
      currency(value.currency);
    }
  }
  if (eventType === 'DISPOSITION_RECORDED')
    valid = exactKeys(value, ['subjectId', 'disposition']) && text(value.subjectId) && text(value.disposition);
  if (eventType === 'RUN_REOPENED')
    valid = exactKeys(value, ['invalidatedEventIds', 'evidenceReferences']) &&
      textArray(value.invalidatedEventIds) && textArray(value.evidenceReferences);
  if (eventType === 'MATCH_GROUP_RECORDED')
    valid = exactKeys(value, ['groupKey', 'calculationHash']) && text(value.groupKey) &&
      typeof value.calculationHash === 'string' && SHA256.test(value.calculationHash);
  if (eventType === 'COMPLETENESS_RECEIPT_RECORDED')
    valid = exactKeys(value, ['receipt']) && typeof value.receipt === 'string' &&
      parseFinanceCompletenessReceipt(value.receipt) !== null;
  if (eventType === 'FOLLOW_UP_CREATED')
    valid = exactKeys(value, ['taskId', 'subjectReferences', 'state']) && taskId() &&
      textArray(value.subjectReferences) && value.state === 'TO_DO';
  if (eventType === 'WORKFLOW_TRANSITIONED') {
    const from = parseFinanceFollowUpState(value.from as string);
    const to = parseFinanceFollowUpState(value.to as string);
    valid = exactKeys(value, ['taskId', 'from', 'to']) && taskId() && Boolean(from && to && isFinanceFollowUpTransitionAllowed(from, to));
  }
  if (eventType === 'EVIDENCE_ATTACHED')
    valid = exactKeys(value, ['taskId', 'evidenceReference']) && taskId() && text(value.evidenceReference);
  if (eventType === 'REQUEST_DRAFTED')
    valid = exactKeys(value, ['taskId', 'draft']) && taskId() &&
      typeof value.draft === 'string' && parseFinanceDraftEmail(value.draft) !== null;
  if (eventType === 'REQUEST_APPROVED_NOT_SENT')
    valid = exactKeys(value, ['taskId', 'draftEventId']) && taskId() &&
      typeof value.draftEventId === 'string' && UUID.test(value.draftEventId);
  if (eventType === 'REPLY_CANDIDATE_CORRELATED' || eventType === 'REPLY_ACCEPTED')
    valid = exactKeys(value, ['taskId', 'messageReference', 'correlationKey']) &&
      taskId() && text(value.messageReference) && text(value.correlationKey);
  if (!valid) throw new Error('Invalid Finance investigation event payload');
  const result = JSON.stringify(canonicalize(value));
  if (result.length > 32_000) throw new Error('Finance event payload too large');
  return result;
};

const isStoredEvent = (row: Partial<StoredEvent>): row is StoredEvent =>
  typeof row.id === 'string' && UUID.test(row.id) &&
  typeof row.eventKey === 'string' && row.eventKey === row.id &&
  typeof row.aggregateKind === 'string' && text(row.aggregateKind) &&
  typeof row.aggregateReference === 'string' && UUID.test(row.aggregateReference) &&
  typeof row.sequence === 'number' && Number.isSafeInteger(row.sequence) && row.sequence > 0 &&
  typeof row.eventType === 'string' && EVENT_TYPES.has(row.eventType) &&
  typeof row.eventPayload === 'string' &&
  typeof row.actorWorkspaceMemberId === 'string' && UUID.test(row.actorWorkspaceMemberId) &&
  typeof row.occurredAt === 'string' && !Number.isNaN(Date.parse(row.occurredAt));

export const appendInvestigationEvent = async (
  input: Readonly<{
    eventId: string;
    aggregateKind: string;
    aggregateReference: string;
    expectedSequence: number;
    previousEventReference: string | null;
    eventType: string;
    payload: unknown;
    nativeTaskReference?: string | null;
  }>,
  context: Readonly<{ workspaceMemberId: string; now: () => Date }>,
  client = new RestApiClient({ runAs: 'application' }),
): Promise<StoredEvent> => {
  if (!UUID.test(input.eventId) || !UUID.test(input.aggregateReference) ||
      !UUID.test(context.workspaceMemberId) ||
      !Number.isSafeInteger(input.expectedSequence) || input.expectedSequence < 0 ||
      (input.previousEventReference !== null && !UUID.test(input.previousEventReference)) ||
      (input.nativeTaskReference != null && !UUID.test(input.nativeTaskReference)))
    throw new Error('Invalid Finance event identity');
  if (!AGGREGATE_EVENTS[input.aggregateKind]?.has(input.eventType))
    throw new Error('Finance event does not belong to this aggregate');
  if (
    input.aggregateKind === 'FOLLOW_UP' &&
    (input.nativeTaskReference !== input.aggregateReference ||
      (input.payload as Record<string, unknown>)?.taskId !== input.aggregateReference)
  ) throw new Error('Finance follow-up must bind one native Task');
  const eventPayload = validatedPayload(input.eventType, input.payload);
  const latestResponse = await client.get<{
    data: { financeInvestigationEvents?: Partial<StoredEvent>[] };
  }>('/rest/financeInvestigationEvents', {
    query: {
      filter: `and(aggregateKind[eq]:${input.aggregateKind},aggregateReference[eq]:${input.aggregateReference})`,
      limit: 1,
      depth: 0,
      order_by: 'sequence[DescNullsLast]',
    },
  });
  const latest = latestResponse.data.financeInvestigationEvents?.[0] ?? null;
  const intendedBusinessFields = {
    id: input.eventId,
    eventKey: input.eventId,
    aggregateKind: input.aggregateKind,
    aggregateReference: input.aggregateReference,
    sequence: input.expectedSequence + 1,
    eventType: input.eventType,
    eventPayload,
    previousEventReference: input.previousEventReference ?? 'ROOT',
    actorWorkspaceMemberId: context.workspaceMemberId,
    nativeTaskReference: input.nativeTaskReference ?? 'NONE',
  } as const;
  if (latest?.id === input.eventId) {
    if (
      !isStoredEvent(latest) ||
      Object.entries(intendedBusinessFields).some(
        ([key, value]) => latest[key as keyof StoredEvent] !== value,
      )
    ) throw new Error('Finance investigation event replay mismatch');
    return Object.freeze({ ...latest });
  }
  if (
    (latest && !isStoredEvent(latest)) ||
    (latest?.sequence ?? 0) !== input.expectedSequence ||
    (latest?.id ?? null) !== input.previousEventReference
  ) throw new Error('Finance event stream changed since it was read');
  const event: StoredEvent = {
    ...intendedBusinessFields,
    occurredAt: context.now().toISOString(),
  };
  try {
    await client.post('/rest/financeInvestigationEvents', event);
  } catch {
    // A uniqueness response may be a safe replay. Verify every stored field.
  }
  const receiptResponse = await client.get<{
    data: { financeInvestigationEvent?: Partial<StoredEvent> };
  }>(`/rest/financeInvestigationEvents/${input.eventId}`);
  const receipt = receiptResponse.data.financeInvestigationEvent;
  if (!receipt || !isStoredEvent(receipt) ||
      Object.entries(event).some(([key, value]) => receipt[key as keyof StoredEvent] !== value))
    throw new Error('Finance investigation event receipt mismatch');
  return Object.freeze({ ...receipt });
};
