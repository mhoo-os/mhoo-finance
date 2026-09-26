import { RestApiClient, RestApiClientError } from 'twenty-client-sdk/rest';

export type WorkspaceEvidenceAction = 'LINKED' | 'UNLINKED' | 'RESTORED';

export type WorkspaceEvidenceDecision = Readonly<{
  id: string;
  decisionKey: string;
  entryReference: string;
  evidenceReference: string;
  sourceTypes: string;
  linkStatus: 'LINKED' | 'UNLINKED';
  reasonCode: string;
  decisionHistory: string;
  preservesOriginals: true;
  createdAt: string;
}>;

type NativeDecisionRow = Partial<WorkspaceEvidenceDecision> & {
  id?: unknown;
  createdAt?: unknown;
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const assertRelationship = (
  entryReference: string,
  evidenceReference: string,
) => {
  if (!UUID.test(entryReference) || !UUID.test(evidenceReference)) {
    throw new Error('Invalid evidence relationship identity');
  }
};

const isDecision = (
  row: NativeDecisionRow,
  entryReference: string,
  evidenceReference: string,
): row is WorkspaceEvidenceDecision =>
  typeof row.id === 'string' &&
  typeof row.createdAt === 'string' &&
  row.entryReference === entryReference &&
  row.evidenceReference === evidenceReference &&
  (row.linkStatus === 'LINKED' || row.linkStatus === 'UNLINKED') &&
  row.preservesOriginals === true;

export const readWorkspaceEvidenceHistory = async (
  entryReference: string,
  evidenceReference: string,
  client = new RestApiClient({ runAs: 'user' }),
): Promise<readonly WorkspaceEvidenceDecision[]> => {
  assertRelationship(entryReference, evidenceReference);
  const response = await client.get<{
    data: { financeEvidenceLinkDecisions?: NativeDecisionRow[] };
  }>('/rest/financeEvidenceLinkDecisions', {
    query: {
      filter: `entryReference[eq]:${entryReference},evidenceReference[eq]:${evidenceReference}`,
      limit: 101,
      depth: 0,
      order_by: 'createdAt[AscNullsLast]',
    },
  });
  const rows = response.data.financeEvidenceLinkDecisions ?? [];
  if (rows.length > 100)
    throw new Error('Evidence history reached its read bound');
  return Object.freeze(
    rows
      .filter((row) => isDecision(row, entryReference, evidenceReference))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  );
};

export const appendWorkspaceEvidenceDecision = async (
  input: Readonly<{
    entryReference: string;
    evidenceReference: string;
    sourceTypes: string;
    action: WorkspaceEvidenceAction;
    reasonCode: string;
    at: string;
    eventId?: string;
  }>,
  client = new RestApiClient({ runAs: 'user' }),
): Promise<readonly WorkspaceEvidenceDecision[]> => {
  const id = input.eventId ?? crypto.randomUUID();
  assertRelationship(input.entryReference, input.evidenceReference);
  if (!UUID.test(id)) throw new Error('Invalid evidence event identity');
  const linkStatus = input.action === 'UNLINKED' ? 'UNLINKED' : 'LINKED';
  const event = {
    id,
    decisionKey: id,
    entryReference: input.entryReference,
    evidenceReference: input.evidenceReference,
    sourceTypes: input.sourceTypes,
    linkStatus,
    reasonCode: input.reasonCode,
    decisionHistory: JSON.stringify({ at: input.at, action: input.action }),
    preservesOriginals: true,
  } as const;
  const before = await readWorkspaceEvidenceHistory(
    input.entryReference,
    input.evidenceReference,
    client,
  );
  if (before.length >= 100) {
    throw new Error('Evidence history reached its write bound');
  }
  try {
    await client.post('/rest/financeEvidenceLinkDecisions', event);
  } catch {
    // A lost response or replay may have stored the immutable event. Verify below.
  }
  const response = await client.get<{
    data: { financeEvidenceLinkDecision?: NativeDecisionRow };
  }>(`/rest/financeEvidenceLinkDecisions/${id}`);
  const stored = response.data.financeEvidenceLinkDecision;
  if (
    !stored ||
    !isDecision(stored, input.entryReference, input.evidenceReference) ||
    stored.decisionKey !== event.decisionKey ||
    stored.sourceTypes !== event.sourceTypes ||
    stored.linkStatus !== event.linkStatus ||
    stored.reasonCode !== event.reasonCode ||
    stored.decisionHistory !== event.decisionHistory
  ) {
    throw new Error('Evidence decision receipt mismatch');
  }
  return Object.freeze(
    [...before, stored].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    ),
  );
};

export const evidenceDecisionFailure = (error: unknown): 'denied' | 'failed' =>
  error instanceof RestApiClientError &&
  (error.status === 401 || error.status === 403)
    ? 'denied'
    : 'failed';
