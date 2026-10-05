import { RestApiClient } from 'twenty-client-sdk/rest';
import {
  parseFinanceDraftEmail,
  parseFinanceEvidence,
  parseFinancePeople,
  routeFinanceInvestigationQuestion,
  type FinanceDraftEmail,
  type FinanceFollowUpEvidence,
  type FinanceFollowUpState,
} from './finance-follow-up-contract';
import {
  appendProvenance,
  assertFreshTask,
  mutationFilter,
  readTaskReceipt,
} from './workspace-finance-follow-ups';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const identity = (value: string) => {
  if (!UUID.test(value)) throw new Error('Invalid native record identity');
  return value;
};
const text = (value: string, max = 4000) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error('Enter bounded, nonempty text');
  return value.trim();
};
const boundedJson = (value: unknown) => {
  const json = JSON.stringify(value);
  if (json.length > 32000)
    throw new Error('Follow-up content reached its size bound');
  return json;
};
const exactArray = <T>(
  raw: unknown,
  parse: (value: string | null) => readonly T[],
) => {
  if (raw == null) return [];
  if (typeof raw !== 'string')
    throw new Error('Invalid stored follow-up context');
  let items: unknown;
  try {
    items = JSON.parse(raw);
  } catch {
    throw new Error('Invalid stored follow-up context');
  }
  const parsed = parse(raw);
  if (
    !Array.isArray(items) ||
    items.length !== parsed.length ||
    items.length > 100
  )
    throw new Error('Invalid or full stored follow-up context');
  return [...parsed];
};
export type FollowUpVersion = Readonly<{
  taskId: string;
  from: FinanceFollowUpState;
  expectedUpdatedAt: string;
  expectedRevision: number;
  operationId: string;
}>;
const readRecord = async (
  plural: string,
  singular: string,
  id: string,
  client: RestApiClient,
) => {
  const result = await client.get<{
    data: Record<string, Record<string, unknown>>;
  }>(`/rest/${plural}/${identity(id)}`, { query: { depth: 0 } });
  const record = result.data[singular];
  if (!record || record.id !== id)
    throw new Error('Native source receipt unavailable');
  return record;
};

// Writes use the caller's existing native permissions. No app identity, custom
// permission flags, provider access or implicit grants. Native Task audit fields
// retain the host actor; client-entered explanations are explicitly assertions.
const changeTask = async (
  input: FollowUpVersion,
  action: string,
  prepare: (
    before: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>,
  client: RestApiClient,
) => {
  identity(input.taskId);
  identity(input.operationId);
  const filter = mutationFilter(input);
  const before = await readTaskReceipt(input.taskId, client);
  assertFreshTask(before, input);
  if (input.from === 'RESOLVED')
    throw new Error(
      'Reopen the follow-up before changing its evidence or request',
    );
  const changes = await prepare(before);
  const expected = {
    ...changes,
    financeRevision: input.expectedRevision + 1,
    financeLastOperationId: input.operationId,
    financeProvenanceHistory: appendProvenance(
      before.financeProvenanceHistory,
      {
        at: new Date().toISOString(),
        action,
      },
    ),
  };
  boundedJson(expected);
  await client.patch('/rest/tasks', expected, { query: { filter } });
  const receipt = await readTaskReceipt(input.taskId, client);
  if (
    receipt.id !== input.taskId ||
    receipt.financeScope !== 'MHOO_FINANCE_V1' ||
    Object.entries(expected).some(
      ([key, value]) => (receipt as Record<string, unknown>)[key] !== value,
    )
  )
    throw new Error(
      'Follow-up write could not be verified. Reload before retrying.',
    );
  return receipt;
};

export class FollowUpCreationUncertainError extends Error {}

export const listFollowUpNativeChoices = async (
  kind: 'people' | 'notes',
  client = new RestApiClient({ runAs: 'user' }),
) => {
  const result = await client.get<{
    data: Record<string, Record<string, unknown>[]>;
  }>(`/rest/${kind}`, { query: { limit: 50, depth: 0 } });
  const rows = result.data[kind];
  if (!Array.isArray(rows) || rows.length > 50)
    throw new Error('Native choices unavailable');
  return rows.flatMap((row) => {
    if (typeof row.id !== 'string' || !UUID.test(row.id)) return [];
    const name = row.name as
      { firstName?: string; lastName?: string } | undefined;
    const label =
      kind === 'people'
        ? [name?.firstName, name?.lastName].filter(Boolean).join(' ')
        : row.title;
    return typeof label === 'string' && label.trim()
      ? [{ id: row.id, label: label.slice(0, 500) }]
      : [];
  });
};

export const createWorkspaceFollowUp = async (
  input: { taskId: string; title: string; factId: string },
  client = new RestApiClient({ runAs: 'user' }),
) => {
  identity(input.taskId);
  const title = text(input.title, 500);
  if (routeFinanceInvestigationQuestion(title).route !== 'UNCHANGED')
    throw new Error(
      'Use a neutral evidence question; professional conclusions require review',
    );
  const fact = await readRecord(
    'financeFacts',
    'financeFact',
    input.factId,
    client,
  );
  if (fact.status !== 'ACTIVE')
    throw new Error('Select an active authorized transaction');
  const expected = {
    id: input.taskId,
    title,
    status: 'TODO',
    financeScope: 'MHOO_FINANCE_V1',
    financeFollowUpState: 'TO_DO',
    financeRevision: 0,
    financeLastOperationId: input.taskId,
    financeCorrelationKey: `MHOO_FINANCE_V1:${input.taskId}`,
    financeSubjectReferences: boundedJson([
      {
        kind: 'TRANSACTION',
        reference: input.factId,
        label: 'Source transaction',
      },
    ]),
    financePeopleContext: '[]',
    financeEvidenceReferences: '[]',
    financeEmailApproval: 'DRAFT',
    financeProvenanceHistory: '[]',
  };
  // A caller-selected UUID makes retry recoverable without creating duplicates.
  // On an ambiguous POST outcome, verify this same ID; never invent a retry ID.
  try {
    await client.post('/rest/tasks', expected);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'status' in error &&
      (error.status === 401 || error.status === 403)
    )
      throw error;
  }
  try {
    const receipt = await readTaskReceipt(input.taskId, client);
    if (
      Object.entries(expected).some(
        ([key, value]) => (receipt as Record<string, unknown>)[key] !== value,
      )
    )
      throw new Error('Task receipt mismatch');
    return receipt;
  } catch {
    throw new FollowUpCreationUncertainError(
      'Task creation could not be verified. Retry the same request or reload before starting another.',
    );
  }
};

export const addWorkspaceFollowUpPerson = async (
  input: FollowUpVersion & { personId: string; role: string },
  client = new RestApiClient({ runAs: 'user' }),
) =>
  changeTask(
    input,
    'PERSON_SELECTED',
    async (before) => {
      const person = await readRecord(
        'people',
        'person',
        input.personId,
        client,
      );
      const name = person.name as
        { firstName?: string; lastName?: string } | undefined;
      const people = exactArray(
        before.financePeopleContext,
        parseFinancePeople,
      );
      if (people.some((p) => p.personId === input.personId))
        throw new Error('Person already selected');
      if (people.length >= 100)
        throw new Error('People reached their write bound');
      people.push({
        personId: input.personId,
        name: text(
          [name?.firstName, name?.lastName].filter(Boolean).join(' '),
          500,
        ),
        role: text(input.role, 200),
        selectedRecipient: true,
      });
      return {
        financePeopleContext: boundedJson(people),
        financeEmailApproval: 'DRAFT',
      };
    },
    client,
  );

export const submitWorkspaceFollowUpEvidence = async (
  input: FollowUpVersion &
    (
      | { kind: 'EXPLANATION'; explanation: string }
      | { kind: 'DOCUMENT'; artifactId: string }
      | {
          kind: 'REPLY';
          noteId: string;
          correlationKey: string;
          shareReference: boolean;
        }
    ),
  client = new RestApiClient({ runAs: 'user' }),
) =>
  changeTask(
    input,
    'EVIDENCE_SUBMITTED_FOR_REVIEW',
    async (before) => {
      const evidence = exactArray(
        before.financeEvidenceReferences,
        parseFinanceEvidence,
      );
      let item: FinanceFollowUpEvidence;
      if (input.kind === 'EXPLANATION') {
        item = {
          kind: 'EXPLANATION',
          reference: input.operationId,
          label: text(input.explanation),
          attribution: 'User-submitted explanation; unverified assertion',
          reviewerAccepted: false,
        };
      } else if (input.kind === 'DOCUMENT') {
        const artifact = await readRecord(
          'sourceArtifacts',
          'sourceArtifact',
          input.artifactId,
          client,
        );
        if (
          typeof artifact.contentHash !== 'string' ||
          !/^(sha256:)?[a-f0-9]{64}$/i.test(artifact.contentHash) ||
          !['IMPORTED', 'PARTIAL', 'IMPORTED_WITH_REJECTIONS'].includes(
            String(artifact.status),
          )
        )
          throw new Error('Retained source hash/status unavailable');
        item = {
          kind: 'DOCUMENT',
          reference: input.artifactId,
          label: 'Retained source artifact',
          attribution: `Source artifact ${input.artifactId}; ${artifact.contentHash}; ${artifact.status}`,
          reviewerAccepted: false,
        };
      } else {
        if (
          !input.shareReference ||
          input.correlationKey !== before.financeCorrelationKey ||
          input.correlationKey !== `MHOO_FINANCE_V1:${input.taskId}`
        )
          throw new Error(
            'Reply correlation requires this exact Task key and explicit reference sharing',
          );
        await readRecord('notes', 'note', input.noteId, client);
        item = {
          kind: 'EMAIL',
          reference: input.noteId,
          label: 'Manually linked reply note',
          attribution: `User-proposed reply link; ${input.correlationKey}; native note content not copied; mailbox origin unverified`,
          reviewerAccepted: false,
        };
      }
      if (
        evidence.some(
          (e) => e.kind === item.kind && e.reference === item.reference,
        )
      )
        throw new Error('Evidence already submitted');
      if (evidence.length >= 100)
        throw new Error('Evidence reached its write bound');
      evidence.push(item);
      return { financeEvidenceReferences: boundedJson(evidence) };
    },
    client,
  );

export const saveWorkspaceFollowUpDraft = async (
  input: FollowUpVersion & { draft: FinanceDraftEmail },
  client = new RestApiClient({ runAs: 'user' }),
) =>
  changeTask(
    input,
    'EXACT_REQUEST_DRAFT_SAVED',
    async (before) => {
      const draft = parseFinanceDraftEmail(boundedJson(input.draft));
      const people = exactArray(
        before.financePeopleContext,
        parseFinancePeople,
      );
      const evidence = exactArray(
        before.financeEvidenceReferences,
        parseFinanceEvidence,
      );
      if (
        !draft ||
        new Set(draft.recipientPersonIds).size !==
          draft.recipientPersonIds.length ||
        !draft.recipientPersonIds.every((id) =>
          people.some((p) => p.personId === id && p.selectedRecipient),
        ) ||
        !draft.attachmentReferences.every((id) =>
          evidence.some((e) => e.kind === 'DOCUMENT' && e.reference === id),
        )
      )
        throw new Error(
          'Draft requires selected People and attached retained evidence',
        );
      // Recheck the native source permissions at save time; storing a reference does
      // not authorize delivery of its content or access by any recipient.
      for (const id of draft.recipientPersonIds)
        await readRecord('people', 'person', id, client);
      for (const id of draft.attachmentReferences)
        await readRecord('sourceArtifacts', 'sourceArtifact', id, client);
      return {
        financeDraftEmail: boundedJson(draft),
        financeEmailApproval: 'AWAITING_APPROVAL',
      };
    },
    client,
  );

export const acceptWorkspaceFollowUpEvidence = async (
  input: FollowUpVersion & {
    reference: string;
    kind: FinanceFollowUpEvidence['kind'];
  },
  client = new RestApiClient({ runAs: 'user' }),
) =>
  changeTask(
    input,
    'EVIDENCE_REVIEWED_NO_RECONCILIATION_EFFECT',
    async (before) => {
      const evidence = exactArray(
        before.financeEvidenceReferences,
        parseFinanceEvidence,
      );
      if (
        !evidence.some(
          (e) =>
            e.kind === input.kind &&
            e.reference === input.reference &&
            !e.reviewerAccepted,
        )
      )
        throw new Error('Unreviewed evidence reference unavailable');
      return {
        financeEvidenceReferences: boundedJson(
          evidence.map((e) =>
            e.kind === input.kind && e.reference === input.reference
              ? { ...e, reviewerAccepted: true }
              : e,
          ),
        ),
      };
    },
    client,
  );
