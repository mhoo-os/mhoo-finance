import { minor, sumMoney } from '../contracts/money';

export const DEMO_QUESTIONS = [
  'What changed in outflows?',
  'Which periods need more evidence?',
  'What was actual six-year profit?',
  'Is this fraud?',
] as const;
export type DemoQuestion = (typeof DEMO_QUESTIONS)[number];
export type DemoScenario =
  'normal' | 'empty' | 'missing' | 'denied' | 'failed' | 'slow';
export type DemoScope = {
  account: 'all' | 'operating' | 'reserve';
  period: 'comparison' | 'february' | 'march';
  snapshot: 'demo-v1' | 'demo-v2';
};
export type DemoRow = {
  id: string;
  account: 'operating' | 'reserve';
  date: string;
  description: string;
  outflowMinor: string;
  sourceLine: number;
  sourceAvailable: boolean;
  includedInRealTotals: false;
};

export type DemoSourceLane = {
  id: 'tax' | 'bank' | 'clover' | 'email';
  label: string;
  period: string;
  basis: string;
  status: 'REVIEWABLE' | 'PARTIAL' | 'NOT_CONNECTED';
  provenance: string;
  limitation: string;
};

export const DEMO_SOURCE_LANES: readonly DemoSourceLane[] = [
  {
    id: 'tax',
    label: 'Filed tax return',
    period: 'Example tax year 2024',
    basis: 'Filed basis shown; reporting basis remains separate',
    status: 'PARTIAL',
    provenance: 'invented-return-2024.pdf · demo checksum',
    limitation:
      'A filed return is a historical source, not proof of current-year activity.',
  },
  {
    id: 'bank',
    label: 'Bank + Plaid activity',
    period: 'Example Jan–Feb 2025',
    basis: 'Transaction date; statement controls unavailable',
    status: 'REVIEWABLE',
    provenance: 'demo-v1-invented-transactions.csv · rows 2–8',
    limitation:
      'Plaid-style rows do not prove statement completeness or account ownership.',
  },
  {
    id: 'clover',
    label: 'Clover sales + settlement',
    period: 'Example February settlement',
    basis: 'Sale date kept separate from bank settlement date',
    status: 'NOT_CONNECTED',
    provenance: 'illustrative settlement packet only',
    limitation:
      'No live merchant, token, import, payout coverage or connection is represented.',
  },
  {
    id: 'email',
    label: 'Invoice + vendor evidence',
    period: 'Example February correspondence',
    basis: 'Document and message dates; payment date remains separate',
    status: 'PARTIAL',
    provenance: 'invented invoice excerpt · no mailbox custody',
    limitation:
      'CRM email sync is not a complete invoice, vendor or payment-evidence archive.',
  },
];

export type DemoReconciliationItem = {
  id: string;
  title: string;
  status: 'MATCHED' | 'PARTIAL' | 'HUMAN_REVIEW';
  treatment: string;
  evidence: string;
  uncertainty: string;
};

export type DemoAttentionItem = {
  id: string;
  label: string;
  status: 'NEEDS_EVIDENCE' | 'UNCLASSIFIED' | 'PARTIAL_MATCH' | 'HUMAN_REVIEW';
  explanation: string;
  contributingRowId: string;
  requiresMissingSource?: boolean;
};

export const DEMO_ATTENTION_ITEMS: readonly DemoAttentionItem[] = [
  {
    id: 'missing-evidence',
    label: 'Missing evidence',
    status: 'NEEDS_EVIDENCE',
    explanation:
      'One contributing transaction has a locator but no source excerpt.',
    contributingRowId: 'd6',
    requiresMissingSource: true,
  },
  {
    id: 'unmatched-money',
    label: 'Unmatched money',
    status: 'UNCLASSIFIED',
    explanation:
      'One movement stays unclassified until both sides or a source are reviewed.',
    contributingRowId: 'd6',
  },
  {
    id: 'contradictory-sources',
    label: 'Contradictory sources',
    status: 'PARTIAL_MATCH',
    explanation:
      'A Clover settlement candidate and net bank deposit must not be forced to agree.',
    contributingRowId: 'd4',
  },
  {
    id: 'human-review',
    label: 'Human review',
    status: 'HUMAN_REVIEW',
    explanation:
      'An invoice and bank-payment candidate need an explicit reviewer decision.',
    contributingRowId: 'd5',
  },
];

export const DEMO_RECONCILIATION_ITEMS: readonly DemoReconciliationItem[] = [
  {
    id: 'duplicate-export',
    title: 'Repeated bank / Plaid export',
    status: 'MATCHED',
    treatment:
      'Suppress the repeated acquisition; keep both import receipts and one eligible fact.',
    evidence: 'Stable source identity plus matching content and row keys.',
    uncertainty:
      'A similar description or amount alone never proves a duplicate.',
  },
  {
    id: 'internal-transfer',
    title: 'Operating → reserve transfer',
    status: 'MATCHED',
    treatment:
      'Pair both sides and exclude the internal movement from revenue and expense.',
    evidence:
      'Opposite signed entries, compatible dates, currency and owned-account scope.',
    uncertainty:
      'One visible side remains an unclassified movement, not an expense.',
  },
  {
    id: 'clover-settlement',
    title: 'Clover settlement → bank deposit',
    status: 'PARTIAL',
    treatment:
      'Bridge gross sales, refunds and processor fees before comparing the net deposit.',
    evidence:
      'Illustrative settlement components and one bank deposit candidate.',
    uncertainty:
      'Do not force gross sales to equal a net deposit or collapse fees and refunds.',
  },
  {
    id: 'invoice-payment',
    title: 'Vendor invoice → bank payment',
    status: 'HUMAN_REVIEW',
    treatment:
      'Show ranked candidates with reasons; a reviewer accepts, rejects or requests evidence.',
    evidence: 'Vendor, amount and date proximity from invented excerpts.',
    uncertainty:
      'Email presence is supporting evidence, not payment proof or a complete mailbox search.',
  },
];

export const DEMO_FORECAST_ASSUMPTIONS = [
  [
    'Actuals baseline',
    'Requires reviewed, sufficiently covered source periods',
  ],
  [
    'Revenue pattern',
    'Use approved historical sales definition; do not substitute bank deposits',
  ],
  ['Cost pattern', 'Keep fixed, variable, refund and fee behavior explicit'],
  [
    'Scenario changes',
    'Human-entered assumptions with author, as-of date and version',
  ],
] as const;

// Fixed invented data only. No client records, provider identifiers or Files.
const ROWS: readonly DemoRow[] = [
  ['d1', 'operating', '2025-01-08', 'Demo produce supplier', '42000', 2, true],
  ['d2', 'operating', '2025-01-17', 'Demo equipment service', '18000', 3, true],
  ['d3', 'reserve', '2025-01-21', 'Demo maintenance', '15000', 4, true],
  [
    'd4',
    'operating',
    '2025-02-05',
    'Demo Clover settlement candidate',
    '56000',
    5,
    true,
  ],
  [
    'd5',
    'operating',
    '2025-02-12',
    'Demo vendor payment candidate',
    '28000',
    6,
    true,
  ],
  [
    'd6',
    'operating',
    '2025-02-19',
    'Demo unclassified movement',
    '36000',
    7,
    false,
  ],
  ['d7', 'reserve', '2025-02-22', 'Demo maintenance', '20000', 8, true],
].map(
  ([
    id,
    account,
    date,
    description,
    outflowMinor,
    sourceLine,
    sourceAvailable,
  ]) => ({
    id,
    account,
    date,
    description,
    outflowMinor,
    sourceLine,
    sourceAvailable,
    includedInRealTotals: false,
  }),
) as DemoRow[];

export const initialDemoScope: DemoScope = {
  account: 'all',
  period: 'comparison',
  snapshot: 'demo-v1',
};
export const demoMoney = (value: string): string => {
  const amount = minor(value);
  const absolute = amount < 0n ? -amount : amount;
  return (
    (amount < 0n ? '-$' : '$') +
    String(absolute / 100n) +
    '.' +
    String(absolute % 100n).padStart(2, '0')
  );
};
export const demoScopeKey = (
  scope: DemoScope,
  question: string,
  scenario: DemoScenario,
) =>
  JSON.stringify([
    scope.account,
    scope.period,
    scope.snapshot,
    question,
    scenario,
  ]);

export type DemoResult = {
  key: string;
  scope: DemoScope;
  question: string;
  status: 'ready' | 'empty' | 'denied' | 'failed' | 'refused';
  answer: string;
  limitation: string;
  rows: DemoRow[];
  groups: {
    month: string;
    label: string;
    outflowMinor: string;
    available: number;
    count: number;
  }[];
  scenario: DemoScenario;
};

export const visibleDemoAttentionItems = (
  result: DemoResult | null,
  visibleRows: readonly DemoRow[],
): readonly DemoAttentionItem[] => {
  if (!result || result.status !== 'ready') return [];
  const rowsById = new Map(visibleRows.map((row) => [row.id, row]));
  return DEMO_ATTENTION_ITEMS.filter((item) => {
    const row = rowsById.get(item.contributingRowId);
    return Boolean(
      row && (!item.requiresMissingSource || row.sourceAvailable === false),
    );
  });
};

export const demoReviewContextKey = (
  attentionId: string | null,
  rowId: string | null,
  snapshot: string | null,
): string => JSON.stringify([attentionId ?? 'direct', rowId, snapshot]);

const total = (rows: readonly DemoRow[]) =>
  sumMoney(
    rows.map((row) => ({ currency: 'USD', minor: row.outflowMinor })),
    'USD',
  ).minor;

export function resolveDemoQuestion(
  scope: DemoScope,
  question: string,
  scenario: DemoScenario,
): DemoResult {
  const result: DemoResult = {
    key: demoScopeKey(scope, question, scenario),
    scope: { ...scope },
    question,
    scenario,
    status: 'ready',
    answer: '',
    rows: [],
    groups: [],
    limitation:
      'Invented USD examples only; excluded from all real totals. Source excerpts are synthetic, not original files. No statement balance controls or real account coverage are established.',
  };
  if (scenario === 'denied' || scenario === 'failed') {
    return {
      ...result,
      status: scenario,
      answer:
        scenario === 'denied'
          ? 'Demo access denied. No results or evidence were returned.'
          : 'Demo request failed. No fallback records were substituted.',
    };
  }
  if (question !== DEMO_QUESTIONS[0] && question !== DEMO_QUESTIONS[1]) {
    return {
      ...result,
      status: 'refused',
      answer:
        question === DEMO_QUESTIONS[3]
          ? 'An unexplained movement is not proof of fraud. Inspect supporting and contrary evidence, then request human review.'
          : question === DEMO_QUESTIONS[2]
            ? 'Actual six-year profit cannot be established from invented samples or partial exports. Complete coverage, eligibility and statement controls are missing.'
            : 'This demo supports outflow comparison and evidence coverage only. It does not run a live agent or publish findings. Choose a supported question.',
    };
  }
  const months =
    scope.period === 'comparison'
      ? ['2025-01', '2025-02']
      : [scope.period === 'february' ? '2025-02' : '2025-03'];
  const rows =
    scenario === 'empty'
      ? []
      : ROWS.filter(
          (row) =>
            (scope.account === 'all' || row.account === scope.account) &&
            months.includes(row.date.slice(0, 7)),
        ).map((row) => ({
          ...row,
          sourceAvailable:
            scenario !== 'missing' &&
            (row.sourceAvailable || scope.snapshot === 'demo-v2'),
        }));
  if (!rows.length)
    return {
      ...result,
      status: 'empty',
      answer:
        'No synthetic records match this scope. This is an empty demo result, not evidence of zero real activity.',
    };
  const groups = months.map((month) => {
    const selected = rows.filter((row) => row.date.startsWith(month));
    return {
      month,
      label: month === '2025-01' ? 'January' : 'February',
      outflowMinor: total(selected),
      available: selected.filter((row) => row.sourceAvailable).length,
      count: selected.length,
    };
  });
  const missing = rows.filter((row) => !row.sourceAvailable).length;
  const answer =
    question === DEMO_QUESTIONS[1]
      ? String(missing) +
        ' of ' +
        String(rows.length) +
        ' demo records lack source excerpts. Select a period to inspect its evidence gaps; even available excerpts do not establish statement reconciliation.'
      : groups.length === 2
        ? 'Synthetic outflows moved from ' +
          demoMoney(groups[0].outflowMinor) +
          ' in January to ' +
          demoMoney(groups[1].outflowMinor) +
          ' in February (' +
          demoMoney(
            (
              minor(groups[1].outflowMinor) - minor(groups[0].outflowMinor)
            ).toString(),
          ) +
          ' change). This is an observation, not a profit or causal conclusion.'
        : 'Synthetic outflows in this selected period are ' +
          demoMoney(total(rows)) +
          '. Only one period is selected; no period-to-period change is claimed.';
  return { ...result, answer, rows, groups };
}

export type DemoState = {
  requestId: number;
  scope: DemoScope;
  question: string;
  scenario: DemoScenario;
  loading: boolean;
  staleAnswer: string | null;
  result: DemoResult | null;
  selectedMonth: string | null;
  selectedRow: string | null;
};
export const initialDemoState: DemoState = {
  requestId: 0,
  scope: initialDemoScope,
  question: DEMO_QUESTIONS[0],
  scenario: 'normal',
  loading: false,
  staleAnswer: null,
  result: null,
  selectedMonth: null,
  selectedRow: null,
};
export type DemoAction =
  | {
      type: 'request';
      id: number;
      scope: DemoScope;
      question: string;
      scenario: DemoScenario;
    }
  | { type: 'resolved'; id: number; result: DemoResult }
  | { type: 'month'; month: string | null }
  | { type: 'row'; id: string | null };

export const visibleDemoRows = (state: DemoState): DemoRow[] =>
  state.loading || state.result?.status !== 'ready'
    ? []
    : state.result.rows.filter(
        (row) =>
          !state.selectedMonth || row.date.startsWith(state.selectedMonth),
      );

export function reduceDemo(state: DemoState, action: DemoAction): DemoState {
  if (action.type === 'request') {
    if (action.id <= state.requestId) return state;
    return {
      ...initialDemoState,
      requestId: action.id,
      scope: { ...action.scope },
      question: action.question,
      scenario: action.scenario,
      loading: true,
      staleAnswer: state.result?.answer ?? state.staleAnswer,
    };
  }
  if (action.type === 'resolved') {
    if (
      action.id !== state.requestId ||
      action.result.key !==
        demoScopeKey(state.scope, state.question, state.scenario)
    )
      return state;
    return {
      ...state,
      loading: false,
      staleAnswer: null,
      result: action.result,
    };
  }
  if (state.loading || state.result?.status !== 'ready') return state;
  if (action.type === 'month') {
    if (
      action.month !== null &&
      !state.result.groups.some((group) => group.month === action.month)
    )
      return state;
    return { ...state, selectedMonth: action.month, selectedRow: null };
  }
  if (
    action.id !== null &&
    !visibleDemoRows(state).some((row) => row.id === action.id)
  )
    return state;
  return { ...state, selectedRow: action.id };
}

export function demoTrace(state: DemoState) {
  const row = visibleDemoRows(state).find(
    (candidate) => candidate.id === state.selectedRow,
  );
  if (!row) return null;
  return {
    row,
    snapshot: state.scope.snapshot,
    artifact: state.scope.snapshot + '-invented-transactions.csv',
    locator: 'CSV row ' + String(row.sourceLine),
    raw: row.sourceAvailable
      ? [
          row.id,
          row.account,
          row.date,
          row.description,
          row.outflowMinor,
          'USD',
          'SYNTHETIC_EXCLUDED',
        ].join(',')
      : null,
  };
}

export const selectedDemoTotal = (state: DemoState) =>
  total(visibleDemoRows(state));
