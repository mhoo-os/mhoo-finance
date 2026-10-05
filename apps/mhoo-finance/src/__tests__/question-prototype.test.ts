import { describe, expect, it } from 'vitest';
import {
  DEMO_ATTENTION_ITEMS,
  DEMO_FORECAST_ASSUMPTIONS,
  DEMO_QUESTIONS,
  DEMO_RECONCILIATION_ITEMS,
  DEMO_SOURCE_LANES,
  demoReviewContextKey,
  demoTrace,
  initialDemoScope,
  initialDemoState,
  reduceDemo,
  resolveDemoQuestion,
  selectedDemoTotal,
  visibleDemoAttentionItems,
  visibleDemoRows,
} from '../investigation/question-prototype';

const ready = () =>
  reduceDemo(
    reduceDemo(initialDemoState, {
      type: 'request',
      id: 1,
      scope: initialDemoScope,
      question: DEMO_QUESTIONS[0],
      scenario: 'normal',
    }),
    {
      type: 'resolved',
      id: 1,
      result: resolveDemoQuestion(
        initialDemoScope,
        DEMO_QUESTIONS[0],
        'normal',
      ),
    },
  );

describe('synthetic question-to-evidence exploration', () => {
  it('starts with bounded attention queues instead of unsupported risk scores', () => {
    expect(DEMO_ATTENTION_ITEMS.map((item) => item.id)).toEqual([
      'missing-evidence',
      'unmatched-money',
      'contradictory-sources',
      'human-review',
    ]);
    expect(DEMO_ATTENTION_ITEMS.every((item) => item.contributingRowId)).toBe(
      true,
    );
    expect(
      DEMO_ATTENTION_ITEMS.some((item) => item.status === 'HUMAN_REVIEW'),
    ).toBe(true);
  });

  it('fails the attention queue closed and scopes every item to a visible contributor', () => {
    const normal = resolveDemoQuestion(
      initialDemoScope,
      DEMO_QUESTIONS[0],
      'normal',
    );
    const denied = resolveDemoQuestion(
      initialDemoScope,
      DEMO_QUESTIONS[0],
      'denied',
    );
    const v2 = resolveDemoQuestion(
      { ...initialDemoScope, snapshot: 'demo-v2' },
      DEMO_QUESTIONS[0],
      'normal',
    );
    expect(visibleDemoAttentionItems(null, [])).toEqual([]);
    expect(visibleDemoAttentionItems(denied, denied.rows)).toEqual([]);
    expect(
      visibleDemoAttentionItems(normal, normal.rows).map((item) => item.id),
    ).toEqual([
      'missing-evidence',
      'unmatched-money',
      'contradictory-sources',
      'human-review',
    ]);
    expect(
      visibleDemoAttentionItems(v2, v2.rows).map((item) => item.id),
    ).not.toContain('missing-evidence');
    expect(visibleDemoAttentionItems(normal, [normal.rows[0]])).toEqual([]);
  });

  it('separates review decisions for two attention reasons on the same row', () => {
    expect(demoReviewContextKey('missing-evidence', 'd6', 'demo-v1')).not.toBe(
      demoReviewContextKey('unmatched-money', 'd6', 'demo-v1'),
    );
  });

  it('keeps source periods, bases and provenance separate', () => {
    expect(DEMO_SOURCE_LANES.map((source) => source.id)).toEqual([
      'tax',
      'bank',
      'clover',
      'email',
    ]);
    expect(
      DEMO_SOURCE_LANES.every(
        (source) => source.period && source.basis && source.provenance,
      ),
    ).toBe(true);
    expect(
      DEMO_SOURCE_LANES.find((source) => source.id === 'clover'),
    ).toMatchObject({ status: 'NOT_CONNECTED' });
    expect(
      DEMO_SOURCE_LANES.find((source) => source.id === 'email')?.limitation,
    ).toContain('not a complete');
  });

  it('keeps duplicates, transfers, settlements and uncertain invoices explicit', () => {
    expect(DEMO_RECONCILIATION_ITEMS.map((item) => item.id)).toEqual([
      'duplicate-export',
      'internal-transfer',
      'clover-settlement',
      'invoice-payment',
    ]);
    expect(
      DEMO_RECONCILIATION_ITEMS.find((item) => item.id === 'clover-settlement')
        ?.treatment,
    ).toContain('gross sales, refunds and processor fees');
    expect(
      DEMO_RECONCILIATION_ITEMS.find((item) => item.id === 'invoice-payment')
        ?.status,
    ).toBe('HUMAN_REVIEW');
  });

  it('withholds forecast output until reviewed actuals and assumptions exist', () => {
    expect(DEMO_FORECAST_ASSUMPTIONS).toHaveLength(4);
    expect(DEMO_FORECAST_ASSUMPTIONS[0][1]).toContain('Requires reviewed');
  });

  it('uses exact shared money logic and one population for both questions', () => {
    const outflow = resolveDemoQuestion(
      initialDemoScope,
      DEMO_QUESTIONS[0],
      'normal',
    );
    const coverage = resolveDemoQuestion(
      initialDemoScope,
      DEMO_QUESTIONS[1],
      'normal',
    );
    expect(outflow.groups.map((group) => group.outflowMinor)).toEqual([
      '75000',
      '140000',
    ]);
    expect(outflow.answer).toContain('$650.00 change');
    expect(coverage.rows).toEqual(outflow.rows);
    expect(
      coverage.groups.map((group) => [group.available, group.count]),
    ).toEqual([
      [3, 3],
      [3, 4],
    ]);
    expect(
      outflow.rows.every((row) => row.includedInRealTotals === false),
    ).toBe(true);
  });

  it('drills from chart to exactly its transactions and matching source row', () => {
    let state = reduceDemo(ready(), { type: 'month', month: '2025-02' });
    expect(visibleDemoRows(state).map((row) => row.id)).toEqual([
      'd4',
      'd5',
      'd6',
      'd7',
    ]);
    expect(selectedDemoTotal(state)).toBe('140000');
    state = reduceDemo(state, { type: 'row', id: 'd4' });
    expect(demoTrace(state)).toMatchObject({
      locator: 'CSV row 5',
      snapshot: 'demo-v1',
      raw: 'd4,operating,2025-02-05,Demo Clover settlement candidate,56000,USD,SYNTHETIC_EXCLUDED',
    });
    expect(reduceDemo(state, { type: 'row', id: 'd1' })).toBe(state);
    state = reduceDemo(state, { type: 'month', month: '2025-01' });
    expect(demoTrace(state)).toBeNull();
    expect(selectedDemoTotal(state)).toBe('75000');
  });

  it('keeps missing excerpts absent and never invents original Files', () => {
    const state = reduceDemo(ready(), { type: 'row', id: 'd6' });
    expect(demoTrace(state)).toMatchObject({ locator: 'CSV row 7', raw: null });
    const result = resolveDemoQuestion(
      initialDemoScope,
      DEMO_QUESTIONS[0],
      'missing',
    );
    expect(result.rows.every((row) => !row.sourceAvailable)).toBe(true);
    expect(result.limitation).toContain('not original files');
  });

  it('filters accounts and periods before deriving chart and evidence data', () => {
    const result = resolveDemoQuestion(
      { ...initialDemoScope, account: 'reserve', period: 'february' },
      DEMO_QUESTIONS[0],
      'normal',
    );
    expect(result.rows.map((row) => row.id)).toEqual(['d7']);
    expect(result.groups[0].outflowMinor).toBe('20000');
    expect(result.answer).toContain('no period-to-period change');
  });

  it('keeps snapshot content consistent without changing financial facts', () => {
    const first = resolveDemoQuestion(
      initialDemoScope,
      DEMO_QUESTIONS[1],
      'normal',
    );
    const second = resolveDemoQuestion(
      { ...initialDemoScope, snapshot: 'demo-v2' },
      DEMO_QUESTIONS[1],
      'normal',
    );
    expect(second.rows.every((row) => row.sourceAvailable)).toBe(true);
    expect(second.groups.map((group) => group.outflowMinor)).toEqual(
      first.groups.map((group) => group.outflowMinor),
    );
    expect(first.rows.find((row) => row.id === 'd6')?.sourceAvailable).toBe(
      false,
    );
  });

  it.each(['denied', 'failed', 'empty'] as const)(
    'returns no records/trace for %s and clears prior selections',
    (scenario) => {
      const selected = reduceDemo(ready(), { type: 'row', id: 'd4' });
      const loading = reduceDemo(selected, {
        type: 'request',
        id: 2,
        scope: initialDemoScope,
        question: DEMO_QUESTIONS[0],
        scenario,
      });
      expect(visibleDemoRows(loading)).toEqual([]);
      expect(demoTrace(loading)).toBeNull();
      expect(loading.staleAnswer).toBeTruthy();
      const state = reduceDemo(loading, {
        type: 'resolved',
        id: 2,
        result: resolveDemoQuestion(
          initialDemoScope,
          DEMO_QUESTIONS[0],
          scenario,
        ),
      });
      expect(state.result?.status).toBe(scenario);
      expect(visibleDemoRows(state)).toEqual([]);
      expect(demoTrace(state)).toBeNull();
      expect(state.staleAnswer).toBeNull();
    },
  );

  it('distinguishes an empty real-world claim from an empty fixture period', () => {
    const result = resolveDemoQuestion(
      { ...initialDemoScope, period: 'march' },
      DEMO_QUESTIONS[0],
      'normal',
    );
    expect(result.status).toBe('empty');
    expect(result.answer).toContain('not evidence of zero real activity');
  });

  it('rejects late and mismatched results after scope/snapshot changes', () => {
    const scope = {
      ...initialDemoScope,
      account: 'reserve' as const,
      snapshot: 'demo-v2' as const,
    };
    let state = reduceDemo(ready(), {
      type: 'request',
      id: 2,
      scope,
      question: DEMO_QUESTIONS[1],
      scenario: 'normal',
    });
    const old = resolveDemoQuestion(
      initialDemoScope,
      DEMO_QUESTIONS[0],
      'slow',
    );
    expect(reduceDemo(state, { type: 'resolved', id: 1, result: old })).toBe(
      state,
    );
    expect(reduceDemo(state, { type: 'resolved', id: 2, result: old })).toBe(
      state,
    );
    state = reduceDemo(state, {
      type: 'resolved',
      id: 2,
      result: resolveDemoQuestion(scope, DEMO_QUESTIONS[1], 'normal'),
    });
    expect(state.result?.scope).toEqual(scope);
    expect(state.selectedRow).toBeNull();
    expect(
      visibleDemoRows(state).every((row) => row.account === 'reserve'),
    ).toBe(true);
  });

  it.each([
    DEMO_QUESTIONS[2],
    DEMO_QUESTIONS[3],
    'Publish a confirmed finding',
    'Run arbitrary analysis',
  ])('refuses unsupported conclusion/action: %s', (question) => {
    const result = resolveDemoQuestion(initialDemoScope, question, 'normal');
    expect(result.status).toBe('refused');
    expect(result.rows).toEqual([]);
    expect(result.groups).toEqual([]);
    expect(result.limitation).toContain('excluded from all real totals');
  });

  it('does not accept out-of-order requests or arbitrary selection IDs', () => {
    const state = ready();
    expect(
      reduceDemo(state, {
        type: 'request',
        id: 1,
        scope: initialDemoScope,
        question: DEMO_QUESTIONS[1],
        scenario: 'normal',
      }),
    ).toBe(state);
    expect(reduceDemo(state, { type: 'month', month: 'unrelated' })).toBe(
      state,
    );
    expect(reduceDemo(state, { type: 'row', id: 'real-record-id' })).toBe(
      state,
    );
  });
});
