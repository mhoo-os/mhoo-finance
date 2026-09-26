import { createHash } from 'node:crypto';

import {
  currency,
  minor,
  sourceMoney,
  sumMoney,
  type Currency,
  type Money,
  type SignConvention,
} from './money';

export type Period = { from: string; to: string };
export type SourceDate = { precision: 'DATE' | 'INSTANT'; value: string };
export type Observation = {
  factKey: string;
  revision: number;
  artifactId: string;
  sourceRowKey: string;
  accountKey: string;
  sourceEventKey: string;
  sourceAmount: string;
  currency: Currency;
  signConvention: SignConvention;
  date: SourceDate;
  description: string;
  originalCategory: string | null;
  status: 'PENDING' | 'POSTED' | 'REMOVED';
  classification:
    | 'UNKNOWN'
    | 'REVENUE'
    | 'BUSINESS_EXPENSE'
    | 'TRANSFER'
    | 'CARD_PAYMENT'
    | 'REFUND'
    | 'REVERSAL'
    | 'OWNER_FLOW';
  classificationEvidence: string[];
};
export type Manifest = {
  version: 'finance-dataset/v1';
  acquisition: {
    class: 'SYNTHETIC' | 'FIRST_PARTY' | 'PROVIDER' | 'DERIVED_TOOL_EXPORT';
    origin: string;
    authorizationRef: string;
    scopeRef: string;
    requestedPeriod: Period;
    observedPeriod: Period | null;
    sourceAsOf: string | null;
    retrieval: 'COMPLETE' | 'PARTIAL' | 'FAILED' | 'UNKNOWN';
    pagination: 'COMPLETE' | 'UNKNOWN';
    sourceControls: 'VERIFIED' | 'UNKNOWN';
    controlEvidence: string[];
    truncated: boolean;
    rejectedRows: number;
    retrievedRows: number;
  };
  artifacts: {
    artifactId: string;
    receiptId: string;
    locator: string;
    sha256: string;
    rowCount: number;
    duplicateOf: string | null;
  }[];
  accounts: {
    accountKey: string;
    type: 'BANK' | 'CARD' | 'POS';
    currency: Currency;
  }[];
  coverage: {
    coverageKey: string;
    accountKey: string;
    period: Period;
    state: 'OBSERVED' | 'NO_ACTIVITY' | 'MISSING';
    evidenceRefs: string[];
  }[];
  links: {
    kind: 'TRANSFER' | 'CARD_PAYMENT' | 'REFUND' | 'REVERSAL';
    left: string;
    right: string;
    evidenceRefs: string[];
  }[];
  conventions: {
    money: 'signed-minor-text/v1';
    dates: 'source-precision/v1';
    metrics: 'bank-movement/v1';
    transformation: string;
  };
  sensitivity: 'SYNTHETIC' | 'CONFIDENTIAL';
  limitations: string[];
};
export type Selection = {
  bankAccounts: string[];
  period: Period;
  currency: Currency;
};
export type Snapshot = {
  version: 'finance-snapshot/v1';
  kind: 'BASELINE';
  snapshotHash: string;
  manifestHash: string;
  factsHash: string;
  manifest: Manifest;
  observations: Observation[];
  selection: Selection;
  eligible: string[];
  excluded: { record: string; reason: string }[];
  metrics: {
    observed_bank_inflows: Money;
    observed_bank_outflows: Money;
    bank_cash_change: Money;
    unresolved: string[];
    recognized_revenue: Money;
    business_expense: Money;
  };
};

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function text(value: unknown): asserts value is string {
  assert(typeof value === 'string' && value.trim().length > 0, 'Required text');
}
function count(value: unknown): asserts value is number {
  assert(
    Number.isSafeInteger(value) && (value as number) >= 0,
    'Invalid count',
  );
}
function oneOf(value: unknown, values: readonly string[]) {
  assert(
    typeof value === 'string' && values.includes(value),
    'Unknown enum value',
  );
}
function refs(value: unknown): asserts value is string[] {
  assert(Array.isArray(value), 'Expected evidence references');
  value.forEach(text);
}
function unique(values: string[]) {
  assert(new Set(values).size === values.length, 'Duplicate identity');
}
function date(value: string) {
  assert(
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value),
    'Invalid date',
  );
  const parsed = new Date(`${value}T00:00:00Z`);
  assert(
    Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value,
    'Invalid calendar date',
  );
}
function instant(value: string) {
  assert(
    typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value),
    'Instant requires explicit UTC precision',
  );
  date(value.slice(0, 10));
  assert(
    Number.isFinite(Date.parse(value)) &&
      Number(value.slice(11, 13)) < 24 &&
      Number(value.slice(14, 16)) < 60 &&
      Number(value.slice(17, 19)) < 60,
    'Invalid instant',
  );
}
function period(value: Period) {
  date(value.from);
  date(value.to);
  assert(value.from <= value.to, 'Reversed period');
}
function inside(value: string, range: Period) {
  return value >= range.from && value <= range.to;
}
export function recordKey(row: Observation) {
  return `${row.factKey}@${row.revision}`;
}

/** Canonical JSON rejects lossy/undefined/non-JSON values; object key order is irrelevant. */
export function canonical(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return JSON.stringify(value);
  if (typeof value === 'number') {
    assert(
      Number.isSafeInteger(value) && !Object.is(value, -0),
      'Noncanonical number',
    );
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    assert(Object.keys(value).length === value.length, 'Sparse array');
    return `[${value.map(canonical).join(',')}]`;
  }
  assert(
    typeof value === 'object' &&
      Object.getPrototypeOf(value) === Object.prototype,
    'Non-JSON contract value',
  );
  return `{${Object.keys(value)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`,
    )
    .join(',')}}`;
}
export function hash(value: unknown) {
  return createHash('sha256').update(canonical(value)).digest('hex');
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function validateManifest(
  m: Manifest,
  rows: Observation[],
  selection: Selection,
) {
  assert(m.version === 'finance-dataset/v1', 'Unsupported dataset version');
  const a = m.acquisition;
  oneOf(a.class, [
    'SYNTHETIC',
    'FIRST_PARTY',
    'PROVIDER',
    'DERIVED_TOOL_EXPORT',
  ]);
  [a.origin, a.authorizationRef, a.scopeRef].forEach(text);
  period(a.requestedPeriod);
  if (a.observedPeriod !== null) period(a.observedPeriod);
  if (a.sourceAsOf !== null) instant(a.sourceAsOf);
  oneOf(a.retrieval, ['COMPLETE', 'PARTIAL', 'FAILED', 'UNKNOWN']);
  oneOf(a.pagination, ['COMPLETE', 'UNKNOWN']);
  oneOf(a.sourceControls, ['VERIFIED', 'UNKNOWN']);
  refs(a.controlEvidence);
  count(a.rejectedRows);
  count(a.retrievedRows);
  assert(typeof a.truncated === 'boolean', 'Missing truncation state');
  refs(m.limitations);
  oneOf(m.sensitivity, ['SYNTHETIC', 'CONFIDENTIAL']);
  assert(
    (a.class === 'SYNTHETIC') === (m.sensitivity === 'SYNTHETIC'),
    'Sensitivity mismatch',
  );
  assert(
    m.conventions.money === 'signed-minor-text/v1' &&
      m.conventions.dates === 'source-precision/v1' &&
      m.conventions.metrics === 'bank-movement/v1',
    'Unsupported convention',
  );
  text(m.conventions.transformation);
  unique(m.accounts.map((account) => account.accountKey));
  m.accounts.forEach((account) => {
    text(account.accountKey);
    oneOf(account.type, ['BANK', 'CARD', 'POS']);
    currency(account.currency);
  });
  unique(m.artifacts.map((artifact) => artifact.artifactId));
  unique(m.artifacts.map((artifact) => artifact.receiptId));
  const artifacts = new Map(
    m.artifacts.map((artifact) => [artifact.artifactId, artifact]),
  );
  for (const artifact of m.artifacts) {
    [artifact.artifactId, artifact.receiptId, artifact.locator].forEach(text);
    assert(/^[a-f0-9]{64}$/.test(artifact.sha256), 'Invalid artifact hash');
    count(artifact.rowCount);
    if (artifact.duplicateOf !== null) {
      const original = artifacts.get(artifact.duplicateOf);
      assert(
        original &&
          original.duplicateOf === null &&
          original.sha256 === artifact.sha256 &&
          original.rowCount === artifact.rowCount,
        'Duplicate acquisition needs exact original bytes',
      );
    }
    assert(
      rows.filter((row) => row.artifactId === artifact.artifactId).length ===
        artifact.rowCount,
      'Artifact population mismatch',
    );
  }
  assert(
    a.retrievedRows === rows.length &&
      a.retrievedRows ===
        m.artifacts.reduce((total, artifact) => total + artifact.rowCount, 0),
    'Retrieval count mismatch',
  );
  if (rows.length > 0) {
    assert(
      a.observedPeriod !== null,
      'Observed period required for nonempty population',
    );
    const days = rows.map((row) => row.date.value.slice(0, 10)).sort();
    assert(
      a.observedPeriod.from === days[0] &&
        a.observedPeriod.to === days[days.length - 1],
      'Observed period does not match received rows',
    );
  } else
    assert(
      a.observedPeriod === null,
      'Empty population has no observed period',
    );
  unique(m.coverage.map((item) => item.coverageKey));
  for (const item of m.coverage) {
    text(item.coverageKey);
    period(item.period);
    refs(item.evidenceRefs);
    oneOf(item.state, ['OBSERVED', 'NO_ACTIVITY', 'MISSING']);
    assert(
      m.accounts.some((account) => account.accountKey === item.accountKey),
      'Unknown coverage account',
    );
    if (item.state !== 'MISSING')
      assert(item.evidenceRefs.length > 0, 'Coverage needs source evidence');
    const population = rows.filter(
      (row) =>
        row.accountKey === item.accountKey &&
        inside(row.date.value.slice(0, 10), item.period),
    );
    if (item.state === 'NO_ACTIVITY')
      assert(population.length === 0, 'False zero activity');
    for (const other of m.coverage) {
      if (other !== item && other.accountKey === item.accountKey)
        assert(
          other.period.to < item.period.from ||
            other.period.from > item.period.to,
          'Overlapping coverage',
        );
    }
  }
  period(selection.period);
  currency(selection.currency);
  refs(selection.bankAccounts);
  assert(
    selection.bankAccounts.length > 0,
    'Explicit bank population required',
  );
  unique(selection.bankAccounts);
  assert(
    inside(selection.period.from, a.requestedPeriod) &&
      inside(selection.period.to, a.requestedPeriod),
    'Selection outside acquisition scope',
  );
  for (const key of selection.bankAccounts) {
    assert(
      m.accounts.some(
        (account) =>
          account.accountKey === key &&
          account.type === 'BANK' &&
          account.currency === selection.currency,
      ),
      'Invalid bank account scope',
    );
    // Version 1 requires an explicit coverage window equal to the selection.
    assert(
      m.coverage.some(
        (item) =>
          item.accountKey === key &&
          item.period.from === selection.period.from &&
          item.period.to === selection.period.to &&
          item.state !== 'MISSING',
      ),
      'Missing selected coverage; absence is not zero',
    );
  }
  assert(
    a.retrieval === 'COMPLETE' &&
      a.pagination === 'COMPLETE' &&
      a.sourceControls === 'VERIFIED' &&
      a.controlEvidence.length > 0 &&
      !a.truncated &&
      a.rejectedRows === 0,
    'Acquisition completeness remains unproved',
  );
  assert(
    a.class !== 'DERIVED_TOOL_EXPORT',
    'Derived tool export is not source-controlled evidence',
  );
}

function validateRows(m: Manifest, rows: Observation[]) {
  const identities = new Map<string, Observation>();
  const facts = new Map<string, string>();
  const events = new Map<string, string>();
  for (const row of rows) {
    [
      row.factKey,
      row.artifactId,
      row.sourceRowKey,
      row.accountKey,
      row.sourceEventKey,
    ].forEach(text);
    assert(!row.factKey.includes('@'), 'Reserved identity delimiter');
    count(row.revision);
    assert(row.revision > 0, 'Revision must be positive');
    assert(
      typeof row.description === 'string' &&
        (row.originalCategory === null ||
          typeof row.originalCategory === 'string'),
      'Missing original description/category',
    );
    const movement = sourceMoney(
      row.sourceAmount,
      row.currency,
      row.signConvention,
    );
    if (row.classification === 'REVENUE')
      assert(
        minor(movement.minor) >= 0n,
        'Negative revenue needs reversal procedure',
      );
    if (row.classification === 'BUSINESS_EXPENSE')
      assert(
        minor(movement.minor) <= 0n,
        'Positive expense needs refund procedure',
      );
    oneOf(row.date.precision, ['DATE', 'INSTANT']);
    if (row.date.precision === 'DATE') date(row.date.value);
    else instant(row.date.value);
    oneOf(row.status, ['PENDING', 'POSTED', 'REMOVED']);
    oneOf(row.classification, [
      'UNKNOWN',
      'REVENUE',
      'BUSINESS_EXPENSE',
      'TRANSFER',
      'CARD_PAYMENT',
      'REFUND',
      'REVERSAL',
      'OWNER_FLOW',
    ]);
    refs(row.classificationEvidence);
    if (row.classification !== 'UNKNOWN')
      assert(
        row.classificationEvidence.length > 0,
        'Classification requires procedure/evidence references',
      );
    const account = m.accounts.find(
      (item) => item.accountKey === row.accountKey,
    );
    assert(
      account && account.currency === row.currency,
      'Account/currency mismatch',
    );
    const artifact = m.artifacts.find(
      (item) => item.artifactId === row.artifactId,
    );
    assert(artifact, 'Missing source artifact');
    const key = recordKey(row),
      previous = identities.get(key);
    if (previous) {
      const priorArtifact = m.artifacts.find(
        (item) => item.artifactId === previous.artifactId,
      )!;
      const root = (item: typeof artifact) =>
        item.duplicateOf ?? item.artifactId;
      assert(
        root(artifact) === root(priorArtifact) &&
          artifact.artifactId !== previous.artifactId &&
          canonical({ ...row, artifactId: '' }) ===
            canonical({ ...previous, artifactId: '' }),
        'Conflicting observation revision',
      );
    } else identities.set(key, row);
    const event = canonical([row.accountKey, row.sourceEventKey]);
    assert(
      !facts.has(row.factKey) || facts.get(row.factKey) === event,
      'Fact identity changed across revisions',
    );
    assert(
      !events.has(event) || events.get(event) === row.factKey,
      'Source event assigned to multiple facts',
    );
    facts.set(row.factKey, event);
    events.set(event, row.factKey);
  }
  const histories = new Map<string, Set<number>>();
  rows.forEach((row) => {
    if (!histories.has(row.factKey)) histories.set(row.factKey, new Set());
    histories.get(row.factKey)!.add(row.revision);
  });
  for (const revisions of histories.values()) {
    const ordered = [...revisions].sort((a, b) => a - b);
    assert(
      ordered.every((revision, index) => revision === index + 1),
      'Missing observation revision history',
    );
  }
  for (const link of m.links) {
    oneOf(link.kind, ['TRANSFER', 'CARD_PAYMENT', 'REFUND', 'REVERSAL']);
    refs(link.evidenceRefs);
    assert(
      link.left !== link.right && link.evidenceRefs.length > 0,
      'Link requires explicit evidence',
    );
    const left = identities.get(link.left),
      right = identities.get(link.right);
    assert(left && right, 'Link references missing revision');
    assert(
      left.currency === right.currency,
      'Cross-currency pair needs another contract',
    );
    const l = sourceMoney(
      left.sourceAmount,
      left.currency,
      left.signConvention,
    );
    const r = sourceMoney(
      right.sourceAmount,
      right.currency,
      right.signConvention,
    );
    if (link.kind === 'TRANSFER' || link.kind === 'CARD_PAYMENT')
      assert(
        left.accountKey !== right.accountKey &&
          minor(l.minor) !== 0n &&
          minor(l.minor) + minor(r.minor) === 0n,
        'Pair reconciliation mismatch',
      );
    if (link.kind === 'REFUND' || link.kind === 'REVERSAL') {
      assert(
        minor(l.minor) * minor(r.minor) < 0n,
        'Refund/reversal must oppose the original movement',
      );
      if (link.kind === 'REVERSAL')
        assert(minor(l.minor) + minor(r.minor) === 0n, 'Reversal mismatch');
    }
    if (link.kind === 'CARD_PAYMENT') {
      const types = [left, right].map(
        (row) => m.accounts.find((a) => a.accountKey === row.accountKey)!.type,
      );
      assert(
        types.includes('BANK') && types.includes('CARD'),
        'Card payment needs bank/card accounts',
      );
    }
    if (link.kind === 'TRANSFER')
      assert(
        [left, right].every(
          (row) =>
            m.accounts.find((a) => a.accountKey === row.accountKey)!.type ===
            'BANK',
        ),
        'Transfer needs bank accounts',
      );
  }
}

const verified = new WeakSet<object>();
/** Pure candidate construction. No persistence, runtime authorization, or publication side effect. */
export function buildSnapshot(
  manifest: Manifest,
  observations: Observation[],
  selection: Selection,
): Snapshot {
  // Detach before validating/freezing; callers retain ownership of their input.
  const input = JSON.parse(
    canonical({ manifest, observations, selection }),
  ) as {
    manifest: Manifest;
    observations: Observation[];
    selection: Selection;
  };
  const m = input.manifest,
    rows = input.observations,
    scope = input.selection;
  const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  rows.sort(
    (a, b) =>
      compare(recordKey(a), recordKey(b)) ||
      compare(a.artifactId, b.artifactId),
  );
  validateRows(m, rows);
  validateManifest(m, rows, scope);
  const latest = new Map<string, number>();
  rows.forEach((row) =>
    latest.set(
      row.factKey,
      Math.max(latest.get(row.factKey) ?? 0, row.revision),
    ),
  );
  const seen = new Set<string>(),
    eligible: string[] = [],
    excluded: Snapshot['excluded'] = [];
  const included: Observation[] = [];
  for (const row of rows) {
    const key = recordKey(row);
    let reason = '';
    if (
      m.artifacts.find((a) => a.artifactId === row.artifactId)!.duplicateOf !==
        null ||
      seen.has(key)
    )
      reason = 'DUPLICATE_ACQUISITION';
    else if (row.revision !== latest.get(row.factKey)) reason = 'SUPERSEDED';
    else if (row.status !== 'POSTED') reason = row.status;
    else if (!scope.bankAccounts.includes(row.accountKey))
      reason = 'OUTSIDE_BANK_SCOPE';
    else if (!inside(row.date.value.slice(0, 10), scope.period))
      reason = 'OUTSIDE_PERIOD';
    if (reason) excluded.push({ record: `${key}:${row.artifactId}`, reason });
    else {
      eligible.push(key);
      included.push(row);
    }
    if (
      m.artifacts.find((a) => a.artifactId === row.artifactId)!.duplicateOf ===
      null
    )
      seen.add(key);
  }
  const money = (row: Observation) =>
    sourceMoney(row.sourceAmount, row.currency, row.signConvention);
  const inflows = sumMoney(
    included.map(money).filter((v) => minor(v.minor) >= 0n),
    scope.currency,
  );
  const outflows = sumMoney(
    included
      .map(money)
      .filter((v) => minor(v.minor) < 0n)
      .map((v) => ({ ...v, minor: (-minor(v.minor)).toString() })),
    scope.currency,
  );
  const metrics = {
    observed_bank_inflows: inflows,
    observed_bank_outflows: outflows,
    bank_cash_change: sumMoney(
      [inflows, { ...outflows, minor: (-minor(outflows.minor)).toString() }],
      scope.currency,
    ),
    unresolved: included
      .filter((r) => r.classification === 'UNKNOWN')
      .map(recordKey),
    recognized_revenue: sumMoney(
      included.filter((r) => r.classification === 'REVENUE').map(money),
      scope.currency,
    ),
    business_expense: sumMoney(
      included
        .filter((r) => r.classification === 'BUSINESS_EXPENSE')
        .map((r) => ({
          ...money(r),
          minor: (-minor(money(r).minor)).toString(),
        })),
      scope.currency,
    ),
  };
  const body = {
    version: 'finance-snapshot/v1' as const,
    kind: 'BASELINE' as const,
    manifestHash: hash(m),
    factsHash: hash(rows),
    manifest: m,
    observations: rows,
    selection: scope,
    eligible,
    excluded,
    metrics,
  };
  const snapshot = freeze({ ...body, snapshotHash: hash(body) });
  verified.add(snapshot);
  return snapshot;
}

export function retainOrReplace(
  previous: Snapshot | null,
  manifest: Manifest,
  observations: Observation[],
  selection: Selection,
) {
  if (previous !== null)
    assert(
      verified.has(previous),
      'Prior snapshot must be verified in this process',
    );
  try {
    const candidate = buildSnapshot(manifest, observations, selection);
    if (previous) {
      for (const old of previous.observations) {
        const current = candidate.observations.find(
          (row) =>
            recordKey(row) === recordKey(old) &&
            row.artifactId === old.artifactId,
        );
        assert(
          current && canonical(current) === canonical(old),
          'Prior observation revision changed or disappeared',
        );
      }
      for (const old of previous.manifest.artifacts) {
        const current = candidate.manifest.artifacts.find(
          (a) => a.artifactId === old.artifactId,
        );
        assert(
          current && canonical(current) === canonical(old),
          'Prior source artifact changed or disappeared',
        );
      }
      for (const old of previous.manifest.accounts) {
        const current = candidate.manifest.accounts.find(
          (a) => a.accountKey === old.accountKey,
        );
        assert(
          current && canonical(current) === canonical(old),
          'Prior account identity changed or disappeared',
        );
      }
    }
    return { status: 'VERIFIED' as const, snapshot: candidate };
  } catch (error) {
    return {
      status: 'REJECTED' as const,
      snapshot: previous,
      reason: error instanceof Error ? error.message : 'Invalid dataset',
    };
  }
}

export function scenario(
  baseline: Snapshot,
  assumptions: { evidenceRef: string; delta: Money }[],
) {
  assert(verified.has(baseline), 'Scenario requires verified baseline');
  assumptions.forEach((a) => text(a.evidenceRef));
  const delta = sumMoney(
    assumptions.map((a) => a.delta),
    baseline.selection.currency,
  );
  const body = {
    version: 'finance-scenario/v1',
    kind: 'SCENARIO',
    baselineHash: baseline.snapshotHash,
    assumptions: JSON.parse(canonical(assumptions)) as typeof assumptions,
    hypothetical_bank_cash_change: sumMoney(
      [baseline.metrics.bank_cash_change, delta],
      delta.currency,
    ),
    findingStatus: 'UNREVIEWED_HYPOTHESIS',
  };
  return freeze({ ...body, scenarioHash: hash(body) });
}
