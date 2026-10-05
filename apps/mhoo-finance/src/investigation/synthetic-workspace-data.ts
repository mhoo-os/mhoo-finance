import type {
  WorkspaceFinanceData,
  WorkspaceFinanceFollowUp,
} from './workspace-finance-data';
import { financeTimelineRows } from './finance-timeline';
import {
  DEMO_QUESTIONS,
  initialDemoScope,
  resolveDemoQuestion,
} from './question-prototype';

const accountIds = {
  operating: '897a52e6-25a0-4489-ae7f-ff60580925ef',
  reserve: 'f61a855f-61a1-44a4-9709-fc16ac1bd5fe',
} as const;

const sourceRows = resolveDemoQuestion(
  initialDemoScope,
  DEMO_QUESTIONS[0],
  'normal',
).rows;

const timelineRows = [
  ...financeTimelineRows(sourceRows, '2024-01-01', '2026-12-31', 'all'),
  {
    id: 'synthetic-cross-year-opening',
    date: '2024-11-29',
    description: 'Illustrative cross-year receipt',
    account: 'operating' as const,
    amountMinor: '70000',
    direction: 'in' as const,
    inflowMinor: '70000',
    outflowMinor: '0',
    sourceLine: 40,
    sourceAvailable: false,
    includedInRealTotals: false,
    illustrativeHistory: true as const,
  },
  {
    id: 'synthetic-multiyear-closing',
    date: '2026-03-02',
    description: 'Illustrative multi-year payment',
    account: 'reserve' as const,
    amountMinor: '44000',
    direction: 'out' as const,
    inflowMinor: '0',
    outflowMinor: '44000',
    sourceLine: 41,
    sourceAvailable: false,
    includedInRealTotals: false,
    illustrativeHistory: true as const,
  },
];

export const SYNTHETIC_WORKSPACE_FINANCE_DATA: WorkspaceFinanceData =
  Object.freeze({
    accounts: Object.freeze([
      {
        id: accountIds.operating,
        label: 'Operating · demo',
        sourceKind: 'BANK',
      },
      { id: accountIds.reserve, label: 'Reserve · demo', sourceKind: 'BANK' },
    ]),
    facts: Object.freeze(
      timelineRows.map((row) => ({
        id: row.id,
        factKey: row.id,
        description: row.description,
        accountId: accountIds[row.account],
        accountLabel:
          row.account === 'operating' ? 'Operating · demo' : 'Reserve · demo',
        date: row.date,
        amountMinor: row.amountMinor,
        currency: 'USD',
        direction: row.direction,
        status: 'POSTED',
        classification: 'UNCLASSIFIED',
        includedInTotals: row.direction !== 'unknown',
        sourceLocation: row.sourceAvailable
          ? `synthetic-fixture.csv#${row.sourceLine}`
          : '',
        artifactId: null,
        artifactKey: row.sourceAvailable ? 'synthetic-fixture' : null,
      })),
    ),
    statements: Object.freeze([
      {
        id: '59bb8ac0-6669-4cac-96ce-9d2fe90bd5b9',
        artifactKey: 'synthetic-statement-2025-01',
        accountKey: 'Operating · demo',
        sourceKind: 'BANK',
        period: '2025-01',
        status: 'PARTIAL',
        originalFileName: 'synthetic-2025-01.pdf',
        statementControls: JSON.stringify({
          openingBalanceMinor: '800000',
          closingBalanceMinor: '840000',
          moneyInMinor: '100000',
          moneyOutMinor: '60000',
        }),
      },
      {
        id: '1692d925-63c7-4214-8dd2-d2cb3d82705b',
        artifactKey: 'synthetic-statement-2025-02',
        accountKey: 'Operating · demo',
        sourceKind: 'BANK',
        period: '2025-02',
        status: 'PARTIAL',
        originalFileName: 'synthetic-2025-02.pdf',
        statementControls: JSON.stringify({
          openingBalanceMinor: '840000',
          closingBalanceMinor: '820000',
          moneyInMinor: '120000',
          moneyOutMinor: '140000',
        }),
      },
    ]),
    followUps: Object.freeze([
      {
        id: '21db1e48-ff40-49bd-96e0-317769495a69',
        title: 'Which invoice explains the February receipt?',
        questionRoute: 'UNCHANGED',
        nativeStatus: 'IN_PROGRESS',
        state: 'WAITING_FOR_REPLY',
        dueAt: '2025-03-05T12:00:00.000Z',
        ownerName: 'Finance reviewer',
        subjects: Object.freeze([
          {
            kind: 'TRANSACTION',
            reference: 's14',
            label: '2025-02-15 · $1,200.00 money in',
          },
        ]),
        people: Object.freeze([
          {
            personId: '20202020-0001-4e7c-8001-123456789def',
            name: 'Illustrative business owner',
            role: 'Business owner',
            selectedRecipient: true,
          },
          {
            personId: '20202020-0002-4e7c-8001-123456789def',
            name: 'Illustrative accountant',
            role: 'Accountant',
            selectedRecipient: false,
          },
        ]),
        findings:
          'The bank row is retained, but the invoice or settlement reference has not been accepted.',
        evidence: Object.freeze([
          {
            kind: 'TRANSACTION',
            reference: 's14',
            label: 'Retained bank transaction',
            attribution: 'Synthetic bank fixture row s14',
            reviewerAccepted: true,
          },
        ]),
        draftEmail: Object.freeze({
          mailboxLabel: 'Authorized Workspace mailbox required',
          subject: 'Question about the February 15 receipt',
          body: 'Hi — could you share the invoice or settlement reference for the February 15 receipt? We only need the document that identifies this one transaction. Thank you, Mhoo Finance',
          recipientPersonIds: Object.freeze([
            '20202020-0001-4e7c-8001-123456789def',
          ]),
          attachmentReferences: Object.freeze([]),
        }),
        emailApproval: 'AWAITING_APPROVAL',
        correlationKey: 'finance-follow-up:synthetic-february-receipt',
        provenance: Object.freeze([
          {
            at: '2025-02-20T09:00:00.000Z',
            action: 'FOLLOW_UP_CREATED',
            to: 'TO_DO',
          },
          {
            at: '2025-02-21T09:00:00.000Z',
            action: 'REQUEST_DRAFTED_NOT_SENT',
            from: 'TO_DO',
            to: 'WAITING_FOR_REPLY',
          },
        ]),
        updatedAt: '2025-02-21T09:00:00.000Z',
        revision: 0,
        contractWarning: false,
      },
      {
        id: 'b64219dd-51df-47e4-9d6d-6a47fa28b2d7',
        title: 'Find the missing March operating statement',
        questionRoute: 'UNCHANGED',
        nativeStatus: 'TODO',
        state: 'TO_DO',
        dueAt: null,
        ownerName: 'Unassigned',
        subjects: Object.freeze([
          {
            kind: 'MISSING_STATEMENT_PERIOD',
            reference: 'operating:2025-03',
            label: 'Operating · March 2025',
          },
        ]),
        people: Object.freeze([]),
        findings: '',
        evidence: Object.freeze([]),
        draftEmail: null,
        emailApproval: null,
        correlationKey: 'finance-follow-up:synthetic-missing-march',
        provenance: Object.freeze([]),
        updatedAt: '2025-03-31T09:00:00.000Z',
        revision: 0,
        contractWarning: false,
      },
      {
        id: 'f9325ee3-6ac6-4d74-9c25-78d9e24ed84a',
        title: 'Review the owned-account transfer pair',
        questionRoute: 'UNCHANGED',
        nativeStatus: 'IN_PROGRESS',
        state: 'READY_FOR_REVIEW',
        dueAt: null,
        ownerName: 'Finance reviewer',
        subjects: Object.freeze([
          {
            kind: 'TRANSACTION',
            reference: 's20',
            label: 'Operating · $125.00 money out',
          },
          {
            kind: 'TRANSACTION',
            reference: 's21',
            label: 'Reserve · $125.00 money in',
          },
        ]),
        people: Object.freeze([]),
        findings:
          'Both directions are visible. Reviewer acceptance is still required before classification.',
        evidence: Object.freeze([]),
        draftEmail: null,
        emailApproval: null,
        correlationKey: 'finance-follow-up:synthetic-transfer-pair',
        provenance: Object.freeze([]),
        updatedAt: '2025-05-14T09:00:00.000Z',
        revision: 0,
        contractWarning: false,
      },
    ] satisfies readonly WorkspaceFinanceFollowUp[]),
    truncated: false,
  });
