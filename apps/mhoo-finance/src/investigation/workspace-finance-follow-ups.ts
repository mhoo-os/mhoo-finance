import { RestApiClient, RestApiClientError } from 'twenty-client-sdk/rest';

import {
  financeNativeTaskStatus,
  hasExactSelectedRecipients,
  isFinanceFollowUpTransitionAllowed,
  parseFinanceProvenance,
  parseFinanceDraftEmail,
  parseFinancePeople,
  type FinanceDraftEmail,
  type FinanceFollowUpState,
  type FinanceFollowUpPerson,
} from './finance-follow-up-contract';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type NativeTaskReceipt = Readonly<{
  id?: unknown;
  financeScope?: unknown;
  financeDraftEmail?: unknown;
  financePeopleContext?: unknown;
  status?: unknown;
  financeFollowUpState?: unknown;
  financeEmailApproval?: unknown;
  financeProvenanceHistory?: unknown;
  updatedAt?: unknown;
  financeRevision?: unknown;
  financeLastOperationId?: unknown;
}>;

const FINANCE_SCOPE = 'MHOO_FINANCE_V1';

// This is an additional row bound, never a grant. Twenty still authorizes the
// caller through the native REST route. No application-identity fallback.
export const mutationFilter = (
  input: Readonly<{
    taskId: string;
    expectedRevision: number;
    expectedUpdatedAt: string;
  }>,
) => {
  if (
    !Number.isSafeInteger(input.expectedRevision) ||
    input.expectedRevision < 0 ||
    input.expectedRevision >= Number.MAX_SAFE_INTEGER
  ) {
    throw new Error('Invalid Finance revision');
  }
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
      input.expectedUpdatedAt,
    ) ||
    !Number.isFinite(Date.parse(input.expectedUpdatedAt)) ||
    new Date(input.expectedUpdatedAt).toISOString() !== input.expectedUpdatedAt
  ) {
    throw new Error('Invalid Finance freshness timestamp');
  }
  return `and(id[eq]:${input.taskId},financeScope[eq]:${FINANCE_SCOPE},financeRevision[eq]:${input.expectedRevision},updatedAt[eq]:${input.expectedUpdatedAt})`;
};

const validatedProvenance = (value: string | null) => {
  if (!value) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    throw new Error('Invalid Finance provenance history');
  }
  if (!Array.isArray(raw) || raw.length > 100) {
    throw new Error('Invalid Finance provenance history');
  }
  const parsed = parseFinanceProvenance(value);
  if (parsed.length !== raw.length) {
    throw new Error('Invalid Finance provenance history');
  }
  return parsed;
};

export const readTaskReceipt = async (
  taskId: string,
  client: RestApiClient,
): Promise<NativeTaskReceipt> => {
  const response = await client.get<{ data: { task?: NativeTaskReceipt } }>(
    `/rest/tasks/${taskId}`,
  );
  return response.data.task ?? {};
};

export const assertFreshTask = (
  receipt: NativeTaskReceipt,
  input: Readonly<{
    taskId: string;
    expectedUpdatedAt: string;
    expectedRevision: number;
    from: FinanceFollowUpState;
  }>,
) => {
  if (receipt.financeScope !== FINANCE_SCOPE) {
    throw new Error('Task is outside the Finance scope');
  }
  if (!input.expectedUpdatedAt) {
    throw new Error('Finance follow-up freshness receipt is unavailable');
  }
  if (
    receipt.id !== input.taskId ||
    receipt.updatedAt !== input.expectedUpdatedAt ||
    receipt.financeRevision !== input.expectedRevision ||
    receipt.financeFollowUpState !== input.from
  ) {
    throw new Error('Finance follow-up changed since it was read');
  }
};

export const appendProvenance = (
  current: unknown,
  event: Readonly<Record<string, string>>,
) => {
  if (
    current !== null &&
    current !== undefined &&
    typeof current !== 'string'
  ) {
    throw new Error('Invalid Finance provenance history');
  }
  const provenance = validatedProvenance(current ?? null);
  if (provenance.length >= 100) {
    throw new Error('Finance provenance history reached its write bound');
  }
  return JSON.stringify([...provenance, event]);
};

export const updateWorkspaceFinanceFollowUpState = async (
  input: Readonly<{
    taskId: string;
    from: FinanceFollowUpState;
    to: FinanceFollowUpState;
    expectedUpdatedAt: string;
    expectedRevision: number;
    at: string;
    operationId?: string;
  }>,
  client = new RestApiClient({ runAs: 'user' }),
) => {
  if (!UUID.test(input.taskId)) throw new Error('Invalid native Task identity');
  if (!isFinanceFollowUpTransitionAllowed(input.from, input.to)) {
    throw new Error('Invalid Finance follow-up transition');
  }
  const filter = mutationFilter(input);
  const before = await readTaskReceipt(input.taskId, client);
  assertFreshTask(before, input);
  const operationId = input.operationId ?? crypto.randomUUID();
  if (!UUID.test(operationId))
    throw new Error('Invalid Finance operation identity');
  const expected = {
    financeFollowUpState: input.to,
    status: financeNativeTaskStatus(input.to),
    financeProvenanceHistory: appendProvenance(
      before.financeProvenanceHistory,
      {
        at: input.at,
        action: 'REVIEWER_STATE_CHANGED',
        from: input.from,
        to: input.to,
      },
    ),
    financeRevision: input.expectedRevision + 1,
    financeLastOperationId: operationId,
  } as const;
  await client.patch('/rest/tasks', expected, {
    query: {
      filter,
    },
  });
  const receipt = await readTaskReceipt(input.taskId, client);
  if (
    receipt.id !== input.taskId ||
    receipt.financeScope !== FINANCE_SCOPE ||
    receipt.financeFollowUpState !== expected.financeFollowUpState ||
    receipt.status !== expected.status ||
    receipt.financeProvenanceHistory !== expected.financeProvenanceHistory ||
    receipt.financeRevision !== expected.financeRevision ||
    receipt.financeLastOperationId !== operationId
  ) {
    throw new Error('Finance follow-up state receipt mismatch');
  }
  return expected;
};

export const approveWorkspaceFinanceDraft = async (
  input: Readonly<{
    taskId: string;
    from: 'AWAITING_APPROVAL';
    financeState: FinanceFollowUpState;
    expectedUpdatedAt: string;
    expectedRevision: number;
    draftEmail: FinanceDraftEmail;
    people: readonly FinanceFollowUpPerson[];
    at: string;
    operationId?: string;
  }>,
  client = new RestApiClient({ runAs: 'user' }),
) => {
  if (!UUID.test(input.taskId)) throw new Error('Invalid native Task identity');
  if (input.financeState === 'RESOLVED')
    throw new Error('Reopen the follow-up before approving its request');
  if (input.from !== 'AWAITING_APPROVAL') {
    throw new Error('Finance email draft is not awaiting approval');
  }
  if (!hasExactSelectedRecipients(input.draftEmail, input.people)) {
    throw new Error('Finance email draft has no valid selected recipients');
  }
  const filter = mutationFilter(input);
  const before = await readTaskReceipt(input.taskId, client);
  assertFreshTask(before, {
    taskId: input.taskId,
    expectedUpdatedAt: input.expectedUpdatedAt,
    expectedRevision: input.expectedRevision,
    from: input.financeState,
  });
  if (before.financeEmailApproval !== input.from) {
    throw new Error('Finance email approval changed since it was read');
  }
  const storedDraft =
    typeof before.financeDraftEmail === 'string'
      ? parseFinanceDraftEmail(before.financeDraftEmail)
      : null;
  const storedPeople =
    typeof before.financePeopleContext === 'string'
      ? parseFinancePeople(before.financePeopleContext)
      : [];
  if (
    !storedDraft ||
    JSON.stringify(storedDraft) !== JSON.stringify(input.draftEmail) ||
    !hasExactSelectedRecipients(storedDraft, storedPeople)
  ) {
    throw new Error(
      'Stored Finance draft or recipients changed; reload before approval',
    );
  }
  const operationId = input.operationId ?? crypto.randomUUID();
  if (!UUID.test(operationId))
    throw new Error('Invalid Finance operation identity');
  const expected = {
    financeEmailApproval: 'APPROVED_NOT_SENT',
    financeDraftEmail: JSON.stringify(storedDraft),
    financeProvenanceHistory: appendProvenance(
      before.financeProvenanceHistory,
      {
        at: input.at,
        action: 'EMAIL_DRAFT_APPROVED_NOT_SENT',
      },
    ),
    financeRevision: input.expectedRevision + 1,
    financeLastOperationId: operationId,
  } as const;
  await client.patch('/rest/tasks', expected, {
    query: {
      filter,
    },
  });
  const receipt = await readTaskReceipt(input.taskId, client);
  if (
    receipt.id !== input.taskId ||
    receipt.financeScope !== FINANCE_SCOPE ||
    receipt.financeDraftEmail !== expected.financeDraftEmail ||
    receipt.financeEmailApproval !== expected.financeEmailApproval ||
    receipt.financeProvenanceHistory !== expected.financeProvenanceHistory ||
    receipt.financeRevision !== expected.financeRevision ||
    receipt.financeLastOperationId !== operationId
  ) {
    throw new Error('Finance email approval receipt mismatch');
  }
  return expected;
};

export const financeFollowUpMutationFailure = (
  error: unknown,
): 'denied' | 'failed' =>
  error instanceof RestApiClientError &&
  (error.status === 401 || error.status === 403)
    ? 'denied'
    : 'failed';
