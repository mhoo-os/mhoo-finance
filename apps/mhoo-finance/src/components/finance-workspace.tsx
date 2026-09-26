import { Workspace } from './finance-workspace-styles';
import type { RestApiClient } from 'twenty-client-sdk/rest';
import { FinanceFollowUpActions } from './finance-follow-up-actions';
import { useEffect, useState } from 'react';
import { FinanceInsights } from './finance-insights';
import { FinanceButton, FinancePageHeader } from './finance-ui/finance-insights-primitives';
import { FinancePeriodControls } from './finance-ui/finance-period-controls';

import { currency, formatMoney } from '../contracts/money';
import {
  financeFollowUpNextAction,
  financeFollowUpStateLabel,
  hasExactSelectedRecipients,
  type FinanceFollowUpState,
} from '../investigation/finance-follow-up-contract';
import {
  handoffSource,
  type HandoffResult,
  type SourceEntry,
} from '../investigation/source-handoff';
import {
  readWorkspaceFinance,
  workspaceReadFailure,
  type WorkspaceFinanceData,
  type WorkspaceFinanceFact,
  type WorkspaceFinanceFollowUp,
} from '../investigation/workspace-finance-data';
import {
  appendWorkspaceEvidenceDecision,
  evidenceDecisionFailure,
  readWorkspaceEvidenceHistory,
  type WorkspaceEvidenceAction,
  type WorkspaceEvidenceDecision,
} from '../investigation/workspace-evidence-decisions';
import {
  approveWorkspaceFinanceDraft,
  financeFollowUpMutationFailure,
  updateWorkspaceFinanceFollowUpState,
} from '../investigation/workspace-finance-follow-ups';
import { validTimelineWindow } from '../investigation/timeline-domain';
import { SYNTHETIC_WORKSPACE_FINANCE_DATA } from '../investigation/synthetic-workspace-data';
import {
  workspaceAggregateCurrency,
} from '../investigation/workspace-aggregate';

export type FinanceView =
  | 'overview'
  | 'transactions'
  | 'statements'
  | 'accounts'
  | 'followups'
  | 'sources';

const PAGE_TITLES: Readonly<Record<FinanceView, string>> = {
  overview: 'Overview',
  transactions: 'Transactions',
  statements: 'Statements',
  accounts: 'Accounts',
  followups: 'Follow-ups',
  sources: 'Add a source',
};

// Financial link-decision writes remain disabled. Native Task follow-ups use
// their separate caller-scoped REST workflow and do not enable this route.
const WORKSPACE_REVIEW_MUTATIONS_ENABLED = false;

const SOURCE_ROUTES: readonly {
  id: Exclude<SourceEntry, 'apps' | 'csv'>;
  title: string;
  type: string;
  description: string;
  boundary: string;
  action: string;
}[] = [
  {
    id: 'bank',
    title: 'Bank',
    type: 'BANK CONNECTION',
    description: 'Use a bank source app already available to this Workspace.',
    boundary: 'No bank connection is established by this screen.',
    action: 'Open Apps',
  },
  {
    id: 'pos',
    title: 'POS · Clover',
    type: 'POINT OF SALE',
    description: 'Manage Clover as a distinct POS source in Workspace Apps.',
    boundary: 'Clover installation and connection remain separate actions.',
    action: 'Open Apps',
  },
  {
    id: 'statement',
    title: 'Uploaded statements',
    type: 'DOCUMENT SOURCE',
    description:
      'Open governed Source artifacts for current, historical, or closed-account statements.',
    boundary: 'This review surface does not upload or import a file.',
    action: 'Open source artifacts',
  },
  {
    id: 'email',
    title: 'Email evidence',
    type: 'WORKSPACE GMAIL EVIDENCE',
    description:
      'Use an already authorized Workspace Gmail connection for supporting evidence.',
    boundary: 'Email evidence never creates a financial entry by itself.',
    action: 'Open Apps',
  },
];



type WorkspaceLoadState =
  | { kind: 'loading' }
  | { kind: 'denied' | 'failed' }
  | { kind: 'ready'; data: WorkspaceFinanceData };

const validWorkspaceFacts = (data: WorkspaceFinanceData) =>
  data.facts
    .filter((fact) => fact.date && fact.amountMinor !== null)
    .slice()
    .sort((left, right) =>
      left.date === right.date
        ? left.id.localeCompare(right.id)
        : left.date.localeCompare(right.date),
    );

const workspaceFactMoney = (fact: WorkspaceFinanceFact) =>
  fact.amountMinor === null
    ? '—'
    : (() => {
        try {
          return formatMoney({
            currency: currency(fact.currency),
            minor: fact.amountMinor,
          });
        } catch {
          return `${fact.amountMinor} minor units · currency unavailable`;
        }
      })();

const parseStatementControls = (value: string | null) => {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    const readMinor = (key: string) =>
      typeof record[key] === 'string' && /^-?(0|[1-9]\d*)$/.test(record[key])
        ? record[key]
        : null;
    const controls = {
      opening: readMinor('openingBalanceMinor'),
      closing: readMinor('closingBalanceMinor'),
      moneyIn: readMinor('moneyInMinor'),
      moneyOut: readMinor('moneyOutMinor'),
    };
    return Object.values(controls).every((item) => item !== null)
      ? controls
      : null;
  } catch {
    return null;
  }
};

const WorkspaceFinanceScreen = ({
  initialView,
  dataOverride,
  onTogglePreview,
  services,
}: {
  initialView: Exclude<FinanceView, 'sources'>;
  dataOverride?: WorkspaceFinanceData;
  onTogglePreview?: () => void;
  services?: {
    read: () => Promise<WorkspaceFinanceData>;
    client: RestApiClient;
  };
}) => {
  const [loadState, setLoadState] = useState<WorkspaceLoadState>(
    dataOverride
      ? { kind: 'ready', data: dataOverride }
      : {
          kind: 'loading',
        },
  );
  const [refresh, setRefresh] = useState(0);
  const [view, setView] = useState<FinanceView>(initialView);
  const [accountId, setAccountId] = useState('all');
  const [range, setRange] = useState({ start: '', end: '' });
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const [dateError, setDateError] = useState('');
  const [datesOpen, setDatesOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [createFollowUpOpen, setCreateFollowUpOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFact, setSelectedFact] = useState<WorkspaceFinanceFact | null>(
    null,
  );
  const [selectedFollowUp, setSelectedFollowUp] =
    useState<WorkspaceFinanceFollowUp | null>(null);
  const [followUpDetailSection, setFollowUpDetailSection] = useState<
    'summary' | 'people' | 'evidence' | 'email'
  >('summary');
  const [followUpMutation, setFollowUpMutation] = useState<
    'idle' | 'saving' | 'denied' | 'failed'
  >('idle');
  const [evidenceHistory, setEvidenceHistory] = useState<
    | { kind: 'idle' | 'loading' | 'denied' | 'failed' }
    | { kind: 'ready'; rows: readonly WorkspaceEvidenceDecision[] }
  >({ kind: 'idle' });
  const [savingEvidence, setSavingEvidence] = useState(false);
  const [sourceHandoff, setSourceHandoff] = useState<{
    route: SourceEntry;
    result: HandoffResult;
  } | null>(null);


  useEffect(() => {
    let cancelled = false;
    if (dataOverride) {
      setLoadState({ kind: 'ready', data: dataOverride });
      const dates = validWorkspaceFacts(dataOverride)
        .map((fact) => fact.date)
        .sort();
      const start = dates[0] ?? '';
      const end = dates.at(-1) ?? '';
      setRange({ start, end });
      setDraftStart(start);
      setDraftEnd(end);
      setDateError('');
      return () => {
        cancelled = true;
      };
    }
    setLoadState({ kind: 'loading' });
    (services?.read ?? readWorkspaceFinance)()
      .then((data) => {
        if (cancelled) return;
        setLoadState({ kind: 'ready', data });
        const dates = validWorkspaceFacts(data)
          .map((fact) => fact.date)
          .sort();
        setRange((current) => ({
          start: current.start || dates[0] || '',
          end: current.end || dates.at(-1) || '',
        }));
        setDraftStart((current) => current || dates[0] || '');
        setDraftEnd((current) => current || dates.at(-1) || '');
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadState({ kind: workspaceReadFailure(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [dataOverride, refresh, services]);

  useEffect(() => {
    let cancelled = false;
    if (dataOverride || !selectedFact?.artifactId) {
      setEvidenceHistory({ kind: 'idle' });
      return () => {
        cancelled = true;
      };
    }
    setEvidenceHistory({ kind: 'loading' });
    readWorkspaceEvidenceHistory(selectedFact.id, selectedFact.artifactId)
      .then((rows) => {
        if (!cancelled) setEvidenceHistory({ kind: 'ready', rows });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setEvidenceHistory({ kind: evidenceDecisionFailure(error) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [dataOverride, selectedFact?.artifactId, selectedFact?.id]);

  if (loadState.kind !== 'ready') {
    return (
      <Workspace aria-label={`${PAGE_TITLES[initialView]} Finance content`}>
        <main className="fw-main">
          <h1 className="fw-title">{PAGE_TITLES[initialView]}</h1>
          <div className="fw-empty" role="status">
            {loadState.kind === 'loading'
              ? 'Reading authorized Workspace records…'
              : loadState.kind === 'denied'
                ? 'You do not have permission to read these Finance records.'
                : 'Finance records could not be read. No demo data was substituted.'}
          </div>
          {loadState.kind !== 'loading' ? (
            <button
              type="button"
              className="fw-button"
              onClick={() => setRefresh((value) => value + 1)}
            >
              Retry
            </button>
          ) : null}
        </main>
      </Workspace>
    );
  }

  const data = loadState.data;
  const isSynthetic = dataOverride !== undefined;
  const relatedFollowUps = selectedFact
    ? data.followUps.filter((followUp) =>
        followUp.subjects.some(
          (subject) =>
            subject.kind === 'TRANSACTION' &&
            subject.reference === selectedFact.id,
        ),
      )
    : [];
  const allFacts = validWorkspaceFacts(data);
  const invalidFactCount = data.facts.length - allFacts.length;
  const firstFactDate = allFacts.map((fact) => fact.date).sort()[0] ?? '';
  const lastFactDate = allFacts.map((fact) => fact.date).sort().at(-1) ?? '';
  const domainStart = firstFactDate ? `${firstFactDate.slice(0, 4)}-01-01` : '';
  const domainEnd = lastFactDate ? `${lastFactDate.slice(0, 4)}-12-31` : '';
  const activeStart = range.start || domainStart;
  const activeEnd = range.end || domainEnd;
  const scopedFacts = allFacts.filter(
    (fact) =>
      (accountId === 'all' || fact.accountId === accountId) &&
      (!activeStart || fact.date >= activeStart) &&
      (!activeEnd || fact.date <= activeEnd),
  );
  const facts = scopedFacts.filter(
    (fact) =>
      view !== 'transactions' ||
      fact.description.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedAccountLabel =
    data.accounts.find((account) => account.id === accountId)?.label ?? null;
  const visibleStatements = data.statements.filter(
    (statement) =>
      (!activeStart || statement.period >= activeStart.slice(0, 7)) &&
      (!activeEnd || statement.period <= activeEnd.slice(0, 7)) &&
      (accountId === 'all' || statement.accountKey === selectedAccountLabel),
  );
  const timelineMonths = (() => {
    if (!domainStart || !domainEnd) return [];
    const months: Array<{ key: string; label: string; start: string; end: string }> = [];
    const cursor = new Date(`${domainStart.slice(0, 7)}-01T00:00:00Z`);
    const finalMonth = domainEnd.slice(0, 7);
    while (cursor.toISOString().slice(0, 7) <= finalMonth) {
      const key = cursor.toISOString().slice(0, 7);
      const last = new Date(cursor);
      last.setUTCMonth(last.getUTCMonth() + 1, 0);
      months.push({
        key,
        label: cursor.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        start: key === domainStart.slice(0, 7) ? domainStart : `${key}-01`,
        end: key === domainEnd.slice(0, 7) ? domainEnd : last.toISOString().slice(0, 10),
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return months;
  })();

  const openSource = async (route: SourceEntry) => {
    setSourceHandoff(null);
    setSourceHandoff({ route, result: await handoffSource(route) });
  };
  const appendEvidenceAction = async (action: WorkspaceEvidenceAction) => {
    if (
      !WORKSPACE_REVIEW_MUTATIONS_ENABLED ||
      !selectedFact?.artifactId ||
      savingEvidence
    )
      return;
    setSavingEvidence(true);
    try {
      const history = await appendWorkspaceEvidenceDecision({
        entryReference: selectedFact.id,
        evidenceReference: selectedFact.artifactId,
        sourceTypes: 'FINANCE_FACT|SOURCE_ARTIFACT',
        action,
        reasonCode: 'EXISTING_FACT_ARTIFACT_RELATION',
        at: new Date().toISOString(),
      });
      setEvidenceHistory({ kind: 'ready', rows: history });
    } catch (error) {
      setEvidenceHistory({ kind: evidenceDecisionFailure(error) });
    } finally {
      setSavingEvidence(false);
    }
  };

  const reloadFollowUp = async (id: string) => {
    if (isSynthetic) return;
    const updated = await (services?.read ?? readWorkspaceFinance)();
    const task = updated.followUps.find((row) => row.id === id);
    if (!task)
      throw new Error(
        'Saved Task is not visible after reload. Check permissions before retrying.',
      );
    setLoadState({ kind: 'ready', data: updated });
    setSelectedFollowUp(task);
    setView('followups');
  };

  const transitionFollowUp = async (to: FinanceFollowUpState) => {
    if (!selectedFollowUp || isSynthetic || followUpMutation === 'saving')
      return;
    setFollowUpMutation('saving');
    try {
      await updateWorkspaceFinanceFollowUpState(
        {
          taskId: selectedFollowUp.id,
          from: selectedFollowUp.state,
          to,
          expectedUpdatedAt: selectedFollowUp.updatedAt,
          expectedRevision: selectedFollowUp.revision,
          at: new Date().toISOString(),
        },
        services?.client,
      );
      await reloadFollowUp(selectedFollowUp.id);
      setFollowUpMutation('idle');
    } catch (error) {
      setFollowUpMutation(financeFollowUpMutationFailure(error));
    }
  };

  const approveFollowUpDraft = async () => {
    if (
      !selectedFollowUp?.draftEmail ||
      isSynthetic ||
      followUpMutation === 'saving'
    )
      return;
    setFollowUpMutation('saving');
    try {
      await approveWorkspaceFinanceDraft(
        {
          taskId: selectedFollowUp.id,
          from: 'AWAITING_APPROVAL',
          financeState: selectedFollowUp.state,
          expectedUpdatedAt: selectedFollowUp.updatedAt,
          expectedRevision: selectedFollowUp.revision,
          draftEmail: selectedFollowUp.draftEmail,
          people: selectedFollowUp.people,
          at: new Date().toISOString(),
        },
        services?.client,
      );
      await reloadFollowUp(selectedFollowUp.id);
      setFollowUpMutation('idle');
    } catch (error) {
      setFollowUpMutation(financeFollowUpMutationFailure(error));
    }
  };

  const dateControls = domainStart ? <FinancePeriodControls accounts={data.accounts} accountId={accountId} range={{ start: activeStart, end: activeEnd }} draft={{ start: draftStart, end: draftEnd }} resetRange={{ start: domainStart, end: domainEnd }} domainStart={domainStart} domainEnd={domainEnd} months={timelineMonths} filtersOpen={filtersOpen} datesOpen={datesOpen} error={dateError} onAccountIdChange={(next) => { setAccountId(next); setSelectedFact(null); }} onDraftChange={(next) => { setDraftStart(next.start); setDraftEnd(next.end); setDateError(''); }} onRangeChange={(next) => { if (!validTimelineWindow(next.start, next.end, domainStart, domainEnd)) { setDateError(`Choose valid dates between ${domainStart} and ${domainEnd}.`); return; } setRange(next); setDraftStart(next.start); setDraftEnd(next.end); setDateError(''); setSelectedFact(null); }} onValidationError={setDateError} onFiltersOpenChange={setFiltersOpen} onDatesOpenChange={setDatesOpen} /> : null;

  const factTable = (
    <div className="fw-table-wrap">
      <table className="fw-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Account</th>
            <th>Status</th>
            <th>Classification</th>
            <th className="fw-money-col">Money in</th>
            <th className="fw-money-col">Money out</th>
          </tr>
        </thead>
        <tbody>
          {facts.map((fact) => (
            <tr key={fact.id}>
              <td>{fact.date}</td>
              <td>
                <button
                  type="button"
                  className="fw-table-action"
                  onClick={() => setSelectedFact(fact)}
                >
                  {fact.description}
                </button>
              </td>
              <td>{fact.accountLabel}</td>
              <td>{fact.status}</td>
              <td>{fact.classification}</td>
              <td className="fw-money-col">
                {fact.direction === 'in' ? workspaceFactMoney(fact) : '—'}
              </td>
              <td className="fw-money-col">
                {fact.direction === 'out' ? workspaceFactMoney(fact) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const previewAction = onTogglePreview ? <FinanceButton aria-pressed={isSynthetic} onClick={onTogglePreview}>{isSynthetic ? 'Return to Workspace records' : 'Preview sample data'}</FinanceButton> : null;
  const pageSpecificActions = selectedFollowUp ? <FinanceButton onClick={() => { setSelectedFollowUp(null); setFollowUpDetailSection('summary'); setFollowUpMutation('idle'); }}>← Back to Follow-ups</FinanceButton>
    : view === 'sources' ? <FinanceButton onClick={() => setView(initialView)}>← Back to {PAGE_TITLES[initialView]}</FinanceButton>
      : view === 'followups' ? null
        : <><FinanceButton onClick={() => { setSourceHandoff(null); setView('sources'); }}>+ Add source</FinanceButton>{view === 'transactions' ? <FinanceButton onClick={() => setView('followups')}>Follow-ups</FinanceButton> : null}</>;
  const pageHeaderActions = previewAction || pageSpecificActions ? <>{previewAction}{pageSpecificActions}</> : undefined;

  return (
    <Workspace data-view={view} aria-label={`${PAGE_TITLES[view]} Finance content`}>
      <main className="fw-main">
        {view !== 'overview' || selectedFollowUp ? <FinancePageHeader title={selectedFollowUp ? 'Follow-up detail' : PAGE_TITLES[view]} detail={isSynthetic ? 'Hass Kitchen' : 'Workspace'} actions={pageHeaderActions} /> : null}

        {view === 'overview' && !selectedFollowUp ? <FinanceInsights data={data} isSynthetic={isSynthetic} onOpenFact={setSelectedFact} onOpenFollowUp={(task) => {setView('followups');setSelectedFollowUp(task);setFollowUpDetailSection('summary');}} /> : null}

        {view === 'transactions' && !selectedFollowUp ? (
          <>
            {dateControls}
            <div className="fw-actions">
              <input
                className="fi-search-input"
                aria-label="Search transactions"
                placeholder="Search transactions"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <span className="fw-label">
                {facts.length} {isSynthetic ? 'synthetic test' : 'authorized'}{' '}
                records
              </span>
            </div>
            {facts.length ? (
              factTable
            ) : (
              <div className="fw-empty">No matching Finance facts.</div>
            )}
          </>
        ) : null}

        {view === 'accounts' && !selectedFollowUp ? (
          <>
            {dateControls}
            <div className="fw-table-wrap">
              <table className="fw-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Type</th>
                    <th>Included records</th>
                    <th className="fw-money-col">Money in</th>
                    <th className="fw-money-col">Money out</th>
                  </tr>
                </thead>
                <tbody>
                  {data.accounts
                    .filter((account) => accountId === 'all' || account.id === accountId)
                    .map((account) => {
                    const accountFacts = allFacts.filter(
                      (fact) =>
                        fact.accountId === account.id &&
                        (!activeStart || fact.date >= activeStart) &&
                        (!activeEnd || fact.date <= activeEnd) &&
                        fact.includedInTotals &&
                        fact.status !== 'SUPERSEDED',
                    );
                    const accountAggregate = workspaceAggregateCurrency(
                      accountFacts,
                      data.truncated,
                    );
                    const accountMoney = (value: string) =>
                      accountAggregate.kind === 'available'
                        ? formatMoney({
                            currency: accountAggregate.currency,
                            minor: value,
                          })
                        : '—';
                    return (
                      <tr key={account.id}>
                        <td>
                          <strong>{account.label}</strong>
                        </td>
                        <td>{account.sourceKind}</td>
                        <td>{accountFacts.length}</td>
                        <td className="fw-money-col">
                          {accountMoney(
                            accountAggregate.kind === 'available'
                              ? accountAggregate.moneyInMinor
                              : '0',
                          )}
                        </td>
                        <td className="fw-money-col">
                          {accountMoney(
                            accountAggregate.kind === 'available'
                              ? accountAggregate.moneyOutMinor
                              : '0',
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!data.accounts.length ? (
                <div className="fw-empty">
                  No financial accounts are available in this Workspace.
                </div>
              ) : null}
              <p className="fw-local">
                Account totals show — when results are truncated, currency is
                unavailable, or an account contains mixed currencies.
              </p>
            </div>
          </>
        ) : null}

        {view === 'statements' && !selectedFollowUp ? (
          <>
            {dateControls}
            {visibleStatements.length ? (
              <p className="fw-local">
                Scroll the table sideways to see opening, closing, and status.
              </p>
            ) : null}
            <div className="fw-table-wrap">
              <table className="fw-table fw-statement-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Account</th>
                    <th>Source</th>
                    <th className="fw-money-col">Money in</th>
                    <th className="fw-money-col">Money out</th>
                    <th>Opening</th>
                    <th>Closing</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleStatements.map((statement) => {
                    const controls = parseStatementControls(
                      statement.statementControls,
                    );
                    return (
                      <tr key={statement.id}>
                        <td>
                          <strong>{statement.period}</strong>
                        </td>
                        <td>{statement.accountKey}</td>
                        <td>{statement.sourceKind}</td>
                        <td className="fw-money-col">
                          <span className="fw-control-value">
                            {controls?.moneyIn
                              ? `${controls.moneyIn} minor units`
                              : 'Unavailable'}
                          </span>
                        </td>
                        <td className="fw-money-col">
                          <span className="fw-control-value">
                            {controls?.moneyOut
                              ? `${controls.moneyOut} minor units`
                              : 'Unavailable'}
                          </span>
                        </td>
                        <td>
                          <span className="fw-control-value">
                            {controls?.opening
                              ? `${controls.opening} minor units`
                              : 'Unavailable'}
                          </span>
                        </td>
                        <td>
                          <span className="fw-control-value">
                            {controls?.closing
                              ? `${controls.closing} minor units`
                              : 'Unavailable'}
                          </span>
                        </td>
                        <td>{statement.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!visibleStatements.length ? (
                <div className="fw-empty">
                  {data.statements.length
                    ? 'No statement source artifacts match this window and account.'
                    : 'No statement source artifacts are available in this Workspace.'}
                </div>
              ) : null}
              <p className="fw-local">
                Statement controls retain exact minor-unit text, but no money
                display is inferred until the source records an explicit
                currency.
              </p>
            </div>
          </>
        ) : null}

        {view === 'followups' && !selectedFollowUp ? (
          <>
            <div className="fw-followup-toolbar">
              <p className="fw-page-note">Track missing evidence and the next action for each review.</p>
              <button type="button" className="fw-button" aria-expanded={createFollowUpOpen} onClick={() => setCreateFollowUpOpen((open) => !open)}>New follow-up</button>
            </div>
            {createFollowUpOpen ? <FinanceFollowUpActions
              section="create"
              data={data}
              disabled={isSynthetic}
              client={services?.client}
              onSaved={reloadFollowUp}
            /> : null}
            <div className="fw-followup-list" aria-label="Finance follow-ups">
              {data.followUps.map((followUp) => (
                <button
                  type="button"
                  className="fw-followup-row"
                  key={followUp.id}
                  onClick={() => {
                    setSelectedFollowUp(followUp);
                    setFollowUpDetailSection('summary');
                    setFollowUpMutation('idle');
                  }}
                >
                  <span>
                    <span className="fw-followup-question">
                      {followUp.title}
                    </span>
                    <span className="fw-followup-meta">
                      {followUp.subjects.length} linked subject
                      {followUp.subjects.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <span className="fw-followup-status">
                    {financeFollowUpStateLabel(followUp.state)}
                  </span>
                  <span className="fw-followup-owner">
                    <span className="fw-followup-meta">Owner</span>
                    <br />
                    {followUp.ownerName}
                  </span>
                  <span>
                    <span className="fw-followup-meta">Next action</span>
                    <br />
                    {financeFollowUpNextAction(followUp.state)}
                  </span>
                </button>
              ))}
            </div>
            {!data.followUps.length ? (
              <div className="fw-empty">
                No Finance follow-up Tasks are visible to your role.
              </div>
            ) : null}
          </>
        ) : null}

        {view === 'followups' && selectedFollowUp ? (
          <>
            <section className="fw-detail-heading">
              <span className="fw-kicker">Native Twenty Task</span>
              <h2>{selectedFollowUp.title}</h2>
              <span className="fw-followup-status">
                {financeFollowUpStateLabel(selectedFollowUp.state)}
              </span>
              <p className="fw-page-note">
                Owner: {selectedFollowUp.ownerName} · Next:{' '}
                {financeFollowUpNextAction(selectedFollowUp.state)}
              </p>
              {selectedFollowUp.questionRoute !== 'UNCHANGED' ? (
                <div className="fw-reason" role="status">
                  Conclusion-seeking wording is withheld here. Finance keeps a
                  neutral evidence question; qualified professionals own audit,
                  tax, legal and misconduct conclusions.
                </div>
              ) : null}
              {selectedFollowUp.contractWarning ? (
                <div className="fw-reason" role="status">
                  Some Finance context failed validation and is withheld.
                </div>
              ) : null}
            </section>
            <div className="fw-detail-tabs" role="tablist">
              {(
                [
                  ['summary', 'Summary'],
                  ['people', 'People'],
                  ['evidence', 'Evidence'],
                  ['email', 'Email'],
                ] as const
              ).map(([section, label]) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={followUpDetailSection === section}
                  className="fw-detail-tab"
                  key={section}
                  onClick={() => setFollowUpDetailSection(section)}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="fw-button"
              disabled={isSynthetic || followUpMutation === 'saving'}
              onClick={() => {
                setFollowUpMutation('saving');
                void reloadFollowUp(selectedFollowUp.id)
                  .then(() => setFollowUpMutation('idle'))
                  .catch((error) =>
                    setFollowUpMutation(financeFollowUpMutationFailure(error)),
                  );
              }}
            >
              Reload Task
            </button>
            {followUpMutation === 'denied' || followUpMutation === 'failed' ? (
              <p role="alert" className="fw-warning">
                {followUpMutation === 'denied'
                  ? 'Twenty denied this action. Your permissions were not changed.'
                  : 'The write could not be verified. Reload the Task before retrying.'}
              </p>
            ) : null}
            {followUpDetailSection === 'summary' ? (
              <section className="fw-detail-section" aria-label="Summary">
                <h3>Question scope</h3>
                <ul className="fw-detail-list">
                  {selectedFollowUp.subjects.map((subject) => (
                    <li
                      className="fw-detail-item"
                      key={`${subject.kind}:${subject.reference}`}
                    >
                      <strong>{subject.label}</strong>
                      <span className="fw-local">
                        {subject.kind === 'TRANSACTION'
                          ? 'Transaction'
                          : 'Missing statement period'}{' '}
                        · {subject.reference}
                      </span>
                    </li>
                  ))}
                </ul>
                {!selectedFollowUp.subjects.length ? (
                  <div className="fw-empty">
                    No valid Finance subject links.
                  </div>
                ) : null}
                <h3>What we found</h3>
                <p>
                  {selectedFollowUp.findings ||
                    'No reviewer explanation has been recorded.'}
                </p>
                <p className="fw-local">
                  Explanations, authorized uploads and existing records retain
                  their own attribution. Native Task attachments are the file
                  surface; this Finance view does not upload automatically.
                </p>
                <div className="fw-detail-actions">
                  {selectedFollowUp.state === 'TO_DO' ? (
                    <>
                      <button
                        type="button"
                        className="fw-button"
                        disabled={isSynthetic || followUpMutation === 'saving'}
                        onClick={() =>
                          void transitionFollowUp('WAITING_FOR_REPLY')
                        }
                      >
                        Mark waiting for reply
                      </button>
                      <button
                        type="button"
                        className="fw-button"
                        disabled={isSynthetic || followUpMutation === 'saving'}
                        onClick={() =>
                          void transitionFollowUp('READY_FOR_REVIEW')
                        }
                      >
                        Ready for review
                      </button>
                    </>
                  ) : selectedFollowUp.state === 'WAITING_FOR_REPLY' ? (
                    <>
                      <button
                        type="button"
                        className="fw-button"
                        disabled={isSynthetic || followUpMutation === 'saving'}
                        onClick={() =>
                          void transitionFollowUp('READY_FOR_REVIEW')
                        }
                      >
                        Ready for review
                      </button>
                      <button
                        type="button"
                        className="fw-button"
                        disabled={isSynthetic || followUpMutation === 'saving'}
                        onClick={() => void transitionFollowUp('TO_DO')}
                      >
                        Return to do
                      </button>
                    </>
                  ) : selectedFollowUp.state === 'READY_FOR_REVIEW' ? (
                    <>
                      <button
                        type="button"
                        className="fw-button"
                        disabled={isSynthetic || followUpMutation === 'saving'}
                        onClick={() =>
                          void transitionFollowUp('WAITING_FOR_REPLY')
                        }
                      >
                        Request more information
                      </button>
                      <button
                        type="button"
                        className="fw-button"
                        disabled={isSynthetic || followUpMutation === 'saving'}
                        onClick={() => void transitionFollowUp('RESOLVED')}
                      >
                        Resolve after review
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="fw-button"
                      disabled={isSynthetic || followUpMutation === 'saving'}
                      onClick={() =>
                        void transitionFollowUp('READY_FOR_REVIEW')
                      }
                    >
                      Reopen review
                    </button>
                  )}
                </div>
                {isSynthetic ? (
                  <p className="fw-local" role="status">
                    This static sample is read-only.
                  </p>
                ) : followUpMutation === 'denied' ? (
                  <p className="fw-local" role="status">
                    Your Workspace role cannot update this Task.
                  </p>
                ) : followUpMutation === 'failed' ? (
                  <p className="fw-local" role="status">
                    The Task update could not be verified and was not shown as
                    complete.
                  </p>
                ) : null}
              </section>
            ) : null}

            {followUpDetailSection === 'people' ? (
              <section className="fw-detail-section" aria-label="People">
                <FinanceFollowUpActions
                  key={`${selectedFollowUp.id}:people:${selectedFollowUp.revision}`}
                  section="people"
                  task={selectedFollowUp}
                  data={data}
                  disabled={isSynthetic}
                  client={services?.client}
                  onSaved={reloadFollowUp}
                />
                <p className="fw-page-note">
                  People are shown only when requested. Being listed here does
                  not grant Workspace membership or Finance-record access.
                </p>
                <ul className="fw-detail-list">
                  {selectedFollowUp.people.map((person) => (
                    <li className="fw-detail-item" key={person.personId}>
                      <strong>{person.name}</strong>
                      <span>
                        {person.role} ·{' '}
                        {person.selectedRecipient
                          ? 'Selected recipient'
                          : 'Not selected for email'}
                      </span>
                    </li>
                  ))}
                </ul>
                {!selectedFollowUp.people.length ? (
                  <div className="fw-empty">No involved People recorded.</div>
                ) : null}
              </section>
            ) : null}

            {followUpDetailSection === 'evidence' ? (
              <section className="fw-detail-section" aria-label="Evidence">
                <FinanceFollowUpActions
                  key={`${selectedFollowUp.id}:evidence:${selectedFollowUp.revision}`}
                  section="evidence"
                  task={selectedFollowUp}
                  data={data}
                  disabled={isSynthetic}
                  client={services?.client}
                  onSaved={reloadFollowUp}
                />
                <p className="fw-page-note">
                  Replies and attachments stay attributed to their source.
                  Ambiguous correlation requires review and private replies are
                  not shared with other participants automatically.
                </p>
                <ul className="fw-detail-list">
                  {selectedFollowUp.evidence.map((item) => (
                    <li
                      className="fw-detail-item"
                      key={`${item.kind}:${item.reference}`}
                    >
                      <strong>{item.label}</strong>
                      <span>
                        {item.kind} · {item.attribution} ·{' '}
                        {item.reviewerAccepted
                          ? 'Reviewer accepted'
                          : 'Needs reviewer acceptance'}
                      </span>
                    </li>
                  ))}
                </ul>
                {!selectedFollowUp.evidence.length ? (
                  <div className="fw-empty">No valid evidence references.</div>
                ) : null}
              </section>
            ) : null}

            {followUpDetailSection === 'email' ? (
              <section className="fw-detail-section" aria-label="Email">
                <FinanceFollowUpActions
                  key={`${selectedFollowUp.id}:email:${selectedFollowUp.revision}`}
                  section="email"
                  task={selectedFollowUp}
                  data={data}
                  disabled={isSynthetic}
                  client={services?.client}
                  onSaved={reloadFollowUp}
                />
                <p className="fw-page-note">
                  A draft must show its intended sender, selected recipients,
                  exact body and attachments before approval. The sender label
                  is planned, not a verified mailbox. This build does not send
                  email or request new mailbox scopes.
                </p>
                {selectedFollowUp.draftEmail ? (
                  <div className="fw-email-preview">
                    <span className="fw-kicker">
                      {selectedFollowUp.emailApproval ?? 'Draft state unknown'}
                    </span>
                    <h3>From</h3>
                    <p>{selectedFollowUp.draftEmail.mailboxLabel}</p>
                    <h3>Recipients</h3>
                    <p>
                      {selectedFollowUp.people
                        .filter(
                          (person) =>
                            person.selectedRecipient &&
                            selectedFollowUp.draftEmail?.recipientPersonIds.includes(
                              person.personId,
                            ),
                        )
                        .map((person) => `${person.name} · ${person.role}`)
                        .join(', ') || 'No valid selected recipient'}
                    </p>
                    <h3>Subject</h3>
                    <p>{selectedFollowUp.draftEmail.subject}</p>
                    <div className="fw-email-body">
                      {selectedFollowUp.draftEmail.body}
                    </div>
                    <h3>Attachments</h3>
                    <p>
                      {selectedFollowUp.draftEmail.attachmentReferences.join(
                        ', ',
                      ) || 'None'}
                    </p>
                    {selectedFollowUp.emailApproval === 'AWAITING_APPROVAL' ? (
                      <div className="fw-detail-actions">
                        <button
                          type="button"
                          className="fw-button"
                          disabled={
                            selectedFollowUp.state === 'RESOLVED' ||
                            isSynthetic ||
                            followUpMutation === 'saving' ||
                            !hasExactSelectedRecipients(
                              selectedFollowUp.draftEmail,
                              selectedFollowUp.people,
                            )
                          }
                          onClick={() => void approveFollowUpDraft()}
                        >
                          Approve draft · do not send
                        </button>
                      </div>
                    ) : null}
                    {isSynthetic ? (
                      <p className="fw-local">
                        Synthetic adapter is read-only; approval is not faked.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="fw-empty">
                    No saved draft yet. Compose a request above, then review its
                    reloaded preview.
                  </div>
                )}
                <p className="fw-local">
                  Correlation:{' '}
                  {selectedFollowUp.correlationKey || 'Unavailable'}
                </p>
              </section>
            ) : null}
          </>
        ) : null}

        {view === 'sources' && !selectedFollowUp ? (
          <>
            <p className="fw-page-note">
              Choose a source type. These routes hand off to Twenty-owned
              Workspace surfaces; they do not claim a connection or import.
            </p>
            <div className="fw-source-grid">
              {SOURCE_ROUTES.map((route) => (
                <article className="fw-source-card" key={route.id}>
                  <div className="fw-source-copy">
                    <div className="fw-source-heading">
                      <h2>{route.title}</h2>
                      <span className="fw-source-type">{route.type}</span>
                    </div>
                    <p>{route.description}</p>
                  </div>
                  <div className="fw-source-action">
                    <FinanceButton onClick={() => void openSource(route.id)}>
                      {route.action}
                    </FinanceButton>
                    <p className="fw-local">{route.boundary}</p>
                  </div>
                </article>
              ))}
            </div>
            {sourceHandoff ? (
              <div className="fw-empty" role="status">
                {sourceHandoff.result === 'handed-off'
                  ? `${SOURCE_ROUTES.find((route) => route.id === sourceHandoff.route)?.title ?? 'Source'} handoff opened.`
                  : 'Twenty could not open that source surface. No connection was changed.'}
              </div>
            ) : null}
          </>
        ) : null}

        <footer className="fw-bottom">
          <span>
            {isSynthetic
              ? 'Synthetic adapter · explicit test data'
              : 'Current Workspace · permission-checked read'}
          </span>
          <span>
            {isSynthetic
              ? 'Removable preview source; never substituted into Workspace reads.'
              : data.truncated
                ? 'Result limit reached; totals are withheld from completeness claims.'
                : invalidFactCount
                  ? `${invalidFactCount} invalid or undated record${invalidFactCount === 1 ? '' : 's'} withheld; no synthetic fallback is active.`
                  : 'No synthetic fallback is active.'}
          </span>
        </footer>
      </main>

      {selectedFact ? (
        <>
          <div
            className="fw-shade"
            onClick={() => setSelectedFact(null)}
            aria-hidden="true"
          />
          <aside
            className="fw-drawer"
            role="dialog"
            aria-label="Transaction evidence"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                setSelectedFact(null);
              }
            }}
          >
            <div className="fw-drawer-top">
              <span>
                {isSynthetic ? 'SYNTHETIC TEST RECORD' : 'WORKSPACE RECORD'}
              </span>
              <button
                type="button"
                className="fw-close"
                aria-label="Close investigation"
                onClick={() => setSelectedFact(null)}
              >
                ×
              </button>
            </div>
            <h2 className="fw-drawer-title">{selectedFact.description}</h2>
            <div className="fw-drawer-value">
              {workspaceFactMoney(selectedFact)}
            </div>
            <dl className="fw-definition">
              <dt>Direction</dt>
              <dd>{selectedFact.direction}</dd>
              <dt>Classification</dt>
              <dd>{selectedFact.classification}</dd>
              <dt>Source location</dt>
              <dd>{selectedFact.sourceLocation || 'Unavailable'}</dd>
              <dt>Artifact</dt>
              <dd>{selectedFact.artifactKey || 'No linked artifact'}</dd>
              <dt>Included in totals</dt>
              <dd>{selectedFact.includedInTotals ? 'Yes' : 'No'}</dd>
            </dl>
            <section className="fw-panel" style={{ marginTop: 14 }}>
              <div className="fw-panel-top">
                <h3 className="fw-panel-title">Follow-ups</h3>
                <span className="fw-status">{relatedFollowUps.length}</span>
              </div>
              {relatedFollowUps.length ? (
                <button
                  type="button"
                  className="fw-button"
                  onClick={() => {
                    setSelectedFact(null);
                    setView('followups');
                    setSelectedFollowUp(
                      relatedFollowUps.length === 1
                        ? (relatedFollowUps[0] ?? null)
                        : null,
                    );
                    setFollowUpDetailSection('summary');
                  }}
                >
                  {relatedFollowUps.length === 1
                    ? 'Open related follow-up'
                    : 'View related follow-ups'}
                </button>
              ) : (
                <p className="fw-local">
                  No native Finance follow-up Task references this transaction.
                </p>
              )}
            </section>
            {selectedFact.artifactId ? (
              <section className="fw-panel" style={{ marginTop: 14 }}>
                <div className="fw-panel-top">
                  <h3 className="fw-panel-title">Related evidence</h3>
                  <span className="fw-status">
                    {evidenceHistory.kind === 'ready'
                      ? (evidenceHistory.rows.at(-1)?.linkStatus ??
                        'LINKED BY RECORD')
                      : evidenceHistory.kind.toUpperCase()}
                  </span>
                </div>
                <p className="fw-sub">
                  The Finance fact carries an explicit Source artifact relation.
                  Reviewer actions append immutable Workspace decision records;
                  they do not delete either original or change classification.
                </p>
                {!WORKSPACE_REVIEW_MUTATIONS_ENABLED ? (
                  <p className="fw-warning" role="status">
                    Evidence link actions remain read-only in this install
                    candidate.
                  </p>
                ) : null}
                {evidenceHistory.kind === 'ready' ? (
                  <>
                    <div className="fw-actions">
                      {(evidenceHistory.rows.at(-1)?.linkStatus ?? 'LINKED') ===
                      'LINKED' ? (
                        <button
                          type="button"
                          className="fw-button"
                          disabled={
                            !WORKSPACE_REVIEW_MUTATIONS_ENABLED ||
                            savingEvidence
                          }
                          onClick={() => void appendEvidenceAction('UNLINKED')}
                        >
                          Unlink evidence
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="fw-button"
                          disabled={
                            !WORKSPACE_REVIEW_MUTATIONS_ENABLED ||
                            savingEvidence
                          }
                          onClick={() => void appendEvidenceAction('RESTORED')}
                        >
                          Restore link
                        </button>
                      )}
                    </div>
                    <ol className="fw-history">
                      {evidenceHistory.rows.map((event) => (
                        <li key={event.id}>
                          {event.createdAt} · {event.linkStatus} ·{' '}
                          {event.reasonCode}
                        </li>
                      ))}
                    </ol>
                  </>
                ) : evidenceHistory.kind === 'denied' ? (
                  <p className="fw-local" role="status">
                    Your Workspace role cannot read or write evidence decisions.
                  </p>
                ) : evidenceHistory.kind === 'failed' ? (
                  <p className="fw-local" role="status">
                    Evidence decisions could not be read. No local fallback was
                    applied.
                  </p>
                ) : null}
              </section>
            ) : (
              <p className="fw-local">
                No explicit Source artifact relation exists, so no link action
                is offered.
              </p>
            )}
            <p className="fw-local">
              {isSynthetic
                ? 'This drawer shows sample fields only. It does not change Workspace records.'
                : 'This drawer reads retained Workspace fields. It does not infer direction from description text or change classification.'}
            </p>
          </aside>
        </>
      ) : null}
    </Workspace>
  );
};

export const FinanceWorkspace = ({
  initialView = 'overview',
  dataSource = 'workspace',
  services,
}: {
  onExit?: () => void;
  initialView?: Exclude<FinanceView, 'sources'>;
  dataSource?: 'workspace' | 'synthetic';
  services?: {
    read: () => Promise<WorkspaceFinanceData>;
    client: RestApiClient;
  };
}) => {
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const isSynthetic = dataSource === 'synthetic' || previewEnabled;
  const onTogglePreview =
    dataSource === 'workspace'
      ? () => setPreviewEnabled((enabled) => !enabled)
      : undefined;

  return isSynthetic ? (
    <WorkspaceFinanceScreen
      key="synthetic"
      dataOverride={SYNTHETIC_WORKSPACE_FINANCE_DATA}
      initialView={initialView}
      onTogglePreview={onTogglePreview}
    />
  ) : (
    <WorkspaceFinanceScreen
      key="workspace"
      initialView={initialView}
      onTogglePreview={onTogglePreview}
      services={services}
    />
  );
};
