import { CoreApiClient } from 'twenty-client-sdk/core';

import { minor } from '../contracts/money';

import {
  parseFinanceDraftEmail,
  parseFinanceEmailApproval,
  parseFinanceEvidence,
  parseFinanceFollowUpState,
  parseFinancePeople,
  parseFinanceProvenance,
  parseFinanceSubjects,
  routeFinanceInvestigationQuestion,
  type FinanceDraftEmail,
  type FinanceEmailApproval,
  type FinanceFollowUpEvidence,
  type FinanceFollowUpPerson,
  type FinanceFollowUpState,
  type FinanceFollowUpSubject,
  type FinanceProvenanceEvent,
  type FinanceQuestionRoute,
} from './finance-follow-up-contract';

export type WorkspaceFinanceAccount = Readonly<{
  id: string;
  label: string;
  sourceKind: string;
}>;

export type WorkspaceFinanceFact = Readonly<{
  id: string;
  factKey: string;
  description: string;
  accountId: string | null;
  accountLabel: string;
  date: string;
  amountMinor: string | null;
  currency: string;
  direction: 'in' | 'out' | 'unknown';
  status: string;
  classification: string;
  includedInTotals: boolean;
  sourceLocation: string;
  artifactId: string | null;
  artifactKey: string | null;
}>;

export type WorkspaceStatement = Readonly<{
  id: string;
  artifactKey: string;
  accountKey: string;
  sourceKind: string;
  period: string;
  status: string;
  originalFileName: string;
  statementControls: string | null;
}>;

export type WorkspaceFinanceFollowUp = Readonly<{
  id: string;
  title: string;
  questionRoute: FinanceQuestionRoute;
  nativeStatus: string;
  state: FinanceFollowUpState;
  dueAt: string | null;
  ownerName: string;
  subjects: readonly FinanceFollowUpSubject[];
  people: readonly FinanceFollowUpPerson[];
  findings: string;
  evidence: readonly FinanceFollowUpEvidence[];
  draftEmail: FinanceDraftEmail | null;
  emailApproval: FinanceEmailApproval | null;
  correlationKey: string;
  provenance: readonly FinanceProvenanceEvent[];
  updatedAt: string;
  revision: number;
  contractWarning: boolean;
}>;

export type WorkspaceFinanceData = Readonly<{
  accounts: readonly WorkspaceFinanceAccount[];
  facts: readonly WorkspaceFinanceFact[];
  statements: readonly WorkspaceStatement[];
  followUps: readonly WorkspaceFinanceFollowUp[];
  truncated: boolean;
}>;

type QueryConnection<T> = Readonly<{
  pageInfo: Readonly<{ hasNextPage: boolean }>;
  edges: readonly Readonly<{ node: T }>[];
}>;

type AccountQueryNode = Readonly<{
  id: string;
  accountLabel?: string | null;
  sourceKind?: string | null;
}>;

type FactQueryNode = Readonly<{
  id: string;
  factKey?: string | null;
  description?: string | null;
  exactAmountMinor?: string | null;
  sourceCurrency?: string | null;
  transactionDate?: string | null;
  postedDate?: string | null;
  status?: string | null;
  classification?: string | null;
  includedInTotals?: boolean | null;
  sourceLocation?: string | null;
  financialAccount?: Readonly<{
    id: string;
    accountLabel?: string | null;
  }> | null;
  artifact?: Readonly<{ id: string; artifactKey?: string | null }> | null;
}>;

type StatementQueryNode = Readonly<{
  id: string;
  artifactKey?: string | null;
  accountKey?: string | null;
  sourceKind?: string | null;
  period?: string | null;
  status?: string | null;
  originalFileName?: string | null;
  statementControls?: string | null;
}>;

type FollowUpQueryNode = Readonly<{
  id: string;
  title?: string | null;
  status?: string | null;
  dueAt?: string | null;
  updatedAt?: string | null;
  assignee?: Readonly<{
    name?: Readonly<{
      firstName?: string | null;
      lastName?: string | null;
    }> | null;
  }> | null;
  financeFollowUpState?: unknown;
  financeSubjectReferences?: unknown;
  financePeopleContext?: unknown;
  financeFindings?: unknown;
  financeEvidenceReferences?: unknown;
  financeDraftEmail?: unknown;
  financeEmailApproval?: unknown;
  financeScope?: unknown;
  financeCorrelationKey?: unknown;
  financeProvenanceHistory?: unknown;
  financeRevision?: unknown;
}>;

type WorkspaceFinanceQueryResult = Readonly<{
  financialAccounts?: QueryConnection<AccountQueryNode>;
  financeFacts?: QueryConnection<FactQueryNode>;
  sourceArtifacts?: QueryConnection<StatementQueryNode>;
  tasks?: QueryConnection<FollowUpQueryNode>;
}>;

const EXACT_MINOR = /^-?(0|[1-9]\d*)$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const optionalString = (value: unknown) =>
  typeof value === 'string' ? value : null;

const hasInvalidStructuredArray = (
  rawValue: string | null,
  acceptedLength: number,
) => {
  if (!rawValue) return false;
  try {
    const parsed: unknown = JSON.parse(rawValue);
    return !Array.isArray(parsed) || parsed.length !== acceptedLength;
  } catch {
    return true;
  }
};

export const normalizeWorkspaceAmount = (
  amountMinor: string | null | undefined,
): Pick<WorkspaceFinanceFact, 'amountMinor' | 'direction'> => {
  if (!amountMinor || !EXACT_MINOR.test(amountMinor)) {
    return { amountMinor: null, direction: 'unknown' };
  }
  let value: bigint;
  try {
    value = minor(amountMinor);
  } catch {
    return { amountMinor: null, direction: 'unknown' };
  }
  return {
    amountMinor: (value < 0n ? -value : value).toString(),
    direction: value > 0n ? 'in' : value < 0n ? 'out' : 'unknown',
  };
};

export const readWorkspaceFinance = async (
  client = new CoreApiClient(),
): Promise<WorkspaceFinanceData> => {
  const result = (await client.query({
    financialAccounts: {
      __args: { first: 200 },
      pageInfo: { hasNextPage: true },
      edges: {
        node: {
          id: true,
          accountLabel: true,
          sourceKind: true,
        },
      },
    },
    financeFacts: {
      __args: { first: 500 },
      pageInfo: { hasNextPage: true },
      edges: {
        node: {
          id: true,
          factKey: true,
          description: true,
          exactAmountMinor: true,
          sourceCurrency: true,
          transactionDate: true,
          postedDate: true,
          status: true,
          classification: true,
          includedInTotals: true,
          sourceLocation: true,
          financialAccount: {
            id: true,
            accountLabel: true,
          },
          artifact: {
            id: true,
            artifactKey: true,
          },
        },
      },
    },
    sourceArtifacts: {
      __args: { first: 300 },
      pageInfo: { hasNextPage: true },
      edges: {
        node: {
          id: true,
          artifactKey: true,
          accountKey: true,
          sourceKind: true,
          period: true,
          status: true,
          originalFileName: true,
          statementControls: true,
        },
      },
    },
    tasks: {
      __args: { first: 200 },
      pageInfo: { hasNextPage: true },
      edges: {
        node: {
          id: true,
          title: true,
          status: true,
          dueAt: true,
          updatedAt: true,
          assignee: {
            name: {
              firstName: true,
              lastName: true,
            },
          },
          financeFollowUpState: true,
          financeSubjectReferences: true,
          financePeopleContext: true,
          financeFindings: true,
          financeEvidenceReferences: true,
          financeDraftEmail: true,
          financeEmailApproval: true,
          financeScope: true,
          financeCorrelationKey: true,
          financeProvenanceHistory: true,
          financeRevision: true,
        },
      },
    },
  })) as unknown as WorkspaceFinanceQueryResult;

  const accounts = (result.financialAccounts?.edges ?? []).map(({ node }) => ({
    id: node.id,
    label: node.accountLabel ?? 'Unnamed account',
    sourceKind: node.sourceKind ?? 'UNKNOWN',
  }));
  const facts = (result.financeFacts?.edges ?? []).map(({ node }) => {
    const normalized = normalizeWorkspaceAmount(node.exactAmountMinor);
    const transactionDate = node.transactionDate ?? '';
    const date = ISO_DATE.test(transactionDate)
      ? transactionDate
      : ISO_DATE.test(node.postedDate ?? '')
        ? (node.postedDate ?? '')
        : '';
    return {
      id: node.id,
      factKey: node.factKey ?? node.id,
      description: node.description ?? 'No description',
      accountId: node.financialAccount?.id ?? null,
      accountLabel: node.financialAccount?.accountLabel ?? 'Unlinked account',
      date,
      ...normalized,
      currency: node.sourceCurrency ?? '',
      status: node.status ?? 'UNKNOWN',
      classification: node.classification ?? 'UNCLASSIFIED',
      includedInTotals: node.includedInTotals ?? false,
      sourceLocation: node.sourceLocation ?? '',
      artifactId: node.artifact?.id ?? null,
      artifactKey: node.artifact?.artifactKey ?? null,
    };
  });
  const statements = (result.sourceArtifacts?.edges ?? []).map(({ node }) => ({
    id: node.id,
    artifactKey: node.artifactKey ?? node.id,
    accountKey: node.accountKey ?? 'Unlinked account',
    sourceKind: node.sourceKind ?? 'UNKNOWN',
    period: node.period ?? 'Unknown period',
    status: node.status ?? 'UNKNOWN',
    originalFileName: node.originalFileName ?? 'Original file unavailable',
    statementControls: node.statementControls ?? null,
  }));
  const followUps = (result.tasks?.edges ?? []).flatMap(({ node }) => {
    if (node.financeScope !== 'MHOO_FINANCE_V1') return [];
    const rawState = optionalString(node.financeFollowUpState);
    const rawSubjects = optionalString(node.financeSubjectReferences);
    const rawPeople = optionalString(node.financePeopleContext);
    const rawEvidence = optionalString(node.financeEvidenceReferences);
    const rawDraftEmail = optionalString(node.financeDraftEmail);
    const rawProvenance = optionalString(node.financeProvenanceHistory);
    const state = parseFinanceFollowUpState(rawState);
    if (!state) return [];
    const subjects = parseFinanceSubjects(rawSubjects);
    const people = parseFinancePeople(rawPeople);
    const evidence = parseFinanceEvidence(rawEvidence);
    const draftEmail = parseFinanceDraftEmail(rawDraftEmail);
    const provenance = parseFinanceProvenance(rawProvenance);
    const routedQuestion = routeFinanceInvestigationQuestion(node.title);
    const ownerName = [
      node.assignee?.name?.firstName,
      node.assignee?.name?.lastName,
    ]
      .filter(Boolean)
      .join(' ');
    return [
      {
        id: node.id,
        title: routedQuestion.question,
        questionRoute: routedQuestion.route,
        nativeStatus: node.status ?? 'UNKNOWN',
        state,
        dueAt: node.dueAt ?? null,
        ownerName: ownerName || 'Unassigned',
        subjects,
        people,
        findings: optionalString(node.financeFindings) ?? '',
        evidence,
        draftEmail,
        emailApproval: parseFinanceEmailApproval(
          optionalString(node.financeEmailApproval),
        ),
        correlationKey: optionalString(node.financeCorrelationKey) ?? '',
        provenance,
        updatedAt: node.updatedAt ?? '',
        revision:
          typeof node.financeRevision === 'number' &&
          Number.isSafeInteger(node.financeRevision) &&
          node.financeRevision >= 0
            ? node.financeRevision
            : 0,
        contractWarning: Boolean(
          hasInvalidStructuredArray(rawSubjects, subjects.length) ||
          hasInvalidStructuredArray(rawPeople, people.length) ||
          hasInvalidStructuredArray(rawEvidence, evidence.length) ||
          (rawDraftEmail && !draftEmail),
        ),
      },
    ];
  });

  return Object.freeze({
    accounts: Object.freeze(accounts),
    facts: Object.freeze(facts),
    statements: Object.freeze(statements),
    followUps: Object.freeze(followUps),
    truncated: Boolean(
      result.financialAccounts?.pageInfo.hasNextPage ||
      result.financeFacts?.pageInfo.hasNextPage ||
      result.sourceArtifacts?.pageInfo.hasNextPage ||
      result.tasks?.pageInfo.hasNextPage,
    ),
  });
};

export const workspaceReadFailure = (error: unknown): 'denied' | 'failed' => {
  const message = error instanceof Error ? error.message : String(error);
  return /(?:^|\D)(401|403)(?:\D|$)|forbidden|unauthori[sz]ed|permission/i.test(
    message,
  )
    ? 'denied'
    : 'failed';
};
