import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_MINOR,
  legacyCents,
  moneyCsv,
  readMoneyCsv,
  sourceMoney,
  sumMoney,
} from '../src/domain/money.js';
import {
  buildSnapshot,
  canonical,
  retainOrReplace,
  scenario,
} from '../src/domain/contracts.js';
import { observeDecision, buildFinanceEvidenceShadowEnvelope } from '../src/domain/decision-shadow.js';
import { goldenContract } from './golden-contract.js';

const build = () => {
  const f = goldenContract();
  return buildSnapshot(f.manifest, f.observations, f.selection);
};

test('money preserves exact decimal strings and rejects ambiguity', () => {
  const value = sourceMoney('90071992547409.93', 'USD', 'INFLOW_POSITIVE');
  assert.equal(value.minor, '9007199254740993');
  assert.deepEqual(readMoneyCsv(moneyCsv(value)), value);
  assert.equal(sumMoney([value, sourceMoney('0.07', 'USD', 'INFLOW_POSITIVE')], 'USD').minor, '9007199254741000');
  assert.equal(sourceMoney('1.001', 'KWD', 'OUTFLOW_POSITIVE').minor, '-1001');
  assert.equal(sourceMoney('1', 'JPY', 'INFLOW_POSITIVE').minor, '1');
  for (const args of [['1.001', 'USD', 'INFLOW_POSITIVE'], ['1.0', 'JPY', 'INFLOW_POSITIVE'], ['1', '$', 'INFLOW_POSITIVE'], ['1', 'USD', 'UNKNOWN'], ['1e2', 'USD', 'INFLOW_POSITIVE'], ['01', 'USD', 'INFLOW_POSITIVE'], [0.1, 'USD', 'INFLOW_POSITIVE']]) assert.throws(() => sourceMoney(...args));
  assert.throws(() => sumMoney([{ currency: 'USD', minor: MAX_MINOR.toString() }, { currency: 'USD', minor: '1' }], 'USD'), /overflow/i);
  assert.throws(() => sumMoney([{ currency: 'THB', minor: '1' }], 'USD'), /Mixed/);
  assert.throws(() => legacyCents(Number.MAX_SAFE_INTEGER + 1, 'USD'));
  assert.throws(() => readMoneyCsv('currency,minor\nUSD,1.1\n'));
});

test('golden snapshot preserves totals, exclusions, and immutable values', () => {
  const baseline = build();
  assert.equal(baseline.metrics.observed_bank_inflows.minor, '9007199254741688');
  assert.equal(baseline.metrics.observed_bank_outflows.minor, '2524');
  assert.equal(baseline.metrics.bank_cash_change.minor, '9007199254739164');
  assert.equal(baseline.metrics.recognized_revenue.minor, '10');
  assert.equal(baseline.metrics.business_expense.minor, '3');
  assert.ok(baseline.metrics.unresolved.includes('large@1'));
  assert.ok(baseline.eligible.includes('correction@2'));
  assert.equal(baseline.excluded.filter((row) => row.reason === 'DUPLICATE_ACQUISITION').length, 19);
  assert.throws(() => { baseline.observations[0].sourceAmount = '0'; });
  assert.throws(() => baseline.eligible.push('invented'));
});

test('snapshot rejects unavailable acquisition and invalid dates', () => {
  for (const retrieval of ['PARTIAL', 'FAILED', 'UNKNOWN']) {
    const prior = build();
    const f = goldenContract();
    f.manifest.acquisition.retrieval = retrieval;
    const result = retainOrReplace(prior, f.manifest, f.observations, f.selection);
    assert.equal(result.status, 'REJECTED');
    assert.equal(result.snapshot, prior);
  }
  for (const value of ['2026-02-30', '01/10/26', '2026-01', '2026-01-10T00:00:00Z']) {
    const f = goldenContract();
    f.observations[0].date = { precision: 'DATE', value };
    assert.throws(() => buildSnapshot(f.manifest, f.observations, f.selection));
  }
});

test('snapshot rejects conflicting identity and keeps scenarios separate', () => {
  const f = goldenContract();
  f.observations.at(-1).sourceAmount = '99.99';
  assert.throws(() => buildSnapshot(f.manifest, f.observations, f.selection), /Conflicting observation/);
  const baseline = build();
  const result = scenario(baseline, [{ evidenceRef: 'synthetic-assumption', delta: { currency: 'USD', minor: '10' } }]);
  assert.equal(result.kind, 'SCENARIO');
  assert.equal(result.findingStatus, 'UNREVIEWED_HYPOTHESIS');
  assert.notEqual(result.scenarioHash, baseline.snapshotHash);
  assert.throws(() => scenario(JSON.parse(canonical(baseline)), []), /verified baseline/);
});

test('shadow decisions remain observation-only and fail closed', async () => {
  const envelope = buildFinanceEvidenceShadowEnvelope({ requestId: 'synthetic-request-1', summary: 'synthetic evidence' });
  const unavailable = await observeDecision({ envelope, baseline: { route: 'ready' }, decide: async () => { throw new Error('unavailable'); }, compare: () => true });
  assert.deepEqual(unavailable, { applied: false, baseline: { route: 'ready' }, receipt: null, agrees: null, status: 'unavailable' });
  const observed = await observeDecision({ envelope, baseline: { route: 'ready' }, decide: async () => ({ receiptVersion: 'synthetic/v1', requestId: envelope.requestId, schemaVersion: envelope.schemaVersion, mode: 'shadow', inputHash: 'synthetic-hash', decisions: { route: 'ready' }, confidence: 1, latencyMs: 1, fallback: null, timestamp: '2026-01-01T00:00:00Z' }), compare: (baseline, receipt) => baseline.route === receipt.decisions.route });
  assert.equal(observed.status, 'observed');
  assert.equal(observed.agrees, true);
});

test('canonical JSON is deterministic and rejects non-contract values', () => {
  assert.equal(canonical({ b: 2, a: 1 }), canonical({ a: 1, b: 2 }));
  for (const value of [undefined, NaN, Infinity, 0.1, -0, 1n, new Date(), { bad: undefined }, Array(2)]) assert.throws(() => canonical(value));
});
