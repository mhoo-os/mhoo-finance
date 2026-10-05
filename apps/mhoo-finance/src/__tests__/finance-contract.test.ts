import { describe, expect, it } from 'vitest';

import {
  MAX_MINOR,
  formatMoney,
  legacyCents,
  moneyCsv,
  readMoneyCsv,
  sourceMoney,
  sumMoney,
} from '../contracts/money';
import {
  buildSnapshot,
  canonical,
  retainOrReplace,
  scenario,
} from '../contracts/finance-contract';
import { goldenContract } from '../fixtures/contract-golden';

const build = () => {
  const f = goldenContract();
  return buildSnapshot(f.manifest, f.observations, f.selection);
};

describe('Exact transport money', () => {
  it('preserves unsafe-in-Number cents through JSON, CSV and arithmetic', () => {
    const value = sourceMoney('90071992547409.93', 'USD', 'INFLOW_POSITIVE');
    expect(value.minor).toBe('9007199254740993');
    expect(JSON.parse(JSON.stringify(value))).toEqual(value);
    expect(readMoneyCsv(moneyCsv(value))).toEqual(value);
    expect(
      sumMoney([value, sourceMoney('0.07', 'USD', 'INFLOW_POSITIVE')], 'USD')
        .minor,
    ).toBe('9007199254741000');
    expect(sourceMoney('1.001', 'KWD', 'OUTFLOW_POSITIVE').minor).toBe('-1001');
    expect(sourceMoney('1', 'JPY', 'INFLOW_POSITIVE').minor).toBe('1');
    expect(sourceMoney('0.00', 'USD', 'OUTFLOW_POSITIVE').minor).toBe('0');
    expect(formatMoney({ currency: 'USD', minor: '9007199254740993' })).toBe(
      'USD 90,071,992,547,409.93',
    );
    expect(formatMoney({ currency: 'JPY', minor: '-1200' })).toBe('-JPY 1,200');
  });
  it.each([
    ['1.001', 'USD', 'INFLOW_POSITIVE'],
    ['1.0', 'JPY', 'INFLOW_POSITIVE'],
    ['1', '$', 'INFLOW_POSITIVE'],
    ['1', 'usd', 'INFLOW_POSITIVE'],
    ['1', 'USD', 'UNKNOWN'],
    ['1,000', 'USD', 'INFLOW_POSITIVE'],
    ['1e2', 'USD', 'INFLOW_POSITIVE'],
    [' 1', 'USD', 'INFLOW_POSITIVE'],
    ['01', 'USD', 'INFLOW_POSITIVE'],
    [0.1, 'USD', 'INFLOW_POSITIVE'],
    ['92233720368547758.08', 'USD', 'INFLOW_POSITIVE'],
  ])('rejects unsupported/ambiguous source %s %s %s', (amount, unit, sign) => {
    expect(() => sourceMoney(amount, unit, sign)).toThrow();
  });
  it('rejects overflow, currency mixing and unsafe legacy adaptation', () => {
    expect(() =>
      sumMoney(
        [
          { currency: 'USD', minor: MAX_MINOR.toString() },
          { currency: 'USD', minor: '1' },
        ],
        'USD',
      ),
    ).toThrow('overflow');
    expect(() => sumMoney([{ currency: 'THB', minor: '1' }], 'USD')).toThrow(
      'Mixed',
    );
    expect(() => legacyCents(Number.MAX_SAFE_INTEGER + 1, 'USD')).toThrow();
    expect(legacyCents(123, 'USD').minor).toBe('123');
    expect(() => readMoneyCsv('currency,minor\nUSD,1.1\n')).toThrow();
  });
});

describe('Snapshot and dataset source contract', () => {
  it('replays exact golden totals and immutable source lineage', () => {
    const baseline = build(),
      replay = build();
    expect(replay).toEqual(baseline);
    expect(baseline.metrics.observed_bank_inflows.minor).toBe(
      '9007199254741688',
    );
    expect(baseline.metrics.observed_bank_outflows.minor).toBe('2524');
    expect(baseline.metrics.bank_cash_change.minor).toBe('9007199254739164');
    expect(baseline.metrics.recognized_revenue.minor).toBe('10');
    expect(baseline.metrics.business_expense.minor).toBe('3');
    expect(baseline.metrics.unresolved).toContain('large@1');
    expect(baseline.eligible).toContain('repeat-a@1');
    expect(baseline.eligible).toContain('repeat-b@1');
    expect(baseline.eligible).toContain('correction@2');
    expect(baseline.eligible).toContain('pending@2');
    expect(baseline.eligible).not.toContain('card-pay-card@1');
    expect(baseline.eligible.some((key) => key.startsWith('removed@'))).toBe(
      false,
    );
    expect(
      baseline.excluded.filter((row) => row.reason === 'DUPLICATE_ACQUISITION'),
    ).toHaveLength(19);
    expect(baseline.observations[0].date).toEqual({
      precision: 'DATE',
      value: '2026-01-10',
    });
    expect(() => {
      baseline.observations[0].sourceAmount = '0';
    }).toThrow();
    expect(() => baseline.eligible.push('invented')).toThrow();
  });
  it('detaches inputs and hashes changed revisions and manifest conventions', () => {
    const f = goldenContract(),
      baseline = buildSnapshot(f.manifest, f.observations, f.selection);
    f.observations[0].description = 'Changed caller object';
    expect(
      baseline.observations.some(
        (row) => row.description === 'Changed caller object',
      ),
    ).toBe(false);
    const next = goldenContract();
    next.manifest.conventions.transformation = 'golden/v2';
    const changed = buildSnapshot(
      next.manifest,
      next.observations,
      next.selection,
    );
    expect(changed.factsHash).toBe(baseline.factsHash);
    expect(changed.manifestHash).not.toBe(baseline.manifestHash);
    expect(changed.snapshotHash).not.toBe(baseline.snapshotHash);
    next.observations
      .filter((row) => row.factKey === 'correction' && row.revision === 2)
      .forEach((row) => {
        row.sourceAmount = '-10.02';
      });
    expect(
      buildSnapshot(next.manifest, next.observations, next.selection).factsHash,
    ).not.toBe(baseline.factsHash);
  });
  it.each(['PARTIAL', 'FAILED', 'UNKNOWN'] as const)(
    'preserves prior snapshot on %s retrieval',
    (retrieval) => {
      const prior = build(),
        f = goldenContract();
      f.manifest.acquisition.retrieval = retrieval;
      const result = retainOrReplace(
        prior,
        f.manifest,
        f.observations,
        f.selection,
      );
      expect(result.status).toBe('REJECTED');
      expect(result.snapshot).toBe(prior);
    },
  );
  it('rejects unproved pagination, source controls, truncation, rejects and derived exports', () => {
    for (const patch of [
      { pagination: 'UNKNOWN' },
      { sourceControls: 'UNKNOWN' },
      { truncated: true },
      { rejectedRows: 1 },
      { class: 'DERIVED_TOOL_EXPORT' },
    ]) {
      const f = goldenContract();
      Object.assign(f.manifest.acquisition, patch);
      if (patch.class) f.manifest.sensitivity = 'CONFIDENTIAL';
      expect(
        retainOrReplace(null, f.manifest, f.observations, f.selection).status,
      ).toBe('REJECTED');
    }
  });
  it('distinguishes missing periods from evidenced zero activity', () => {
    const f = goldenContract();
    f.selection.bankAccounts = ['synthetic-zero-bank'];
    expect(
      buildSnapshot(f.manifest, f.observations, f.selection).metrics
        .bank_cash_change.minor,
    ).toBe('0');
    f.selection.bankAccounts = ['synthetic-missing-bank'];
    expect(() =>
      buildSnapshot(f.manifest, f.observations, f.selection),
    ).toThrow('Missing selected coverage');
    f.manifest.coverage[0].state = 'NO_ACTIVITY';
    f.selection.bankAccounts = ['synthetic-bank-a'];
    expect(() =>
      buildSnapshot(f.manifest, f.observations, f.selection),
    ).toThrow('False zero');
  });
  it('rejects date ambiguity without synthesizing timestamps', () => {
    for (const value of [
      '2026-02-30',
      '01/10/26',
      '2026-01',
      '2026-01-10T00:00:00Z',
    ]) {
      const f = goldenContract();
      f.observations[0].date = { precision: 'DATE', value };
      expect(() =>
        buildSnapshot(f.manifest, f.observations, f.selection),
      ).toThrow();
    }
  });
  it('rejects conflicting duplicate observations and identity laundering', () => {
    const f = goldenContract();
    f.observations[f.observations.length - 1].sourceAmount = '99.99';
    expect(() =>
      buildSnapshot(f.manifest, f.observations, f.selection),
    ).toThrow('Conflicting observation');
    const g = goldenContract();
    g.observations
      .filter((row) => row.factKey === 'repeat-b')
      .forEach((row) => {
        row.sourceEventKey = 'synthetic-repeat-a';
      });
    expect(() =>
      buildSnapshot(g.manifest, g.observations, g.selection),
    ).toThrow('multiple facts');
  });
  it('keeps deliberate reconciliation mismatches visible as rejection', () => {
    const f = goldenContract();
    f.observations
      .filter((row) => row.factKey === 'card-pay-card')
      .forEach((row) => {
        row.sourceAmount = '5.99';
      });
    const result = retainOrReplace(
      build(),
      f.manifest,
      f.observations,
      f.selection,
    );
    expect(result).toMatchObject({
      status: 'REJECTED',
      reason: 'Pair reconciliation mismatch',
    });
  });
  it('does not infer economic classification from a category', () => {
    const f = goldenContract();
    f.observations
      .filter((row) => row.factKey === 'large')
      .forEach((row) => {
        row.originalCategory = 'Sales Revenue';
      });
    expect(
      buildSnapshot(f.manifest, f.observations, f.selection).metrics
        .recognized_revenue.minor,
    ).toBe('10');
    f.observations[0].classification = 'REVENUE';
    expect(() =>
      buildSnapshot(f.manifest, f.observations, f.selection),
    ).toThrow('requires procedure');
  });
  it('gives scenarios a separate identity and refuses forged prior snapshots', () => {
    const baseline = build(),
      before = canonical(baseline);
    const result = scenario(baseline, [
      {
        evidenceRef: 'synthetic-assumption',
        delta: { currency: 'USD', minor: '10' },
      },
    ]);
    expect(result.kind).toBe('SCENARIO');
    expect(result.findingStatus).toBe('UNREVIEWED_HYPOTHESIS');
    expect(result.scenarioHash).not.toBe(baseline.snapshotHash);
    expect(result.hypothetical_bank_cash_change.minor).toBe('9007199254739174');
    expect(canonical(baseline)).toBe(before);
    expect(() => scenario(JSON.parse(before), [])).toThrow('verified baseline');
    const f = goldenContract();
    expect(() =>
      retainOrReplace(
        JSON.parse(before),
        f.manifest,
        f.observations,
        f.selection,
      ),
    ).toThrow('verified');
  });
  it('pins the reviewed golden hashes', () => {
    const { factsHash, manifestHash, snapshotHash } = build();
    expect({ factsHash, manifestHash, snapshotHash }).toMatchInlineSnapshot(`
      {
        "factsHash": "796afd1d0e07fea2555937168080e6fed10c9c058dfa298450e96df73f6f1c3f",
        "manifestHash": "7303df4ecd6e82a7403670461ee5302221c698b78d7b65e3b101d0f969017fb5",
        "snapshotHash": "bb8e2417684aea24942cc6b409207bd5ba5b9816583725e1406f8dca6c5554d8",
      }
    `);
  });
  it('does not replace an immutable prior revision with rewritten history', () => {
    const prior = build(),
      f = goldenContract();
    f.observations
      .filter((row) => row.factKey === 'correction' && row.revision === 2)
      .forEach((row) => {
        row.sourceAmount = '-10.02';
      });
    const result = retainOrReplace(
      prior,
      f.manifest,
      f.observations,
      f.selection,
    );
    expect(result).toMatchObject({
      status: 'REJECTED',
      reason: 'Prior observation revision changed or disappeared',
    });
    expect(result.snapshot).toBe(prior);
    const fresh = goldenContract();
    expect(
      retainOrReplace(
        prior,
        fresh.manifest,
        fresh.observations,
        fresh.selection,
      ).status,
    ).toBe('VERIFIED');
  });
  it('accepts an append-only correction while preserving the old snapshot', () => {
    const previous = build(),
      f = goldenContract();
    const old = f.observations.find(
      (row) => row.factKey === 'correction' && row.revision === 2,
    )!;
    f.observations.push({
      ...old,
      revision: 3,
      sourceAmount: '-10.02',
      artifactId: 'synthetic-correction-v3',
      sourceRowKey: 'synthetic-correction-v3-row',
    });
    f.manifest.artifacts.push({
      artifactId: 'synthetic-correction-v3',
      receiptId: 'synthetic-receipt-v3',
      locator: 'synthetic://correction-v3',
      sha256: 'a'.repeat(64),
      rowCount: 1,
      duplicateOf: null,
    });
    f.manifest.acquisition.retrievedRows += 1;
    const result = retainOrReplace(
      previous,
      f.manifest,
      f.observations,
      f.selection,
    );
    expect(result.status).toBe('VERIFIED');
    expect(result.snapshot!.eligible).toContain('correction@3');
    expect(result.snapshot!.eligible).not.toContain('correction@2');
    expect(previous.eligible).toContain('correction@2');
    expect(result.snapshot!.metrics.bank_cash_change.minor).toBe(
      '9007199254739163',
    );
  });
  it('rejects missing revision history and inaccurate observed bounds', () => {
    const f = goldenContract();
    f.observations
      .filter((row) => row.factKey === 'correction' && row.revision === 2)
      .forEach((row) => {
        row.revision = 3;
      });
    expect(() =>
      buildSnapshot(f.manifest, f.observations, f.selection),
    ).toThrow('Missing observation revision');
    const g = goldenContract();
    g.manifest.acquisition.observedPeriod!.from = '2026-01-01';
    expect(() =>
      buildSnapshot(g.manifest, g.observations, g.selection),
    ).toThrow('Observed period');
  });
  it('rejects noncanonical JSON values', () => {
    for (const value of [
      undefined,
      NaN,
      Infinity,
      0.1,
      -0,
      1n,
      new Date(),
      { bad: undefined },
      Array(2),
    ])
      expect(() => canonical(value)).toThrow();
    expect(canonical({ b: 2, a: 1 })).toBe(canonical({ a: 1, b: 2 }));
  });
});
