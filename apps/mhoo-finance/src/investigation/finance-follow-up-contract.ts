export type FinanceFollowUpState =
  'TO_DO' | 'WAITING_FOR_REPLY' | 'READY_FOR_REVIEW' | 'RESOLVED';

export type FinanceEmailApproval =
  'DRAFT' | 'AWAITING_APPROVAL' | 'APPROVED_NOT_SENT' | 'SENT';

export type FinanceQuestionRoute =
  'UNCHANGED' | 'NEUTRALIZED_MISCONDUCT' | 'QUALIFIED_PROFESSIONAL_REQUIRED';

export type FinanceFollowUpSubject = Readonly<{
  kind: 'TRANSACTION' | 'MISSING_STATEMENT_PERIOD';
  reference: string;
  label: string;
}>;

export type FinanceFollowUpPerson = Readonly<{
  personId: string;
  name: string;
  role: string;
  selectedRecipient: boolean;
}>;

export type FinanceFollowUpEvidence = Readonly<{
  kind: 'EXPLANATION' | 'UPLOAD' | 'EMAIL' | 'DOCUMENT' | 'TRANSACTION';
  reference: string;
  label: string;
  attribution: string;
  reviewerAccepted: boolean;
}>;

export type FinanceDraftEmail = Readonly<{
  mailboxLabel: string;
  subject: string;
  body: string;
  recipientPersonIds: readonly string[];
  attachmentReferences: readonly string[];
}>;

export const hasExactSelectedRecipients = (
  draft: FinanceDraftEmail,
  people: readonly FinanceFollowUpPerson[],
): boolean =>
  draft.recipientPersonIds.length > 0 &&
  draft.recipientPersonIds.every((personId) =>
    people.some(
      (person) =>
        person.personId === personId && person.selectedRecipient === true,
    ),
  );

export type FinanceProvenanceEvent = Readonly<{
  at: string;
  action: string;
  from?: FinanceFollowUpState;
  to?: FinanceFollowUpState;
}>;

const STATES = new Set<FinanceFollowUpState>([
  'TO_DO',
  'WAITING_FOR_REPLY',
  'READY_FOR_REVIEW',
  'RESOLVED',
]);
const EMAIL_APPROVALS = new Set<FinanceEmailApproval>([
  'DRAFT',
  'AWAITING_APPROVAL',
  'APPROVED_NOT_SENT',
  'SENT',
]);
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MISCONDUCT_CONCLUSION =
  /\b(?:brib\w*|conceal\w*|corrupt\w*|falsif\w*|fraud|fraudulent|misappropriat\w*|theft|thief|steal|stole|stolen|embezzl\w*|guilt\w*)\b/i;
const PROFESSIONAL_CONCLUSION =
  /\b(?:audit(?:ed|ing)?|clean opinion|agreed-upon procedures?|AUP|deductib\w*|deduction|taxable|tax opinion|tax treatment|legal conclusion)\b/i;

const parseArray = (value: string | null): unknown[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length <= 100 ? parsed : [];
  } catch {
    return [];
  }
};

export const routeFinanceInvestigationQuestion = (
  value: string | null | undefined,
): Readonly<{ question: string; route: FinanceQuestionRoute }> => {
  const question = value?.trim() || 'Untitled Finance follow-up';
  if (MISCONDUCT_CONCLUSION.test(question)) {
    return Object.freeze({
      question:
        'Which scoped movements lack corroborating business purpose or documented treatment?',
      route: 'NEUTRALIZED_MISCONDUCT',
    });
  }
  if (PROFESSIONAL_CONCLUSION.test(question)) {
    return Object.freeze({
      question:
        'Which scoped records, procedures and gaps require qualified professional review?',
      route: 'QUALIFIED_PROFESSIONAL_REQUIRED',
    });
  }
  return Object.freeze({ question, route: 'UNCHANGED' });
};

export const parseFinanceFollowUpState = (
  value: string | null | undefined,
): FinanceFollowUpState | null =>
  value && STATES.has(value as FinanceFollowUpState)
    ? (value as FinanceFollowUpState)
    : null;

export const parseFinanceEmailApproval = (
  value: string | null | undefined,
): FinanceEmailApproval | null =>
  value && EMAIL_APPROVALS.has(value as FinanceEmailApproval)
    ? (value as FinanceEmailApproval)
    : null;

export const parseFinanceSubjects = (
  value: string | null,
): readonly FinanceFollowUpSubject[] =>
  Object.freeze(
    parseArray(value).flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      if (
        (row.kind !== 'TRANSACTION' &&
          row.kind !== 'MISSING_STATEMENT_PERIOD') ||
        typeof row.reference !== 'string' ||
        !row.reference ||
        typeof row.label !== 'string' ||
        !row.label
      ) {
        return [];
      }
      return [
        {
          kind: row.kind,
          reference: row.reference,
          label: row.label,
        } as FinanceFollowUpSubject,
      ];
    }),
  );

export const parseFinancePeople = (
  value: string | null,
): readonly FinanceFollowUpPerson[] =>
  Object.freeze(
    parseArray(value).flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      if (
        typeof row.personId !== 'string' ||
        !UUID.test(row.personId) ||
        typeof row.name !== 'string' ||
        !row.name ||
        typeof row.role !== 'string' ||
        !row.role ||
        typeof row.selectedRecipient !== 'boolean'
      ) {
        return [];
      }
      return [
        {
          personId: row.personId,
          name: row.name,
          role: row.role,
          selectedRecipient: row.selectedRecipient,
        },
      ];
    }),
  );

export const parseFinanceEvidence = (
  value: string | null,
): readonly FinanceFollowUpEvidence[] => {
  const kinds = new Set<FinanceFollowUpEvidence['kind']>([
    'EXPLANATION',
    'UPLOAD',
    'EMAIL',
    'DOCUMENT',
    'TRANSACTION',
  ]);
  return Object.freeze(
    parseArray(value).flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      if (
        !kinds.has(row.kind as FinanceFollowUpEvidence['kind']) ||
        typeof row.reference !== 'string' ||
        !row.reference ||
        typeof row.label !== 'string' ||
        !row.label ||
        typeof row.attribution !== 'string' ||
        !row.attribution ||
        typeof row.reviewerAccepted !== 'boolean'
      ) {
        return [];
      }
      return [
        {
          kind: row.kind as FinanceFollowUpEvidence['kind'],
          reference: row.reference,
          label: row.label,
          attribution: row.attribution,
          reviewerAccepted: row.reviewerAccepted,
        },
      ];
    }),
  );
};

export const parseFinanceDraftEmail = (
  value: string | null,
): FinanceDraftEmail | null => {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    const row = parsed as Record<string, unknown>;
    if (
      typeof row.mailboxLabel !== 'string' ||
      !row.mailboxLabel ||
      typeof row.subject !== 'string' ||
      !row.subject ||
      typeof row.body !== 'string' ||
      !row.body ||
      !Array.isArray(row.recipientPersonIds) ||
      !row.recipientPersonIds.length ||
      row.recipientPersonIds.length > 20 ||
      !row.recipientPersonIds.every(
        (personId) => typeof personId === 'string' && UUID.test(personId),
      ) ||
      !Array.isArray(row.attachmentReferences) ||
      row.attachmentReferences.length > 20 ||
      !row.attachmentReferences.every(
        (reference) => typeof reference === 'string' && reference.length > 0,
      )
    ) {
      return null;
    }
    return Object.freeze({
      mailboxLabel: row.mailboxLabel,
      subject: row.subject,
      body: row.body,
      recipientPersonIds: Object.freeze([...row.recipientPersonIds]),
      attachmentReferences: Object.freeze([...row.attachmentReferences]),
    }) as FinanceDraftEmail;
  } catch {
    return null;
  }
};

export const parseFinanceProvenance = (
  value: string | null,
): readonly FinanceProvenanceEvent[] =>
  Object.freeze(
    parseArray(value).flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const row = item as Record<string, unknown>;
      if (
        typeof row.at !== 'string' ||
        Number.isNaN(Date.parse(row.at)) ||
        typeof row.action !== 'string' ||
        !row.action ||
        (row.from !== undefined &&
          !STATES.has(row.from as FinanceFollowUpState)) ||
        (row.to !== undefined && !STATES.has(row.to as FinanceFollowUpState))
      ) {
        return [];
      }
      return [
        {
          at: row.at,
          action: row.action,
          ...(row.from ? { from: row.from as FinanceFollowUpState } : {}),
          ...(row.to ? { to: row.to as FinanceFollowUpState } : {}),
        },
      ];
    }),
  );

export const financeFollowUpStateLabel = (state: FinanceFollowUpState) =>
  ({
    TO_DO: 'To do',
    WAITING_FOR_REPLY: 'Waiting for reply',
    READY_FOR_REVIEW: 'Ready for review',
    RESOLVED: 'Resolved',
  })[state];

export const financeFollowUpNextAction = (state: FinanceFollowUpState) =>
  ({
    TO_DO: 'Gather the minimum relevant evidence',
    WAITING_FOR_REPLY: 'Review any attributed reply or attachment',
    READY_FOR_REVIEW: 'Accept evidence or request more information',
    RESOLVED: 'No next action unless the review is reopened',
  })[state];

export const financeNativeTaskStatus = (
  state: FinanceFollowUpState,
): 'TODO' | 'IN_PROGRESS' | 'DONE' =>
  state === 'TO_DO' ? 'TODO' : state === 'RESOLVED' ? 'DONE' : 'IN_PROGRESS';

export const financeFollowUpResolutionEffect = () =>
  'NO_RECONCILIATION_EFFECT' as const;

export const isFinanceFollowUpTransitionAllowed = (
  from: FinanceFollowUpState,
  to: FinanceFollowUpState,
) =>
  ({
    TO_DO: new Set<FinanceFollowUpState>([
      'WAITING_FOR_REPLY',
      'READY_FOR_REVIEW',
    ]),
    WAITING_FOR_REPLY: new Set<FinanceFollowUpState>([
      'READY_FOR_REVIEW',
      'TO_DO',
    ]),
    READY_FOR_REVIEW: new Set<FinanceFollowUpState>([
      'WAITING_FOR_REPLY',
      'RESOLVED',
    ]),
    RESOLVED: new Set<FinanceFollowUpState>(['READY_FOR_REVIEW']),
  })[from].has(to);
