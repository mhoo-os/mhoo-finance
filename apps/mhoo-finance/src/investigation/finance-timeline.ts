import type { DemoRow, DemoScope } from './question-prototype';

type CashDirection = 'in' | 'out' | 'unknown';

export type TimelineRow = DemoRow & {
  amountMinor: string;
  direction: CashDirection;
  inflowMinor: string;
  illustrativeHistory?: true;
};

// Explicitly invented interaction history. These rows remain separate from the
// seven demo-v1 source-backed fixture rows.
const ILLUSTRATIVE_HISTORY_SOURCE: readonly [
  string,
  string,
  string,
  DemoRow['account'],
  CashDirection,
  string,
][] = [
  [
    's13',
    '2025-01-12',
    'Illustrative customer receipt',
    'operating',
    'in',
    '100000',
  ],
  [
    's14',
    '2025-02-15',
    'Illustrative customer receipt',
    'operating',
    'in',
    '120000',
  ],
  [
    's1',
    '2025-03-07',
    'Illustrative supplier payment',
    'operating',
    'out',
    '61000',
  ],
  [
    's15',
    '2025-03-12',
    'Illustrative customer receipt',
    'operating',
    'in',
    '90000',
  ],
  ['s2', '2025-03-21', 'Illustrative maintenance', 'reserve', 'out', '23000'],
  [
    's3',
    '2025-04-09',
    'Illustrative supplier payment',
    'operating',
    'out',
    '45000',
  ],
  [
    's16',
    '2025-04-15',
    'Illustrative customer receipt',
    'operating',
    'in',
    '85000',
  ],
  [
    's19',
    '2025-04-16',
    'Illustrative unresolved account movement',
    'operating',
    'unknown',
    '9000',
  ],
  ['s4', '2025-04-24', 'Illustrative maintenance', 'reserve', 'out', '31000'],
  [
    's5',
    '2025-05-06',
    'Illustrative supplier payment',
    'operating',
    'out',
    '78000',
  ],
  [
    's20',
    '2025-05-14',
    'Illustrative transfer to reserve',
    'operating',
    'out',
    '12500',
  ],
  [
    's21',
    '2025-05-14',
    'Illustrative transfer from operating',
    'reserve',
    'in',
    '12500',
  ],
  [
    's17',
    '2025-05-18',
    'Illustrative customer receipt',
    'operating',
    'in',
    '105000',
  ],
  ['s6', '2025-05-23', 'Illustrative maintenance', 'reserve', 'out', '16000'],
  [
    's7',
    '2025-06-10',
    'Illustrative supplier payment',
    'operating',
    'out',
    '52000',
  ],
  [
    's18',
    '2025-06-18',
    'Illustrative customer receipt',
    'operating',
    'in',
    '100000',
  ],
  ['s8', '2025-06-25', 'Illustrative maintenance', 'reserve', 'out', '29000'],
  [
    's9',
    '2025-07-08',
    'Illustrative supplier payment',
    'operating',
    'out',
    '66000',
  ],
  ['s10', '2025-07-23', 'Illustrative maintenance', 'reserve', 'out', '19000'],
  [
    's11',
    '2025-08-11',
    'Illustrative supplier payment',
    'operating',
    'out',
    '43000',
  ],
  ['s12', '2025-08-22', 'Illustrative maintenance', 'reserve', 'out', '26000'],
];

export const ILLUSTRATIVE_HISTORY: readonly TimelineRow[] =
  ILLUSTRATIVE_HISTORY_SOURCE.map(
    ([id, date, description, account, direction, amountMinor], index) => ({
      id,
      date,
      description,
      account,
      amountMinor,
      direction,
      inflowMinor: direction === 'in' ? amountMinor : '0',
      outflowMinor: direction === 'out' ? amountMinor : '0',
      sourceLine: 9 + index,
      sourceAvailable: false,
      includedInRealTotals: false,
      illustrativeHistory: true,
    }),
  );

const asOutgoingTimelineRow = (row: DemoRow): TimelineRow => ({
  ...row,
  amountMinor: row.outflowMinor,
  direction: 'out',
  inflowMinor: '0',
});

export const financeTimelineRows = (
  sourceRows: readonly DemoRow[],
  rangeStart: string,
  rangeEnd: string,
  account: DemoScope['account'],
): TimelineRow[] =>
  [...sourceRows.map(asOutgoingTimelineRow), ...ILLUSTRATIVE_HISTORY]
    .filter(
      (row) =>
        row.date >= rangeStart &&
        row.date <= rangeEnd &&
        (account === 'all' || row.account === account),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

export const summarizeFinanceTimeline = (rows: readonly TimelineRow[]) => ({
  moneyInMinor: rows
    .reduce((sum, row) => sum + BigInt(row.inflowMinor), 0n)
    .toString(),
  moneyOutMinor: rows
    .reduce((sum, row) => sum + BigInt(row.outflowMinor), 0n)
    .toString(),
  unknownCount: rows.filter((row) => row.direction === 'unknown').length,
});
