// model.js: the Proof Field's data model. Pure functions only: every number the page shows is
// derived here from the dataset plus the prototype's live state, so the Field, Trace,
// Coverage, Exceptions, Follow-ups, the Cue line and Ask all agree.
//
// Money is integer cents end to end. It is formatted with integer arithmetic and string
// padding, never float division into the DOM. A month with no statement is "unknown",
// never $0.

export const SOURCE_ORDER = ['BANK', 'CARD', 'TOAST', 'CLOVER'];
export const STATUS_LABEL = {
  COMPLETE: 'Complete', PARTIAL: 'Partial', STALE: 'Stale', NO_DATA: 'No data', NO_ACTIVITY: 'No activity', HIDDEN: 'Hidden',
};
export const FU_STATE = { TO_DO: 'To do', WAITING_FOR_REPLY: 'Waiting for reply', READY_FOR_REVIEW: 'Ready for review', RESOLVED: 'Resolved' };
export const EMAIL_STATE = { DRAFT: 'Draft', AWAITING_APPROVAL: 'Awaiting approval', APPROVED_NOT_SENT: 'Approved, not sent', SENT: 'Sent outside Mhoo' };
export const REASON = {
  INTERNAL_MOVEMENT: 'internal movement (transfer or card payment)',
  POS_OVERLAP: 'POS overlap: the same sale in two feeds',
};
// The artifact the custody alarm pretends no longer matches its receipt.
export const CUSTODY_ARTIFACT = 'artifact-bank-2026-02';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---- formatting ------------------------------------------------------------------------
const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** 12600 → "$126.00", -2700 → "−$27.00". Integer arithmetic only. */
export function money(cents, { sign = false } = {}) {
  if (!Number.isInteger(cents)) throw new TypeError(`money needs integer cents, got ${cents}`);
  const neg = cents < 0;
  const abs = neg ? -cents : cents;
  const dollars = (abs - (abs % 100)) / 100;
  const body = `$${group(String(dollars))}.${String(abs % 100).padStart(2, '0')}`;
  return neg ? `−${body}` : sign && cents > 0 ? `+${body}` : body;
}
/** Dollars as a whole count of dots (one dot per whole dollar, rounded half up, integer math). */
export const dollarDots = (cents) => { const a = Math.abs(cents); return (a - (a % 100)) / 100 + (a % 100 >= 50 ? 1 : 0); };
export const monthShort = (p) => `${MONTHS[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`;
export const monthLong = (p) => `${MONTHS_LONG[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`;
export const monthAbbr = (p) => MONTHS[Number(p.slice(5, 7)) - 1];
export const count = (n, one, many = `${one}s`) => `${group(String(n))} ${n === 1 ? one : many}`;
export const isSha256 = (h) => /^[0-9a-f]{64}$/.test(String(h ?? ''));

// ---- normalising the two data sources into one shape ------------------------------------------
/** The committed synthetic fixture pack (fixture.js). */
export function fromFixture(PACK, FOLLOW_UPS) {
  const months = [...new Set(PACK.coverage.map((c) => c.period))].sort();
  const artifacts = new Map(PACK.artifacts.map((a) => [a.artifactId, { ...a, hashKind: isSha256(a.contentHash) ? 'sha256' : 'stub' }]));
  return {
    kind: 'fixture',
    label: 'Synthetic fixture',
    months,
    sources: [
      { key: 'BANK', label: 'Bank', note: 'Synthetic monthly statements' },
      { key: 'CARD', label: 'Card', note: 'Synthetic monthly statements' },
      { key: 'TOAST', label: 'Toast', note: 'Synthetic POS settlements' },
      { key: 'CLOVER', label: 'Clover', note: 'Synthetic rows only · live connector not connected, merchant consent MHO-230 pending' },
    ],
    facts: PACK.facts.map((f) => ({
      id: f.factKey, rowKey: f.sourceRowKey, artifactId: f.artifactId, row: f.rowNumber, period: f.period, source: f.sourceKind,
      eventKey: f.eventKey, cents: f.amountCents, label: f.description, cls: f.classification, status: f.status,
      revision: f.revision, revisionCount: f.revisionCount, included: f.includedInTotals, reason: f.exclusionReason ?? null,
    })),
    artifacts,
    receipts: new Map(PACK.receipts.map((r) => [r.artifactId, r])),
    raw: new Map(PACK.rawRows.map((r) => [r.sourceRowKey, r])),
    coverage: PACK.coverage.map((c) => ({ key: c.coverageKey, period: c.period, source: c.sourceKind, status: c.status, artifactIds: c.artifactIds, rows: c.observedRows, freshness: c.freshness, lineage: c.lineage, expected: c.expectedPopulation })),
    exceptions: PACK.exceptions.map((e) => ({ ...e })),
    followUps: FOLLOW_UPS.map((f) => ({ ...f })),
    duplicates: PACK.headline.duplicateSuppressedCount,
    documents: null,
  };
}

/** The gitignored local real-data file written by tools/make-real-data.mjs. */
export function fromReal(json) {
  const months = json.months.slice().sort();
  const accountKeys = new Set(json.accounts.map((a) => a.key));
  const exports = json.exports ?? [];
  const facts = json.rows.map((r, i) => ({
    id: `real-${i + 1}`, rowKey: `record-${r.rec}`, artifactId: `export-${r.x}`, row: r.rec, period: r.d.slice(0, 7), date: r.d,
    source: r.a, eventKey: null, cents: r.c, label: r.m ? r.m : categoryLabel(r.cat), merchant: r.m ?? null, cls: r.cat, status: String(r.st).toUpperCase(),
    revision: 1, revisionCount: 1, included: true, unreconciled: true, reason: null,
  }));
  const coverage = [];
  for (const m of months) for (const s of SOURCE_ORDER) {
    const rows = facts.filter((f) => f.period === m && f.source === s).length;
    const connected = accountKeys.has(s);
    coverage.push({ key: `real-${s}-${m}`, period: m, source: s, status: rows ? 'PARTIAL' : 'NO_DATA', artifactIds: [], rows, freshness: rows ? 'UNRECONCILED' : 'NOT_APPLICABLE',
      lineage: rows ? `${rows} posted rows, unreconciled; the statement for this month is not extracted` : connected ? 'no rows in the export for this month' : 'no feed in the local store', expected: s === 'BANK' || s === 'CARD' ? 'monthly statement' : 'POS settlement' });
  }
  const artifacts = new Map(exports.map((x, i) => [`export-${i}`, { artifactId: `export-${i}`, fileName: x.name, contentHash: x.sha256, hashKind: 'sha256', revision: 1, freshness: 'UNRECONCILED', rowCount: x.rows, sourceKind: x.account }]));
  const accountLabel = Object.fromEntries(json.accounts.map((a) => [a.key, a.label]));
  return {
    kind: 'real',
    label: 'Local real data',
    months,
    sources: SOURCE_ORDER.map((k) => ({
      key: k,
      label: k === 'BANK' || k === 'CARD' ? accountLabel[k] ?? k : k === 'TOAST' ? 'Toast' : 'Clover',
      note: k === 'CLOVER' ? 'Not connected · merchant consent MHO-230 pending' : k === 'TOAST' ? 'No Toast feed in the local store' : 'Posted rows from the verified export · unreconciled',
    })),
    facts,
    artifacts,
    receipts: new Map(),
    raw: new Map(),
    coverage,
    exceptions: [],
    followUps: [],
    duplicates: null,
    documents: json.documents ?? null,
    combined: json.combined ?? null,
  };
}
export const categoryLabel = (cat) => {
  const c = String(cat ?? 'uncategorised').replace(/_/g, ' ').toLowerCase();
  return c.charAt(0).toUpperCase() + c.slice(1);
};

// ---- derived views ------------------------------------------------------------------------
/**
 * @param data  from fromFixture / fromReal
 * @param st    { custody: boolean, recheck: boolean, followUps?: object[] }
 */
export function derive(data, st = {}) {
  const hiddenArtifacts = new Set(st.custody && data.kind === 'fixture' ? [CUSTODY_ARTIFACT] : []);
  const facts = data.facts.filter((f) => !hiddenArtifacts.has(f.artifactId));
  const hiddenFacts = data.facts.filter((f) => hiddenArtifacts.has(f.artifactId));
  const openEx = data.exceptions.filter((e) => e.status === 'OPEN');
  const exceptionRows = new Map();
  for (const e of openEx) for (const k of e.sourceRowKeys) exceptionRows.set(k, e);

  const coverage = data.coverage.map((c) => (c.artifactIds.some((a) => hiddenArtifacts.has(a)) ? { ...c, status: 'HIDDEN', lineage: `${c.lineage} · hidden: the stored file no longer matches its receipt` } : c));
  const cell = (period, source) => coverage.find((c) => c.period === period && c.source === source);

  const periods = data.months.map((p) => {
    const pf = facts.filter((f) => f.period === p);
    const included = pf.filter((f) => f.included);
    const excluded = pf.filter((f) => !f.included);
    const cells = SOURCE_ORDER.map((s) => cell(p, s)).filter(Boolean);
    const withData = cells.filter((c) => c.status !== 'NO_DATA' && c.status !== 'HIDDEN');
    const allNoData = withData.length === 0;
    const onlyZero = withData.length > 0 && withData.every((c) => c.status === 'NO_ACTIVITY') && !pf.length;
    // Known only when some source has rows. A month whose only evidence is a proven-zero bank
    // statement is still unknown overall: the other sources are missing, not zero.
    const known = included.length > 0;
    const net = included.reduce((s, f) => s + f.cents, 0);
    const excludedCents = excluded.reduce((s, f) => s + f.cents, 0);
    const spend = included.filter((f) => f.cents < 0).reduce((s, f) => s + f.cents, 0);
    const complete = cells.filter((c) => c.status === 'COMPLETE').length;
    return {
      period: p, facts: pf, included, excluded, net, excludedCents, spend, known, allNoData, onlyZero,
      cells, complete, stale: cells.some((c) => c.status === 'STALE'), hidden: hiddenFacts.filter((f) => f.period === p),
      inException: pf.filter((f) => exceptionRows.has(f.rowKey)),
    };
  });
  const byPeriod = new Map(periods.map((p) => [p.period, p]));
  const statusCount = (s) => coverage.filter((c) => c.status === s).length;
  const exposure = openEx.reduce((s, e) => s + e.differenceCents, 0);
  const followUps = st.followUps ?? data.followUps;
  const custodyArtifact = data.artifacts.get(CUSTODY_ARTIFACT) ?? null;
  return {
    data, facts, hiddenFacts, hiddenArtifacts, coverage, cell, periods, byPeriod, openEx, exceptionRows, exposure, followUps,
    counts: {
      cells: coverage.length, complete: statusCount('COMPLETE'), partial: statusCount('PARTIAL'), stale: statusCount('STALE'),
      noData: statusCount('NO_DATA'), noActivity: statusCount('NO_ACTIVITY'), hidden: statusCount('HIDDEN'),
      facts: facts.length, included: facts.filter((f) => f.included).length,
    },
    custody: st.custody && custodyArtifact ? { artifact: custodyArtifact, facts: hiddenFacts } : null,
    recheck: !!st.recheck,
  };
}

/** What would prove the most next, best first. Each item is checkable against the page. */
export function nextProofs(v) {
  const out = [];
  if (v.data.kind === 'real') {
    const docs = v.data.documents;
    out.push({ id: 'extract', title: `Extract the ${docs?.registered ?? 0} registered bank statements`, why: `They are registered with SHA-256 but none is extracted, so no month has a statement to reconcile the ${count(v.facts.length, 'row')} against.`, route: 'coverage' });
    out.push({ id: 'clover', title: 'Clover merchant consent (MHO-230)', why: 'Clover is not connected, so every Clover month is No data.', route: 'coverage' });
    return out;
  }
  for (const e of v.openEx.slice().sort((a, b) => b.differenceCents - a.differenceCents)) {
    out.push({ id: e.exceptionKey, title: e.exceptionKey.includes('pos-overlap') ? `Pick one POS source for ${monthShort(e.period)}` : `Get settlement detail for ${monthShort(e.period)}'s ${money(e.differenceCents)}`,
      why: `Answers ${money(e.differenceCents)} of the ${money(v.exposure)} exposure.`, route: 'exceptions', pageAct: e.exceptionKey });
  }
  const unknown = v.periods.filter((p) => p.allNoData);
  if (unknown.length) out.push({ id: 'gap', title: `Bring ${unknown.map((p) => monthLong(p.period)).join(', ')} statements`, why: `${count(unknown.reduce((s, p) => s + p.cells.length, 0), 'source-month')} are No data: unknown, not $0.`, route: 'coverage', pageAct: `gap-${unknown[0].period}` });
  return out;
}
