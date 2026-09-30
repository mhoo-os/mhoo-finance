// app.js: Finance · The Proof Field (MHO-322 prototype). Every number is made of its evidence:
// the screen shows how much of the money is proven, what is unproven, and the one thing that
// would prove more. Totals come last, and a month with no statement is never shown as $0.
//
// Five pages, routed in memory (never the URL): Field, Trace, Coverage, Exceptions, Follow-ups.
// Data: the synthetic fixture pack (fixture.js). On localhost only, a gitignored
// real-data.local.json (tools/make-real-data.mjs) adds a "Local real" switch to the dock.
// Nothing here approves, sends, imports, syncs, records or spends: those controls explain.
import { mountDevice } from './kit/device.js';
import { mountIsland } from './kit/cue-kit.js';
import { formParticles } from './kit/particles.js';
import { mountDots, stipple } from './dots.js';
import { PACK, FOLLOW_UPS } from './fixture.js';
import * as M from './model.js';
import { mountTour } from './tour.js';

const { money, monthShort, monthLong, monthAbbr, count, STATUS_LABEL, FU_STATE, EMAIL_STATE, REASON, SOURCE_ORDER } = M;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad2 = (n) => String(n).padStart(2, '0');
const clock = (d = new Date()) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const INK = '#172033', AMBER = '#9A6200';

const dev = mountDevice({ title: 'Finance · The Proof Field', note: 'Synthetic fixture · nothing here approves, sends, imports or spends', storageKey: 'proto-device:finance-proof-field' });

// ---- state ------------------------------------------------------------------------------------
const FIXTURE = M.fromFixture(PACK, FOLLOW_UPS);
const S = {
  route: 'field', mode: 'fixture', data: FIXTURE, real: null,
  custody: false, recheck: false, recheckAt: null, recheckTimer: 0, recheckArmed: true,
  tracePeriod: '2026-02', traced: false, row: null,
  cell: 'coverage-toast-2026-02', openEx: 'exception-pos-overlap-2026-02',
  notes: {}, choice: {}, explain: {},
  followUps: FOLLOW_UPS.map((f) => ({ ...f })),
  draft: { subject: 'exception-bank-control-2026-03', question: '', email: 'DRAFT', saved: false },
  drafts: {}, // subject -> its draft, so switching subject never carries one draft's state into another
};
let V = null;
const derive = () => (V = M.derive(S.data, { custody: S.custody, recheck: S.recheck, followUps: S.mode === 'fixture' ? S.followUps : [] }));
derive();

const SECTIONS = [['Field', 'field'], ['Trace', 'trace'], ['Coverage', 'coverage'], ['Exceptions', 'exceptions'], ['Follow-ups', 'followups']];
const sections = () => SECTIONS.map(([label, route]) => ({ label, route, current: route === S.route }));
const srcLabel = (k) => V.data.sources.find((s) => s.key === k)?.label ?? k;
const exById = (id) => V.data.exceptions.find((e) => e.exceptionKey === id);
const EX_OBJ = { 'exception-pos-overlap-2026-02': 'exc-feb', 'exception-bank-control-2026-03': 'exc-mar', 'exception-control-total-2026-01': 'exc-jan' };
const EX_TITLE = {
  'exception-pos-overlap-2026-02': 'Toast and Clover both report the same $125.00 sale.',
  'exception-bank-control-2026-03': 'Clover revenue is $1.00 over the bank control total.',
  'exception-control-total-2026-01': 'The January control total agrees: $110.00 = $110.00.',
};
const EX_KIND = { 'exception-pos-overlap-2026-02': 'POS overlap', 'exception-bank-control-2026-03': 'bank control', 'exception-control-total-2026-01': 'control total' };

// ---- the Cue line: this app's candidates, in its own priority order ------------------------------
function candidates() {
  if (S.mode === 'real') return realCandidates();
  const out = [];
  if (V.custody) out.push({ id: 'custody', tier: 'P0', kicker: 'Custody', sentence: 'Bank · Feb 2026: the stored file doesn\'t match its receipt. Nothing from it is shown.',
    because: 'simulated · in the real app the read path re-hashes every artifact; a mismatch hides the whole file, and it isn\'t re-imported automatically', action: { label: 'Check receipt →', route: 'trace', pageAct: 'custody' }, objectId: 'custody', ask: 'why is the bank file hidden' });
  const open = (k) => V.openEx.some((e) => e.exceptionKey === k);
  if (open('exception-pos-overlap-2026-02')) out.push({ id: 'feb-overlap', tier: 'P1', kicker: 'Overlap', sentence: 'Feb 2026 · Toast and Clover both report the same $125.00 sale. Pick one source.',
    because: 'same event key in two POS feeds · exposure counts it twice · HIGH, open', action: { label: 'Open exception →', route: 'exceptions', pageAct: 'exception-pos-overlap-2026-02' }, objectId: 'exc-feb', ask: 'why is exposure $126.00' });
  if (open('exception-bank-control-2026-03')) out.push({ id: 'mar-control', tier: 'P1', kicker: 'Control',
    sentence: S.recheck ? `Mar 2026 · Re-checked at ${S.recheckAt}: Clover is still $1.00 over the bank control total.` : 'Mar 2026 · Clover revenue is $1.00 over the bank control total.',
    because: S.recheck ? `the March control procedure re-ran at ${S.recheckAt} (simulated) on the same two rows · expected $170.00, observed $171.00 · still no conclusion` : 'expected $170.00, observed $171.00 · needs settlement detail before any conclusion',
    action: { label: 'Open exception →', route: 'exceptions', pageAct: 'exception-bank-control-2026-03' }, objectId: 'exc-mar' });
  const gap = V.periods.find((p) => p.allNoData);
  if (gap) out.push({ id: `gap-${gap.period}`, tier: 'P2', kicker: 'Gap', sentence: `${monthLong(gap.period)} has no statements from any source. That's unknown, not $0.`,
    because: `coverage: Bank, Card, Toast and Clover are all No data for ${monthLong(gap.period).split(' ')[0]}`, action: { label: 'Open coverage →', route: 'coverage', pageAct: `gap-${gap.period}` }, objectId: `gap-${gap.period}`, ask: `what did we spend in ${monthLong(gap.period).split(' ')[0]}` });
  const stale = V.coverage.find((c) => c.status === 'STALE');
  if (stale) out.push({ id: `stale-${stale.key}`, tier: 'P2', kicker: 'Stale', sentence: `${srcLabel(stale.source)} · ${monthShort(stale.period)} is stale: the statement is older than the last import.`,
    because: `coverage status STALE on ${stale.source.toLowerCase()}-${stale.period}`, action: { label: 'Open coverage →', route: 'coverage', pageAct: stale.key }, objectId: `cov-${stale.key}` });
  const approved = V.followUps.find((f) => f.email === 'APPROVED_NOT_SENT');
  if (approved) out.push({ id: `fu-${approved.id}`, tier: 'P2', kicker: 'Follow-up', sentence: 'Follow-up approved, not sent. Nothing has left Mhoo.',
    because: 'email state APPROVED_NOT_SENT · sending is a separate owner step', action: { label: 'Open follow-up →', route: 'followups', pageAct: approved.id }, objectId: `fu-${approved.id}` });
  const jan = V.data.exceptions.find((e) => e.exceptionKey === 'exception-control-total-2026-01' && e.status === 'RESOLVED');
  if (jan) out.push({ id: 'jan-agrees', tier: 'P3', kicker: 'Agrees', tone: 'green', sentence: 'Jan 2026 control total agrees: $110.00 = $110.00.',
    because: 'exception-control-total-2026-01 resolved', action: { label: 'Open exception →', route: 'exceptions', pageAct: 'exception-control-total-2026-01' }, objectId: 'exc-jan' });
  if (V.data.duplicates) out.push({ id: 'dupes', tier: 'P3', kicker: 'Imports', sentence: `${V.data.duplicates} duplicate rows suppressed across ${V.data.artifacts.size} imports. Totals unchanged.`,
    because: 'receipts are append-safe, and retries are idempotent', action: { label: 'Check import →', route: 'coverage', pageAct: 'receipts' }, objectId: 'receipts' });
  return out;
}
function realCandidates() {
  const d = V.data, docs = d.documents ?? { registered: 0, extracted: 0 };
  const out = [{ id: 'real-unreconciled', tier: 'P1', kicker: 'Local real', sentence: `${count(V.facts.length, 'row')} · all unreconciled · ${docs.registered} statements registered, ${docs.extracted ? `${docs.extracted} extracted` : 'none extracted'}.`,
    because: `reconciliation_status is unreconciled on every row · supplied_documents: ${docs.registered} registered, ${docs.extracted} extracted`, action: { label: 'Open coverage →', route: 'coverage' }, objectId: 'real-headline' }];
  out.push({ id: 'real-clover', tier: 'P2', kicker: 'Clover', sentence: 'Clover isn\'t connected. Merchant consent (MHO-230) is still To do.', because: 'no Clover feed in the local store · Plaid is Sandbox only (PR #5)', action: { label: 'Open coverage →', route: 'coverage' }, objectId: 'real-clover' });
  const gaps = V.coverage.filter((c) => (c.source === 'BANK' || c.source === 'CARD') && c.status === 'NO_DATA');
  if (gaps.length) out.push({ id: 'real-gaps', tier: 'P2', kicker: 'Gap', sentence: `${count(gaps.length, 'account-month')} have no rows at all. That's unknown, not $0.`, because: gaps.slice(0, 3).map((c) => `${srcLabel(c.source)} ${monthShort(c.period)}`).join(' · '), action: { label: 'Open coverage →', route: 'coverage' } });
  return out;
}

// ---- Ask: answered locally from live state ------------------------------------------------------
const MONTH_RX = [/\bjan(uary)?\b/, /\bfeb(ruary)?\b/, /\bmar(ch)?\b/, /\bapr(il)?\b/, /\bmay\b/, /\bjune?\b/, /\bjuly?\b/, /\baug(ust)?\b/, /\bsep(t|tember)?\b/, /\boct(ober)?\b/, /\bnov(ember)?\b/, /\bdec(ember)?\b/];
function findPeriod(t) {
  const i = MONTH_RX.findIndex((rx) => rx.test(t));
  if (i < 0) return null;
  const y = t.match(/\b(20\d\d)\b/)?.[1];
  const hits = V.data.months.filter((p) => Number(p.slice(5, 7)) === i + 1 && (!y || p.startsWith(y)));
  return hits.at(-1) ?? null;
}
function evidenceSummary() {
  if (S.mode === 'real') return `${count(V.facts.length, 'posted row')}, all unreconciled; ${V.data.documents?.registered ?? 0} statements registered, ${V.data.documents?.extracted ? `${V.data.documents.extracted} extracted` : 'none extracted'}; no reconciliation has run.`;
  const unknown = V.periods.filter((p) => !p.known).map((p) => monthShort(p.period));
  return `${count(V.openEx.length, 'open exception')} worth ${money(V.exposure)} (questions, not findings), ${V.counts.complete} of ${V.counts.cells} source-months complete, and ${unknown.join(' and ')} unknown.`;
}
function ask(text) {
  const t = text.toLowerCase();
  const prov = S.mode === 'real' ? 'From the local real-data file on this machine (unreconciled rows).' : 'From the synthetic fixture on this page. No AI call.';
  const p = findPeriod(t);
  const P = p ? V.byPeriod.get(p) : null;
  if (/fraud|steal|stole|theft|embezzl|misconduct|profit|tax|cheat|launder|suspicious/.test(t)) {
    return { kicker: 'Evidence', answer: `Finance doesn't draw fraud, tax or profit conclusions. Here is what the evidence shows: ${evidenceSummary()}`, action: S.mode === 'real' ? { label: 'Open coverage →', route: 'coverage' } : { label: 'Open exceptions →', route: 'exceptions' }, provenance: `${prov} Conclusions stay with a qualified professional.` };
  }
  if (/custody|hash|sha|tamper|mismatch|hidden/.test(t)) {
    if (V.custody) return { kicker: 'Custody', answer: `${V.custody.artifact.fileName} no longer matches its receipt (simulated), so its ${count(V.custody.facts.length, 'fact')} are hidden from every total. Nothing is re-imported automatically.`, action: { label: 'Check receipt →', route: 'trace', pageAct: 'custody' }, provenance: prov };
    return { kicker: 'Custody', answer: S.mode === 'real' ? 'Every row names the export it came from by SHA-256, as recorded in the local store (compare the MHO-259 inventory). This page re-hashes nothing.' : `The fixture reports all ${V.data.artifacts.size} artifacts matching their receipts. That is supplied metadata: this prototype re-hashes nothing. In the real app the read path re-hashes each file before anything is shown.`, action: { label: 'Open trace →', route: 'trace' }, provenance: prov };
  }
  if (/exposure|at risk|unproven/.test(t)) {
    if (S.mode === 'real') return { kicker: 'Exposure', answer: 'Exposure is unknown, not $0: no reconciliation has run on the local real data, so there are no exceptions to add up.', action: { label: 'Open coverage →', route: 'coverage' }, provenance: prov };
    const parts = V.openEx.map((e) => `${money(e.differenceCents)} (${monthShort(e.period)} ${EX_KIND[e.exceptionKey] ?? 'exception'}, ${e.severity}, open)`);
    return { kicker: 'Exposure', answer: `Exposure is ${money(V.exposure)}: ${parts.join(' + ')}.`, action: { label: 'Open exceptions →', route: 'exceptions' }, provenance: `${prov} Sum of differenceCents over open exceptions.` };
  }
  const amt = t.match(/\$\s?([\d,]+(?:\.\d{1,2})?)/) ?? t.match(/\b(\d[\d,]*\.\d{2})\b/);
  if (amt) {
    const [d, c = '0'] = amt[1].replace(/,/g, '').split('.');
    const cents = Number(d) * 100 + Number(c.padEnd(2, '0'));
    const hit = V.periods.find((x) => x.known && x.net === cents);
    if (hit) return { kicker: 'Trace', answer: `${money(cents)} is ${monthShort(hit.period)}'s net of ${count(hit.included.length, 'included fact')}. ${count(hit.excluded.length, 'more fact')} ${hit.excluded.length === 1 ? 'is' : 'are'} excluded with a reason. Open Trace to watch it turn back into its rows.`, action: { label: 'Open trace →', route: 'trace', pageAct: `trace-${hit.period}` }, provenance: prov };
    const ex = V.data.exceptions.find((e) => e.differenceCents === cents || e.expectedCents === cents || e.observedCents === cents);
    if (ex) return { kicker: 'Exception', answer: `${money(cents)} belongs to ${monthShort(ex.period)} ${EX_KIND[ex.exceptionKey]}: expected ${money(ex.expectedCents)}, observed ${money(ex.observedCents)} (${ex.status.toLowerCase()}).`, action: { label: 'Open exception →', route: 'exceptions', pageAct: ex.exceptionKey }, provenance: prov };
  }
  if (P && /spend|spent|cost|expense|outflow|revenue|earn|made|sales|total|net|how much|income/.test(t)) {
    if (!P.known) {
      const zero = P.onlyZero ? ' The bank statement proves no bank activity, but Card, Toast and Clover have no data.' : '';
      return { kicker: 'Gap', answer: `No statements for ${monthLong(p)}${P.onlyZero ? ' beyond the bank' : ''}. That's unknown, not $0.${zero}`, action: { label: 'Open coverage →', route: 'coverage', pageAct: `gap-${p}` }, provenance: prov };
    }
    const outflows = P.included.filter((f) => f.cents < 0);
    if (/spend|spent|cost|expense|outflow/.test(t)) {
      return { kicker: 'Spend', answer: `${S.mode === 'real' ? 'Posted, unreconciled outflows' : 'Outflows in included facts'} for ${monthShort(p)}: ${money(P.spend)} across ${count(outflows.length, S.mode === 'real' ? 'row' : 'fact')}. Excluded internal movements aren't spend.${P.stale ? ' One source is stale.' : ''}`, action: { label: 'Open trace →', route: 'trace', pageAct: `trace-${p}` }, provenance: prov };
    }
    return { kicker: 'Net', answer: `${monthShort(p)} nets ${money(P.net)} from ${count(P.included.length, S.mode === 'real' ? 'posted row' : 'included fact')}${S.mode === 'real' ? ', unreconciled' : ''}.`, action: { label: 'Open trace →', route: 'trace', pageAct: `trace-${p}` }, provenance: prov };
  }
  if (/where.*come from|made of|trace|break ?down|rows/.test(t)) {
    const q = P ?? V.byPeriod.get(S.tracePeriod) ?? V.periods.find((x) => x.known);
    return { kicker: 'Trace', answer: q.known ? `${monthShort(q.period)}'s ${money(q.net)} is ${count(q.included.length, S.mode === 'real' ? 'row' : 'included fact')}. Trace shows each one with its file and row pointer.` : `${monthShort(q.period)} has nothing to trace: no statements, unknown.`, action: { label: 'Open trace →', route: 'trace', pageAct: `trace-${q.period}` }, provenance: prov };
  }
  if (/clover|plaid|connect|toast/.test(t)) {
    return { kicker: 'Sources', answer: `Clover isn't connected: merchant consent (MHO-230) is still To do${S.mode === 'fixture' ? ', so the Clover rows here are synthetic fixture rows' : ''}. Plaid is Sandbox only (PR #5).`, action: { label: 'Open coverage →', route: 'coverage', pageAct: 'connectors' }, provenance: prov };
  }
  if (/follow|approv|sent|email|reply|bookkeeper/.test(t)) {
    if (!V.followUps.length) return { kicker: 'Follow-ups', answer: 'There are no follow-ups on the local real data. Mhoo never sends them in any case.', action: { label: 'Open follow-ups →', route: 'followups' }, provenance: prov };
    const by = (s) => V.followUps.filter((f) => f.state === s).length;
    return { kicker: 'Follow-ups', answer: `${by('TO_DO')} to do, ${by('WAITING_FOR_REPLY')} waiting for reply, ${by('READY_FOR_REVIEW')} ready for review, ${by('RESOLVED')} resolved. ${V.followUps.filter((f) => f.email === 'APPROVED_NOT_SENT').length} approved and not sent: nothing has left Mhoo.`, action: { label: 'Open follow-ups →', route: 'followups' }, provenance: prov };
  }
  if (/duplicate|dedup|receipt|import/.test(t)) {
    if (S.mode === 'real') return { kicker: 'Imports', answer: `The local store holds ${count(V.facts.length, 'row')} from the export ${(V.data.combined?.sha256 ?? '').slice(0, 8)}… (SHA-256 as recorded in the store; not re-hashed here). This page imports nothing.`, action: { label: 'Open coverage →', route: 'coverage' }, provenance: prov };
    return { kicker: 'Imports', answer: `${V.data.artifacts.size} imports, ${V.data.duplicates} duplicate rows suppressed. Receipts are append-safe and retries idempotent, so totals don't change.`, action: { label: 'Check import →', route: 'coverage', pageAct: 'receipts' }, provenance: prov };
  }
  if (/stale/.test(t)) {
    const st = V.coverage.filter((c) => c.status === 'STALE');
    return { kicker: 'Stale', answer: st.length ? `${st.map((c) => `${srcLabel(c.source)} · ${monthShort(c.period)}`).join(', ')}: the statement is older than the last import.` : 'Nothing is stale.', action: { label: 'Open coverage →', route: 'coverage' }, provenance: prov };
  }
  if (/coverage|complete|proven|missing|gap|unknown/.test(t)) {
    const c = V.counts;
    return { kicker: 'Coverage', answer: `${c.complete} of ${c.cells} source-months complete, ${c.partial} partial, ${c.stale} stale, ${c.noData} no data, ${c.noActivity} no activity${c.hidden ? `, ${c.hidden} hidden` : ''}. No data means unknown, not $0.`, action: { label: 'Open coverage →', route: 'coverage' }, provenance: prov };
  }
  if (P) {
    return { kicker: monthShort(p).toUpperCase(), answer: P.known ? `${monthShort(p)}: ${count(P.facts.length, 'fact')}, ${P.included.length} included, net ${money(P.net)}; ${P.complete} of ${P.cells.length} sources complete.` : `${monthShort(p)}: no statements, so unknown, not $0.`, action: { label: 'Open trace →', route: 'trace', pageAct: `trace-${p}` }, provenance: prov };
  }
  return null;
}

// ---- island ----------------------------------------------------------------------------------
const island = mountIsland(dev.screen, {
  appLabel: 'Finance', sections: sections(), getCandidates: candidates, ask,
  onNavigate: (route, pageAct) => navigate(route, pageAct),
});
dev.attachIsland(island);

// ---- router ----------------------------------------------------------------------------------
let page = null; // { destroy(), update() }
function render() {
  page?.destroy();
  dev.page.innerHTML = '';
  page = PAGES[S.route]();
}
function update() {
  derive();
  if (page?.update) page.update(); else render();
  syncBanner();
  island.refresh();
}
// The custody banner sits under every page's header; keep it in step on every transition.
function syncBanner() {
  const alarm = dev.page.querySelector('.alarm'); const html = custodyBanner();
  if (alarm) { if (html) alarm.outerHTML = html; else alarm.remove(); } else if (html) dev.page.querySelector('.head')?.insertAdjacentHTML('afterend', html);
}
function navigate(route, pageAct) {
  if (!route || !PAGES[route]) return;
  applyPageAct(route, pageAct);
  if (route !== S.route) {
    S.route = route;
    render();
    dev.page.scrollTop = 0;
    island.setSections(sections());
  } else page?.update?.();
  if (pageAct) requestAnimationFrame(() => scrollToAct(pageAct));
}
function applyPageAct(route, act) {
  if (!act) return;
  if (route === 'trace') {
    if (act === 'custody') { S.tracePeriod = '2026-02'; S.traced = true; S.row = null; }
    else if (act.startsWith('trace-')) { const p = act.slice(6); if (S.tracePeriod !== p) { S.row = null; S.traced = false; } S.tracePeriod = p; S.pendingTrace = true; }
  }
  if (route === 'exceptions') S.openEx = act;
  if (route === 'coverage') { if (act.startsWith('coverage-') || act.startsWith('real-')) S.cell = act; if (act.startsWith('gap-')) S.cell = V.coverage.find((c) => c.period === act.slice(4))?.key ?? S.cell; }
  if (route === 'followups' && act === 'draft-mar') switchDraft('exception-bank-control-2026-03');
}
function scrollToAct(act) {
  const sel = { custody: '[data-island-object="custody"]', receipts: '#receipts', connectors: '#connectors', 'draft-mar': '#composer' }[act]
    ?? (act.startsWith('exception-') ? `[data-ex="${act}"]` : act.startsWith('gap-') ? `[data-island-object="${act}"]` : act.startsWith('coverage-') ? '#cell-detail' : act.startsWith('fu-') ? `[data-fu="${act}"]` : null);
  const el = sel && dev.page.querySelector(sel);
  if (!el) return;
  const scale = Number(dev.device.dataset.scale) || 1;
  const top = (el.getBoundingClientRect().top - dev.page.getBoundingClientRect().top) / scale + dev.page.scrollTop;
  dev.page.scrollTo({ top: Math.max(0, top - 128), behavior: document.documentElement.dataset.motion === 'reduce' ? 'auto' : 'smooth' });
}

// ---- shared bits --------------------------------------------------------------------------------
const tag = (text, tone = '') => `<span class="tag ${tone}">${esc(text)}</span>`;
const statusTone = { COMPLETE: 'ink', PARTIAL: '', STALE: 'amber', NO_DATA: '', NO_ACTIVITY: '', HIDDEN: 'amber' };
function head(kick, title, lede) {
  return `<header class="head"><p class="kick">Finance · ${esc(kick)}${S.mode === 'real' ? ' · <span class="real-flag">Local real data</span>' : ''}</p><h1 class="title">${esc(title)}</h1><p class="lede">${lede}</p></header>${custodyBanner()}`;
}
function custodyBanner() {
  if (!V.custody) return '';
  const a = V.custody.artifact;
  return `<div class="alarm" role="note"><span class="tag amber">Custody · simulated</span><p><b>${esc(a.fileName)}</b> no longer matches its receipt. Its ${count(V.custody.facts.length, 'fact')} are hidden from every total until the file is checked. Nothing is re-imported automatically.</p></div>`;
}
function ownerBtn(key, label) {
  return `<button type="button" class="btn owner" data-owner="${esc(key)}">${esc(label)}<span class="owner-k">owner action</span></button>`;
}
const OWNER_TEXT = {
  record: 'Recording a decision is yours, on this page, with your name and the reason. It would keep the excluded row in lineage and move exposure. The prototype records nothing.',
  approve: 'Approving is yours, on this page. In the real app it stores APPROVED_NOT_SENT with your identity and sends nothing. The prototype approves nothing.',
  send: 'Mhoo never sends. You send the approved text from your own mailbox, then mark it Waiting for reply here. The prototype sends nothing.',
  upload: 'Bringing a statement is yours: in the real app you add the file here, it is hashed (SHA-256), receipted and read row by row. The prototype imports nothing.',
  clover: 'Connecting Clover needs the merchant\'s consent (MHO-230, still To do) and your OAuth sign-in. The prototype starts no OAuth and calls no provider.',
  recheck: 'Checking custody re-hashes the stored file against its receipt. Only you can re-import after a mismatch. The prototype re-imports nothing.',
  extract: 'Extracting statements reads the registered PDFs into rows with pointers. It runs only when you start it. The prototype extracts nothing.',
};
const explainHTML = (key) => (S.explain[key] ? `<p class="explain" role="status">${esc(OWNER_TEXT[S.explain[key]] ?? '')}</p>` : '<p class="explain" role="status"></p>');

let fx = []; // particle handles for the current page
const keep = (h) => { fx.push(h); return h; };
function clearFx() { fx.forEach((h) => h.destroy()); fx = []; }

// ---- Field ---------------------------------------------------------------------------------
function FieldPage() {
  const p = dev.page;
  const real = S.mode === 'real';
  p.innerHTML = `<div class="app" data-route="field">
    ${head('Field', 'What the books can prove', real
      ? 'Every dot is one posted row from the exported statements. None is reconciled yet, so the field is half-settled: observed, not proven.'
      : 'Every dot is one fact from a source file. <b>Ink</b> is proven and counted, <b>drift</b> is excluded with a reason, <b class="amb">amber</b> sits inside an open exception, and <b>stipple</b> is missing evidence.')}
    <button type="button" class="askline" data-act="ask"><span class="askline-orb" aria-hidden="true"></span><span class="askline-q">Ask about the books</span><span class="askline-k" aria-hidden="true">⌘K</span></button>
    <section class="headline" aria-label="Proof headline" data-region="headline"></section>
    <section class="card field-card">
      <div class="card-top"><h2>${real ? `${V.data.months.length} months · one dot per row` : 'Five months · one dot per fact'}</h2>
        <ul class="legend" aria-label="Legend">
          <li><i class="lg ink"></i>${real ? 'Observed, unreconciled' : 'Proven, counted'}</li>
          ${real ? '' : '<li><i class="lg drift"></i>Excluded, with a reason</li><li><i class="lg amber"></i>In an open exception</li>'}
          <li><i class="lg stip"></i>No data · unknown</li>
          ${real ? '' : '<li><i class="lg ring"></i>No activity · proven zero</li>'}
        </ul></div>
      <div class="field-wrap"><canvas class="field-cv"></canvas><div class="field-cols" data-region="cols"></div><div class="tip" hidden></div></div>
      <div class="field-labels" data-region="labels"></div>
    </section>
    <div class="grid2">
      <section class="card next" data-region="next"></section>
      <section class="card totals"><div class="card-top"><h2>Totals come last</h2><span class="muted small">${real ? 'Net of posted rows, unreconciled' : 'Net of included facts'}</span></div>
        <div class="spark-wrap" data-region="sparkbg"></div><canvas class="spark-cv"></canvas>
        <div data-region="totals"></div></section>
    </div>
  </div>`;
  const statsHTML = () => {
    const c = V.counts;
    const items = real
      ? [['rows', count(V.facts.length, 'row').split(' ')[0], 'Posted rows', 'all unreconciled', INK], ['complete', `0 of ${c.cells}`, 'Source-months proven', 'no statement extracted yet', INK], ['docs', String(V.data.documents?.registered ?? 0), 'Statements registered', `${V.data.documents?.extracted ?? 0} extracted`, AMBER]]
      : [['exposure', money(V.exposure), 'Exposure', `in ${count(V.openEx.length, 'open exception')}`, AMBER], ['open', String(V.openEx.length), 'Open exceptions', 'questions, not findings', INK], ['complete', `${c.complete} of ${c.cells}`, 'Source-months complete', `${c.noData} no data · ${c.stale} stale${c.hidden ? ` · ${c.hidden} hidden` : ''}`, INK]];
    return items;
  };
  const headline = p.querySelector('[data-region="headline"]');
  headline.innerHTML = statsHTML().map(([k, , label, sub]) => `<div class="stat" data-stat="${k}"${k === 'exposure' ? ' data-island-object="exposure"' : k === 'rows' ? ' data-island-object="real-headline"' : ''}><canvas class="stat-cv"></canvas><p class="stat-l"><b>${esc(label)}</b> <span data-sub>${esc(sub)}</span></p></div>`).join('');
  const statFx = new Map();
  for (const [k, text, label, sub, color] of statsHTML()) {
    const cv = headline.querySelector(`[data-stat="${k}"] canvas`);
    statFx.set(k, keep(formParticles(cv, { text, align: 'left', color, density: 1.25, label: `${label}: ${text}, ${sub}`, scatterOnScroll: false })));
  }

  // The field: one dot per fact.
  const cv = p.querySelector('.field-cv');
  const field = keep(mountDots(cv, { label: 'Field: one dot per fact, by month', layout: fieldLayout }));
  const wrap = p.querySelector('.field-wrap'), tip = p.querySelector('.tip');
  wrap.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect(), scale = r.width / cv.clientWidth || 1;
    const h = field.hit((e.clientX - r.left) / scale, (e.clientY - r.top) / scale, 5);
    if (!h) { tip.hidden = true; return; }
    tip.hidden = false;
    tip.innerHTML = h.meta.html;
    const tw = tip.offsetWidth;
    tip.style.left = `${Math.max(0, Math.min(cv.clientWidth - tw, h.x - tw / 2))}px`;
    tip.style.top = `${Math.max(0, h.y - tip.offsetHeight - h.size - 8)}px`;
  });
  wrap.addEventListener('pointerleave', () => { tip.hidden = true; });

  const spark = keep(formParticles(p.querySelector('.spark-cv'), { shape: sparkShape(), density: 1.6, label: sparkLabel(), scatterOnScroll: false }));
  function regions() {
    const n = V.periods.length;
    const dense = n > 12;
    p.querySelector('[data-region="cols"]').style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    p.querySelector('[data-region="cols"]').innerHTML = V.periods.map((P) => {
      const obj = P.allNoData ? `gap-${P.period}` : P.period === '2026-02' && !real ? 'exc-feb' : P.period === '2026-03' && !real ? 'exc-mar' : '';
      const desc = P.known ? `${count(P.facts.length, real ? 'row' : 'fact')}, ${P.included.length} included${P.excluded.length ? `, ${P.excluded.length} excluded` : ''}${P.inException.length ? `, ${P.inException.length} in an open exception` : ''}. Net ${money(P.net)}.` : P.onlyZero ? 'Bank proves no activity; the other sources have no data. Unknown.' : 'No statements from any source. Unknown, not $0.';
      return `<button type="button" class="col" data-act="trace" data-period="${P.period}"${obj ? ` data-island-object="${obj}"` : ''} aria-label="${esc(`${monthLong(P.period)}: ${desc} Open Trace.`)}"></button>`;
    }).join('');
    p.querySelector('[data-region="labels"]').style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    p.querySelector('[data-region="labels"]').innerHTML = V.periods.map((P, i) => {
      const show = !dense || i % 3 === 0 || i === n - 1;
      const status = P.known ? (P.stale ? 'Stale source' : P.hidden.length ? 'File hidden' : `${P.complete} of ${P.cells.length} complete`) : P.onlyZero ? 'Bank: no activity' : 'No data';
      return `<div class="fl${P.known ? '' : ' unknown'}${show ? '' : ' mute'}" data-period="${P.period}"><b>${esc(dense ? `${monthAbbr(P.period)} ${P.period.slice(2, 4)}` : monthShort(P.period))}</b>${dense ? '' : `<span>${esc(P.known ? count(P.facts.length, real ? 'row' : 'fact') : 'Unknown')}</span><span class="${P.stale || P.hidden.length ? 'amb' : ''}">${esc(status)}</span>`}</div>`;
    }).join('');
    const next = M.nextProofs(V);
    p.querySelector('[data-region="next"]').innerHTML = `<div class="card-top"><h2>What would prove more</h2><span class="muted small">Best first</span></div>
      <ol class="next-list">${next.map((x, i) => `<li><span class="nx-i">${i + 1}</span><div><b>${esc(x.title)}</b><p>${esc(x.why)}</p></div><button type="button" class="btn quiet" data-go="${esc(x.route)}" data-act-id="${esc(x.pageAct ?? '')}">Open →</button></li>`).join('')}</ol>`;
    p.querySelector('[data-region="sparkbg"]').innerHTML = V.periods.map((P, i) => (P.known ? '' : `<span class="spark-gap" style="left:${(i / n) * 100}%;width:${100 / n}%"></span>`)).join('');
    p.querySelector('[data-region="totals"]').innerHTML = `<table class="tot"><thead><tr><th scope="col">Month</th><th scope="col" class="num">Net</th><th scope="col">Evidence</th></tr></thead><tbody>${(dense ? V.periods.slice(-6) : V.periods).map((P) => `<tr${P.known ? '' : ' class="unknown"'}><th scope="row">${esc(monthShort(P.period))}</th><td class="num">${P.known ? esc(money(P.net)) : '<span class="unk">Unknown</span>'}</td><td>${esc(P.known ? `${count(P.included.length, real ? 'row' : 'fact')}${P.hidden.length ? ` · ${P.hidden.length} hidden` : ''}${P.stale ? ' · stale source' : ''}` : P.onlyZero ? 'Bank proves $0.00 · others no data' : 'No statements · not $0')}</td></tr>`).join('')}</tbody></table>${dense ? `<p class="muted small">Last 6 of ${n} months.</p>` : ''}`;
  }
  regions();
  return {
    destroy: clearFx,
    update() {
      for (const [k, text, label, sub] of statsHTML()) {
        const box = headline.querySelector(`[data-stat="${k}"]`);
        box.querySelector('[data-sub]').textContent = sub;
        statFx.get(k).set({ text, label: `${label}: ${text}, ${sub}` });
      }
      field.update();
      spark.set({ shape: sparkShape(), label: sparkLabel() });
      regions();
    },
  };
}
function fieldLayout(W, H) {
  const ps = V.periods, n = ps.length, cw = W / n, real = S.mode === 'real';
  const top = 8, bot = 6, avail = H - top - bot;
  const incW = cw * (real ? 0.78 : 0.46), excX = cw * 0.62, excW = cw * 0.26;
  const maxInc = Math.max(1, ...ps.map((P) => P.included.length));
  let s = Math.min(real ? 6 : 18, cw * 0.2), gap = 0, k = 1;
  for (; s > 1.5; s -= 0.25) {
    gap = Math.max(1, s * (real ? 0.35 : 0.5));
    k = Math.max(1, Math.floor((incW + gap) / (s + gap)));
    if (Math.ceil(maxInc / k) * (s + gap) <= avail) break;
  }
  const points = [];
  const unknownCols = [];
  ps.forEach((P, i) => {
    const x0 = i * cw + cw * 0.08;
    const inc = P.included.slice().sort((a, b) => SOURCE_ORDER.indexOf(a.source) - SOURCE_ORDER.indexOf(b.source) || String(a.date ?? a.id).localeCompare(String(b.date ?? b.id)));
    inc.forEach((f, j) => {
      const col = j % k, row = Math.floor(j / k);
      const amber = V.exceptionRows.has(f.rowKey);
      const stale = V.cell(f.period, f.source)?.status === 'STALE';
      points.push({ id: f.id, x: x0 + col * (s + gap) + s / 2, y: H - bot - row * (s + gap) - s / 2, size: s,
        color: amber ? 'amber' : 'ink', alpha: real ? 0.55 : 1, shape: stale ? 'stale' : 'sq', meta: { html: tipHTML(f) } });
    });
    const es = s * 0.85, perRow = Math.max(1, Math.floor((excW + gap) / (es + gap)));
    P.excluded.forEach((f, j) => {
      const amber = V.exceptionRows.has(f.rowKey);
      points.push({ id: f.id, x: i * cw + excX + (j % perRow) * (es + gap) + es / 2, y: top + avail * 0.22 + Math.floor(j / perRow) * (es + gap * 2),
        size: es, color: amber ? 'amber' : 'faint', alpha: amber ? 0.8 : 0.85, wander: 2.4, meta: { html: tipHTML(f) } });
    });
    if (!P.known) unknownCols.push(P);
    if (P.onlyZero) {
      points.push({ id: `ring-${P.period}`, x: x0 + incW / 2, y: H - bot - s * 1.1, size: Math.max(14, s * 2), shape: 'ring', color: 'ink', meta: { html: '<b>Bank · no activity</b><span>The statement exists and proves $0.00 for the bank. Card, Toast and Clover: no data.</span>' } });
    }
  });
  return {
    points,
    backdrop(g) {
      g.fillStyle = 'rgba(225,230,236,1)';
      ps.forEach((P, i) => { g.fillRect(i * cw + cw * 0.08, H - 1, cw * 0.84, 1); });
      for (const P of unknownCols) {
        const i = ps.indexOf(P);
        const x = i * cw + cw * 0.08, w = cw * 0.84;
        const h = P.onlyZero ? avail - s * 3.2 : avail;
        stipple(g, x, top, w, Math.max(10, h), { radius: real ? 3 : 8 });
      }
    },
  };
}
function tipHTML(f) {
  const ex = V.exceptionRows.get(f.rowKey);
  const state = f.unreconciled ? 'Posted · unreconciled' : f.included ? 'Included in totals' : `Excluded · ${REASON[f.reason] ?? f.reason}`;
  return `<b>${esc(srcLabel(f.source))} · ${esc(f.label)}</b><span>${esc(money(f.cents))} · ${esc(state)}${ex ? ` · <em>in open exception (${esc(EX_KIND[ex.exceptionKey])})</em>` : ''}</span><span class="mono">${esc(f.date ?? monthShort(f.period))} · ${esc(f.artifactId)}#row-${f.row}</span>`;
}
function sparkShape() {
  const ps = V.periods, n = ps.length;
  const known = ps.filter((P) => P.known);
  const vals = known.map((P) => P.net);
  const min = Math.min(0, ...vals), max = Math.max(0, ...vals), span = max - min || 1;
  return (c, w, h) => {
    const lw = Math.max(3, h * 0.07);
    const X = (i) => ((i + 0.5) / n) * w;
    const Y = (v) => h - lw - ((v - min) / span) * (h - lw * 3);
    c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    // Only consecutive known months are joined: an unknown month is a gap, never a dip to $0.
    for (let i = 0; i < n - 1; i++) {
      if (!ps[i].known || !ps[i + 1].known) continue;
      c.beginPath(); c.moveTo(X(i), Y(ps[i].net)); c.lineTo(X(i + 1), Y(ps[i + 1].net)); c.stroke();
    }
    ps.forEach((P, i) => { if (P.known) { c.fillRect(X(i) - lw * 1.3, Y(P.net) - lw * 1.3, lw * 2.6, lw * 2.6); } });
  };
}
function sparkLabel() {
  return `Monthly net: ${V.periods.map((P) => `${monthShort(P.period)} ${P.known ? money(P.net) : 'unknown'}`).join(', ')}`;
}

// ---- Trace ---------------------------------------------------------------------------------
const ROW_H = 56;
function traceRows(P) {
  const inc = P.included.slice().sort((a, b) => SOURCE_ORDER.indexOf(a.source) - SOURCE_ORDER.indexOf(b.source) || Math.abs(b.cents) - Math.abs(a.cents));
  const exc = P.excluded.slice();
  let rows = [...inc, ...exc];
  if (S.mode === 'real') rows = inc.slice().sort((a, b) => Math.abs(b.cents) - Math.abs(a.cents)).slice(0, 24);
  return rows;
}
function TracePage() {
  const p = dev.page;
  const real = S.mode === 'real';
  p.innerHTML = `<div class="app" data-route="trace">
    ${head('Trace', 'Trace a number', 'Pick a month. Its net turns back into the facts it is made of, and each fact opens its file, hash and row pointer.')}
    <div class="seg months" role="group" aria-label="Month" data-region="months"></div>
    <section class="card trace-card" data-region="trace"></section>
    <section class="card evidence" data-region="evidence" hidden></section>
  </div>`;
  let num = null;
  function renderTrace() {
    num?.destroy(); fx = fx.filter((h) => h !== num); num = null;
    const P = V.byPeriod.get(S.tracePeriod) ?? V.periods[0];
    const n = V.periods.length;
    p.querySelector('[data-region="months"]').innerHTML = V.periods.slice(n > 12 ? -12 : 0).map((x) => `<button type="button" data-act="period" data-period="${x.period}" aria-pressed="${x.period === P.period}">${esc(n > 12 ? `${monthAbbr(x.period)} ${x.period.slice(2, 4)}` : monthAbbr(x.period))}</button>`).join('');
    const box = p.querySelector('[data-region="trace"]');
    box.dataset.islandObject = `trace-${P.period}`;
    const hidden = P.hidden.length ? `<div class="hidden-file" data-island-object="custody"><span class="tag amber">Hidden</span><p><b>${esc(V.custody.artifact.fileName)}</b> · the stored bytes no longer match <span class="mono">receipt-${esc(V.custody.artifact.artifactId)}</span> (simulated). Its ${count(P.hidden.length, 'fact')} (${esc(P.hidden.map((f) => money(f.cents)).join(', '))}) are left out of this total.</p>${ownerBtn('recheck', 'Check custody')}${explainHTML('trace-recheck')}</div>` : '';
    if (!P.known) {
      box.innerHTML = `<div class="trace-top"><div><h2>${esc(monthLong(P.period))}</h2><p class="muted">${P.onlyZero ? 'Bank: no activity (proven $0.00) · Card, Toast, Clover: no data' : 'No statements from any source'}</p></div></div>
        <div class="trace-empty">${P.onlyZero ? '<span class="ring-mark" aria-hidden="true"></span>' : ''}<div class="stip-block"></div><p><b>Nothing to trace.</b> ${P.onlyZero ? 'The bank statement proves the bank had no activity. The month\'s net is still unknown, because three sources have no data.' : 'Unknown, not $0. The next proof is the statement itself.'}</p></div>${hidden}`;
      p.querySelector('[data-region="evidence"]').hidden = true;
      return;
    }
    const rows = traceRows(P);
    const more = real ? P.included.length - rows.length : 0;
    box.innerHTML = `<div class="trace-top"><div><h2>${esc(monthShort(P.period))} · ${real ? 'net of posted rows' : 'net of included facts'}</h2>
        <p class="muted">${esc(real ? `${count(P.included.length, 'row')} · unreconciled` : `${P.included.length} included · ${P.excluded.length} excluded · ${P.cells.map((c) => `${srcLabel(c.source)} ${STATUS_LABEL[c.status].toLowerCase()}`).join(', ')}`)}</p></div>
        <button type="button" class="btn primary" data-act="trace-toggle" aria-pressed="${S.traced}">${S.traced ? 'Settle back' : 'Trace this number'}</button></div>
      ${hidden}
      <div class="trace-body" data-traced="${S.traced}">
        <div class="trace-num"><canvas class="trace-cv" style="height:${Math.max(rows.length * ROW_H, 240)}px"></canvas><p class="trace-sum" aria-live="polite">${S.traced ? '' : esc(money(P.net))}</p></div>
        <ol class="rows" aria-label="Facts in ${esc(monthShort(P.period))}">${rows.map((f) => {
          const ex = V.exceptionRows.get(f.rowKey);
          const st = f.unreconciled ? 'Posted · unreconciled' : f.included ? (ex ? 'Included · in an open exception' : 'Included') : `Excluded · ${REASON[f.reason] ?? f.reason}`;
          return `<li class="${f.included ? '' : 'excl'}${ex ? ' inex' : ''}"><button type="button" class="row" data-act="row" data-row="${esc(f.id)}" aria-pressed="${S.row === f.id}" ${S.traced ? '' : 'tabindex="-1"'}>
            <span class="r-src">${esc(f.source)}</span><span class="r-lbl">${esc(f.label)}<small>${esc(st)}</small></span><span class="r-amt">${esc(money(f.cents))}</span></button></li>`;
        }).join('')}</ol>
      </div>${more > 0 ? `<p class="muted small">Showing the 24 largest of ${count(P.included.length, 'row')}; ${more} more are in the export.</p>` : ''}`;
    const cv = box.querySelector('.trace-cv');
    const text = money(P.net);
    const max = Math.max(1, ...rows.map((f) => Math.abs(f.cents)));
    const numberShape = (c, w, h) => {
      const fs = Math.min(h * 0.28, (w * 0.94) / (text.length * 0.56));
      c.font = `900 ${fs}px Arial, Helvetica, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(text, w / 2, Math.min(h / 2, 120));
    };
    const rowsShape = (c, w, h) => {
      rows.forEach((f, i) => {
        const len = Math.max(0.1, Math.abs(f.cents) / max) * w * 0.74;
        const y = i * ROW_H + ROW_H / 2, bh = ROW_H * 0.34;
        // Included facts settle against the rows; excluded ones drift aside, quieter.
        c.globalAlpha = f.included ? 1 : 0.62;
        const x = f.included ? w - len : w * 0.02;
        c.fillRect(x, y - bh / 2, f.included ? len : Math.min(len, w * 0.5), bh);
      });
      c.globalAlpha = 1;
    };
    num = keep(formParticles(cv, { shape: S.traced ? rowsShape : numberShape, density: 1.5, label: S.traced ? `${text} traced into ${count(rows.length, 'row')}` : `${monthShort(P.period)} net ${text}`, scatterOnScroll: false }));
    num.rowsShape = rowsShape; num.numberShape = numberShape; num.text = text; num.n = rows.length;
    renderEvidence();
  }
  function renderEvidence() {
    const ev = p.querySelector('[data-region="evidence"]');
    const f = S.row && V.facts.find((x) => x.id === S.row);
    if (!f || !S.traced || f.period !== S.tracePeriod) { ev.hidden = true; ev.innerHTML = ''; return; }
    const a = V.data.artifacts.get(f.artifactId);
    const r = V.data.receipts.get(f.artifactId);
    const raw = V.data.raw.get(f.rowKey);
    ev.hidden = false;
    const hashRow = a?.hashKind === 'sha256'
      ? `<dt>SHA-256</dt><dd class="mono hash">${esc(a.contentHash)}</dd>`
      : `<dt>Content hash</dt><dd><span class="mono">${esc(a?.contentHash ?? '—')}</span><small>A fixture stub: this pack carries no file bytes for this artifact, so there is no SHA-256 to show. Revised artifacts carry real ones.</small></dd>`;
    const rawObj = raw ?? { date: f.date, amountCents: f.cents, category: f.cls, merchant: f.merchant ?? '(not shown: category only)', status: f.status, reconciliation: 'unreconciled' };
    ev.innerHTML = `<div class="card-top"><h2>Evidence · ${esc(f.label)}</h2><button type="button" class="btn quiet" data-act="row-close" aria-label="Close evidence">Close</button></div>
      <dl class="ev">
        <dt>File</dt><dd>${esc(a?.fileName ?? f.artifactId)} <span class="muted">· revision ${f.revision} of ${f.revisionCount}${a?.freshness ? ` · ${esc(a.freshness.toLowerCase())}` : ''}</span></dd>
        ${hashRow}
        <dt>Row pointer</dt><dd class="mono">${esc(S.mode === 'real' ? `sha256:${(a?.contentHash ?? '').slice(0, 12)}…#record-${f.row}` : `${f.artifactId}#row-${f.row}`)}</dd>
        <dt>Receipt</dt><dd>${r ? esc(`${r.status} · ${count(r.attempts, 'attempt')} · ${count(r.importedRows, 'row')} imported · ${r.deduplicatedRows} deduplicated`) : esc(S.mode === 'real' ? 'Export SHA-256 as recorded in the local store (compare the MHO-259 inventory); not re-hashed here' : '—')}</dd>
        <dt>Raw values</dt><dd><pre class="raw">${esc(JSON.stringify(rawObj, null, 2))}</pre></dd>
      </dl>`;
  }
  let pendT = 0;
  function consumePending() {
    if (!S.pendingTrace) return;
    S.pendingTrace = false;
    if (!S.traced && V.byPeriod.get(S.tracePeriod)?.known) { clearTimeout(pendT); pendT = setTimeout(() => toggleTrace(true), 350); }
  }
  renderTrace();
  consumePending();
  function toggleTrace(on) {
    S.traced = on ?? !S.traced;
    if (!S.traced) S.row = null;
    const body = p.querySelector('.trace-body');
    if (!body || !num) { renderTrace(); return; }
    body.dataset.traced = String(S.traced);
    const btn = p.querySelector('[data-act="trace-toggle"]');
    btn.textContent = S.traced ? 'Settle back' : 'Trace this number';
    btn.setAttribute('aria-pressed', String(S.traced));
    p.querySelector('.trace-sum').textContent = S.traced ? '' : num.text;
    p.querySelectorAll('.rows .row').forEach((b) => (S.traced ? b.removeAttribute('tabindex') : b.setAttribute('tabindex', '-1')));
    num.set({ shape: S.traced ? num.rowsShape : num.numberShape, label: S.traced ? `${num.text} traced into ${count(num.n, 'row')}` : `Net ${num.text}` });
    renderEvidence();
  }
  return {
    destroy() { clearTimeout(pendT); clearFx(); num = null; },
    update() { renderTrace(); consumePending(); },
    toggleTrace, renderEvidence,
    selectRow(id) {
      S.row = S.row === id ? null : id;
      p.querySelectorAll('.rows .row').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.row === S.row)));
      renderEvidence();
      if (S.row) requestAnimationFrame(() => { const el = p.querySelector('[data-region="evidence"]'); const scale = Number(dev.device.dataset.scale) || 1; const top = (el.getBoundingClientRect().top - dev.page.getBoundingClientRect().top) / scale + dev.page.scrollTop; dev.page.scrollTo({ top: Math.max(0, top - 300), behavior: document.documentElement.dataset.motion === 'reduce' ? 'auto' : 'smooth' }); });
    },
  };
}

// ---- Coverage ------------------------------------------------------------------------------
const STATE_TEXT = {
  COMPLETE: 'Every expected row is here and matches its receipt.',
  PARTIAL: 'Some rows are here, but the month is not fully proven.',
  STALE: 'The statement is older than the last import.',
  NO_DATA: 'No file at all. Unknown, not $0.',
  NO_ACTIVITY: 'A statement exists and proves zero activity.',
  HIDDEN: 'The stored file no longer matches its receipt, so nothing from it is shown.',
};
function CoveragePage() {
  const p = dev.page;
  const real = S.mode === 'real';
  p.innerHTML = `<div class="app" data-route="coverage">
    ${head('Coverage', 'Which months can we prove?', `Each source against each month, in five states. ${real ? 'Local real data has rows but no extracted statements, so nothing is Complete yet.' : 'Only Complete is proof. No data is unknown, never zero.'}`)}
    <ul class="legend big" aria-label="States">${['COMPLETE', 'PARTIAL', 'STALE', 'NO_DATA', 'NO_ACTIVITY'].map((s) => `<li><i class="cellviz" data-state="${s}"></i><span><b>${STATUS_LABEL[s]}</b> ${esc(STATE_TEXT[s])}</span></li>`).join('')}</ul>
    <section class="card cov-card"><div class="cov-scroll" data-region="grid"></div></section>
    <div class="grid2">
      <section class="card" id="cell-detail" data-region="detail"></section>
      <div class="stack">
        <section class="card" id="connectors" data-region="conn"></section>
        <section class="card" id="receipts" data-island-object="receipts" data-region="receipts"></section>
      </div>
    </div>
  </div>`;
  function regions() {
    const srcs = V.data.sources;
    p.querySelector('[data-region="grid"]').innerHTML = `<table class="cov">
      <thead><tr><th scope="col" class="cov-m">Month</th>${srcs.map((s) => `<th scope="col"${s.key === 'CLOVER' ? ' data-island-object="real-clover"' : ''}><b>${esc(s.label)}</b><small>${esc(s.key === 'CLOVER' ? (real ? 'Not connected · MHO-230' : 'Synthetic · not connected') : s.key === 'TOAST' && real ? 'No feed' : real ? 'Verified export' : 'Synthetic')}</small></th>`).join('')}</tr></thead>
      <tbody>${V.data.months.slice().reverse().map((m) => {
        const P = V.byPeriod.get(m);
        return `<tr${P.allNoData ? ` data-island-object="gap-${m}"` : ''}><th scope="row" class="cov-m"><b>${esc(monthShort(m))}</b><small>${esc(P.known ? money(P.net) : 'Unknown')}</small></th>${srcs.map((s) => {
          const c = V.cell(m, s.key);
          if (!c) return '<td></td>';
          const sel = S.cell === c.key;
          return `<td><button type="button" class="cell" data-act="cell" data-cell="${esc(c.key)}" data-state="${c.status}" aria-pressed="${sel}"${c.status === 'STALE' ? ` data-island-object="cov-${esc(c.key)}"` : ''} aria-label="${esc(`${s.label}, ${monthLong(m)}: ${STATUS_LABEL[c.status]}, ${count(c.rows, 'row')}`)}"><i class="cellviz" data-state="${c.status}"></i><span class="cell-t">${esc(STATUS_LABEL[c.status])}</span><span class="cell-n">${c.status === 'NO_DATA' ? '—' : esc(String(c.rows))}</span></button></td>`;
        }).join('')}</tr>`;
      }).join('')}</tbody></table>`;
    const c = V.coverage.find((x) => x.key === S.cell) ?? V.coverage[0];
    const arts = (c.artifactIds ?? []).map((id) => V.data.artifacts.get(id)).filter(Boolean);
    const proof = { NO_DATA: ['upload', `Bring the ${srcLabel(c.source)} statement for ${monthLong(c.period)}`], STALE: ['upload', 'Bring the current statement'], HIDDEN: ['recheck', 'Check custody'], PARTIAL: real ? ['extract', 'Extract the registered statement'] : ['upload', 'Bring the missing file'] }[c.status];
    const cloverNote = c.source === 'CLOVER' && c.status === 'NO_DATA' ? ['clover', 'Connect Clover'] : null;
    const act = cloverNote ?? proof;
    p.querySelector('[data-region="detail"]').innerHTML = `<div class="card-top"><h2>${esc(srcLabel(c.source))} · ${esc(monthLong(c.period))}</h2>${tag(STATUS_LABEL[c.status], statusTone[c.status])}</div>
      <p>${esc(STATE_TEXT[c.status])}</p>
      <dl class="ev small">
        <dt>Expected</dt><dd>${esc(c.expected ?? '—')}</dd>
        <dt>Observed</dt><dd>${esc(count(c.rows, 'row'))} · freshness ${esc(String(c.freshness).toLowerCase().replace(/_/g, ' '))}</dd>
        <dt>Lineage</dt><dd>${esc(c.lineage)}</dd>
        ${arts.map((a) => `<dt>File</dt><dd>${esc(a.fileName)}${a.duplicateOf ? ' <span class="muted">· duplicate copy, suppressed</span>' : ''}<br><span class="mono small">${esc(a.hashKind === 'sha256' ? `sha256 ${a.contentHash.slice(0, 16)}…` : `${a.contentHash} (fixture stub)`)}</span></dd>`).join('')}
      </dl>
      ${act ? `<div class="row-btns">${ownerBtn(act[0], act[1])}</div>${explainHTML('cov')}` : ''}`;
    p.querySelector('[data-region="conn"]').innerHTML = `<div class="card-top"><h2>Connectors</h2><span class="muted small">Read-only here</span></div>
      <ul class="conn"><li data-island-object="${real ? 'real-clover-c' : 'clover'}"><b>Clover</b>${tag('Not connected', 'amber')}<p>Merchant consent (MHO-230) is still To do. ${real ? 'No Clover rows exist locally.' : 'The Clover rows on this page are synthetic fixture rows.'}</p>${ownerBtn('clover', 'Connect Clover')}${explainHTML('conn')}</li>
      <li><b>Plaid</b>${tag('Sandbox only')}<p>Sandbox connector only (PR #5). No live bank link.</p></li>
      <li><b>Local evidence store</b>${tag(real ? 'In use' : 'Available locally', real ? 'green' : '')}<p>${real ? `${count(V.facts.length, 'row')} from the export ${esc((V.data.combined?.sha256 ?? '').slice(0, 8))}… (SHA-256 as recorded; not re-hashed here).` : 'On the owner\'s machine only, gitignored. Never published.'}</p></li></ul>`;
    const rec = [...V.data.receipts.values()];
    p.querySelector('[data-region="receipts"]').innerHTML = real
      ? `<div class="card-top"><h2>Imports</h2></div><p>${esc(count(V.data.documents?.registered ?? 0, 'statement'))} registered with SHA-256, ${V.data.documents?.extracted ?? 0} extracted. The page imports nothing.</p>${ownerBtn('extract', 'Extract statements')}${explainHTML('rec')}`
      : `<div class="card-top"><h2>Imports · receipts</h2><span class="muted small">${V.data.duplicates} duplicate rows suppressed · totals unchanged</span></div>
      <table class="rec"><thead><tr><th scope="col">File</th><th scope="col">Receipt</th><th scope="col" class="num">Rows</th><th scope="col" class="num">Dedup</th></tr></thead><tbody>${rec.map((r) => `<tr${V.hiddenArtifacts.has(r.artifactId) ? ' class="amb-row"' : ''}><td>${esc(V.data.artifacts.get(r.artifactId)?.fileName ?? r.artifactId)}</td><td>${esc(V.hiddenArtifacts.has(r.artifactId) ? 'MISMATCH' : r.status)} · ${r.attempts}×</td><td class="num">${r.importedRows}</td><td class="num">${r.deduplicatedRows}</td></tr>`).join('')}</tbody></table>
      <p class="muted small">Each import was attempted twice; the second attempt matched the first receipt, so nothing was added twice. The 24 suppressed rows are those replays and the duplicate copy.</p>`;
  }
  regions();
  return { destroy: clearFx, update: regions };
}

// ---- Exceptions ----------------------------------------------------------------------------
function exBars(e) {
  // One dot per dollar, 50 to a line (so a line is $50 and the count can be read).
  const E = M.dollarDots(e.expectedCents), O = M.dollarDots(e.observedCents);
  const PER = 50;
  let merged = false;
  const geo = (W) => { const step = Math.max(4.5, Math.min(9, W / PER)); return { step, s: step * 0.66, per: PER }; };
  const lines = (n) => Math.ceil(n / PER);
  const bandO = (step) => 4 + lines(E) * step + 18;
  return {
    E, O,
    setMerged(v) { merged = v; },
    layout: (W) => {
      const { step, s, per } = geo(W);
      const agree = Math.min(E, O);
      const pts = [];
      const posO = (i) => ({ x: (i % per) * step + s / 2, y: bandO(step) + Math.floor(i / per) * step + s / 2 });
      const posE = (i) => ({ x: (i % per) * step + s / 2, y: 4 + Math.floor(i / per) * step + s / 2 });
      for (let i = 0; i < E; i++) {
        const at = merged && i < agree ? posO(i) : posE(i);
        pts.push({ id: `e${i}`, ...at, size: s, color: merged ? (i < agree ? 'green' : 'amber') : 'ink', alpha: 1 });
      }
      for (let i = 0; i < O; i++) pts.push({ id: `o${i}`, ...posO(i), size: s, color: merged ? (i < agree ? 'green' : 'amber') : 'muted', alpha: 1 });
      return {
        points: pts,
        backdrop(g) {
          if (merged) return;
          g.fillStyle = 'rgba(225,230,236,1)';
          g.fillRect(0, bandO(step) - 10, per * step, 1);
        },
      };
    },
    height: (W) => { const { step } = geo(W); return bandO(step) + lines(O) * step + 4; },
  };
}
function ExceptionsPage() {
  const p = dev.page;
  const real = S.mode === 'real';
  if (real) {
    p.innerHTML = `<div class="app" data-route="exceptions">${head('Exceptions', 'Questions the evidence raises', 'An exception is a question, not a finding.')}
      <section class="card empty"><div class="stip-block"></div><p><b>No reconciliation has run on the local real data.</b> Zero exceptions here means unchecked, not clean. Reconciliation needs extracted statements to compare against.</p>${ownerBtn('extract', 'Extract statements')}${explainHTML('rex')}</section></div>`;
    return { destroy: clearFx, update: () => render() };
  }
  const list = V.data.exceptions.slice().sort((a, b) => (a.status === 'OPEN' ? 0 : 1) - (b.status === 'OPEN' ? 0 : 1) || b.differenceCents - a.differenceCents);
  p.innerHTML = `<div class="app" data-route="exceptions">
    ${head('Exceptions', 'Questions the evidence raises', `An exception is a question, not a finding. Each dot is one dollar: where expected and observed agree the dots merge and turn <b class="grn">green</b>; what's left over stays <b class="amb">amber</b>.`)}
    <div class="ex-list">${list.map((e) => exCard(e)).join('')}</div>
  </div>`;
  const bars = [];
  for (const e of list) {
    const cv = p.querySelector(`[data-ex="${e.exceptionKey}"] .bars-cv`);
    const b = exBars(e);
    cv.style.height = `${b.height(cv.clientWidth || 600)}px`;
    const d = keep(mountDots(cv, { label: `${EX_KIND[e.exceptionKey]}: expected ${money(e.expectedCents)} (${b.E} dots), observed ${money(e.observedCents)} (${b.O} dots); ${Math.min(b.E, b.O)} agree, ${Math.abs(b.O - b.E)} differ`, layout: (W) => b.layout(W) }));
    bars.push({ e, b, d, cv });
  }
  let mergeT = setTimeout(() => {
    for (const x of bars) { x.b.setMerged(true); x.d.update(); }
    p.querySelectorAll('.bars').forEach((el) => (el.dataset.merged = 'true'));
  }, document.documentElement.dataset.motion === 'reduce' ? 0 : 1100);
  return {
    destroy() { clearTimeout(mergeT); clearFx(); },
    update() {
      // Only the parts that don't hold a field the owner may be typing in.
      p.querySelectorAll('[data-recheck]').forEach((el) => { el.innerHTML = recheckHTML(); });
      p.querySelectorAll('.ex-card').forEach((el) => el.toggleAttribute('data-open', el.dataset.ex === S.openEx));
    },
    replay() { for (const x of bars) { x.b.setMerged(false); x.d.update(undefined, { animate: false }); } p.querySelectorAll('.bars').forEach((el) => (el.dataset.merged = 'false')); clearTimeout(mergeT); mergeT = setTimeout(() => { for (const x of bars) { x.b.setMerged(true); x.d.update(); } p.querySelectorAll('.bars').forEach((el) => (el.dataset.merged = 'true')); }, 700); },
  };
}
const recheckHTML = () => (S.recheck ? `<span class="tag">Re-checked ${esc(S.recheckAt)} · simulated</span> Same two rows, same result: still ${money(100)} over. No conclusion drawn.` : '');
function exCard(e) {
  const open = e.status === 'OPEN';
  const agree = Math.min(e.expectedCents, e.observedCents), differ = Math.abs(e.observedCents - e.expectedCents);
  const isFeb = e.exceptionKey === 'exception-pos-overlap-2026-02', isMar = e.exceptionKey === 'exception-bank-control-2026-03';
  const rows = e.sourceRowKeys.map((k) => V.data.facts.find((f) => f.rowKey === k)).filter(Boolean);
  const note = S.notes[e.exceptionKey] ?? '';
  const preview = isFeb && S.choice[e.exceptionKey] ? `If you recorded “keep ${S.choice[e.exceptionKey]}”, exposure would fall from ${money(V.exposure)} to ${money(V.exposure - e.differenceCents)} and the other row would stay in lineage. Nothing is recorded here.` : '';
  return `<article class="card ex-card${open ? '' : ' resolved'}" data-ex="${e.exceptionKey}" data-island-object="${EX_OBJ[e.exceptionKey]}"${S.openEx === e.exceptionKey ? ' data-open' : ''}>
    <div class="ex-head"><span class="kick">${esc(monthShort(e.period))} · ${esc(EX_KIND[e.exceptionKey])}</span>${tag(`${e.severity} · ${e.status}`, open ? (e.severity === 'HIGH' ? 'amber' : 'amber soft') : 'green')}</div>
    <h2 class="ex-title">${esc(EX_TITLE[e.exceptionKey] ?? e.reason)}</h2>
    <div class="bars" data-merged="false"><canvas class="bars-cv"></canvas>
      <div class="bars-legend"><span class="bl-e">Expected <b>${esc(money(e.expectedCents))}</b></span><span class="bl-o">Observed <b>${esc(money(e.observedCents))}</b></span><span class="bl-a">Agree <b>${esc(money(agree))}</b></span><span class="bl-d${differ ? '' : ' none'}">Differ <b>${esc(money(differ))}</b></span></div></div>
    ${isMar ? `<p class="recheck" data-recheck>${recheckHTML()}</p>` : ''}
    <dl class="ev small">
      <dt>Supports</dt><dd>${esc(e.supportingEvidence)}</dd>
      <dt>Limits</dt><dd>${esc(e.limitingEvidence)}</dd>
      <dt>Next</dt><dd>${esc(e.nextAction)}</dd>
      <dt>Rows</dt><dd class="rowlinks">${rows.map((f) => `<button type="button" class="link" data-act="goto-row" data-period="${f.period}" data-row="${esc(f.id)}">${esc(f.source)} · ${esc(money(f.cents))} · ${esc(f.artifactId)}#row-${f.row}</button>`).join('')}</dd>
    </dl>
    ${open ? `<form class="dispo" data-form="dispo" data-key="${e.exceptionKey}">
      ${isFeb ? `<fieldset class="choice"><legend>Which source counts for February?</legend>
        <label><input type="radio" name="keep-${e.exceptionKey}" value="Toast"${S.choice[e.exceptionKey] === 'Toast' ? ' checked' : ''}> Keep Toast · Clover row stays in lineage</label>
        <label><input type="radio" name="keep-${e.exceptionKey}" value="Clover"${S.choice[e.exceptionKey] === 'Clover' ? ' checked' : ''}> Keep Clover · Toast row stays in lineage</label></fieldset>
        <p class="preview" data-preview>${esc(preview)}</p>` : ''}
      <label class="fl-l" for="note-${e.exceptionKey}">Reviewer note (local only)</label>
      <textarea id="note-${e.exceptionKey}" name="note" rows="3" placeholder="${isFeb ? 'What you know about the overlap' : 'What would explain the $1.00'}">${esc(note)}</textarea>
      <div class="row-btns"><button type="submit" class="btn primary">Save note</button>${ownerBtn('record', 'Record decision')}${isMar ? '<button type="button" class="btn quiet" data-go="followups" data-act-id="draft-mar">Draft follow-up →</button>' : ''}</div>
      <p class="saved" role="status">${S.notes[e.exceptionKey] ? 'Saved on this page only. A note is not a decision.' : ''}</p>
      ${explainHTML(`ex-${e.exceptionKey}`)}
      ${isFeb && S.recheckArmed ? '<p class="hint">Prototype: while you type here, the scheduled March re-check lands. The Cue holds it until you save.</p>' : ''}
    </form>` : `<p class="done"><span class="tag green">Resolved</span> ${esc(e.reason)}</p>`}
  </article>`;
}

// ---- Follow-ups -----------------------------------------------------------------------------
const LADDER = ['DRAFT', 'AWAITING_APPROVAL', 'APPROVED_NOT_SENT'];
function ladder(email) {
  if (email === 'SENT') return '<ol class="ladder"><li class="done">Sent outside Mhoo, by the owner</li></ol>';
  const at = LADDER.indexOf(email);
  return `<ol class="ladder" aria-label="Email state">${LADDER.map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"${i === at ? ' aria-current="step"' : ''}>${esc(EMAIL_STATE[s])}</li>`).join('')}</ol>`;
}
function FollowUpsPage() {
  const p = dev.page;
  if (S.mode === 'real') {
    p.innerHTML = `<div class="app" data-route="followups">${head('Follow-ups', 'Questions out, answers in', 'A follow-up is a question to a person. You approve it here; Mhoo never sends it.')}
      <section class="card empty"><div class="stip-block"></div><p><b>No follow-ups on the local real data.</b> They start from an exception, and none has been raised yet.</p></section></div>`;
    return { destroy: clearFx, update: () => render() };
  }
  p.innerHTML = `<div class="app" data-route="followups">
    ${head('Follow-ups', 'Questions out, answers in', 'A follow-up is a question to a person. You approve it here; Mhoo never sends it. States follow the contract: To do, Waiting for reply, Ready for review, Resolved.')}
    <div class="grid2 fu-grid"><section class="card" data-region="list"></section>
    <section class="card composer" id="composer" data-island-object="fu-draft" data-region="composer"></section></div>
  </div>`;
  function list() {
    p.querySelector('[data-region="list"]').innerHTML = `<div class="card-top"><h2>Follow-ups</h2><span class="muted small">${count(V.followUps.length, 'question')}</span></div>
      <ol class="fu-list">${V.followUps.map((f) => `<li data-fu="${esc(f.id)}" data-island-object="fu-${esc(f.id)}">
        <div class="fu-top">${tag(FU_STATE[f.state], f.state === 'RESOLVED' ? 'green' : f.state === 'READY_FOR_REVIEW' ? 'blue' : '')}<span class="muted small">${esc(f.subject.label)}</span></div>
        <p class="fu-q">${esc(f.question)}</p>
        ${ladder(f.email)}
        <p class="fu-meta"><span>Owner · ${esc(f.owner)}</span><span>To · ${esc(f.recipient)}</span></p>
        <p class="fu-next"><b>Next</b> ${esc(f.nextAction)}</p>
        ${f.sentNote ? `<p class="muted small">${esc(f.sentNote)}</p>` : ''}
        ${f.email === 'APPROVED_NOT_SENT' ? `<div class="row-btns">${ownerBtn('send', 'Send')}</div>${explainHTML(`fu-${f.id}`)}` : ''}
      </li>`).join('')}</ol>`;
  }
  function composer() {
    const d = S.draft;
    const ex = exById(d.subject);
    p.querySelector('[data-region="composer"]').innerHTML = `<div class="card-top"><h2>New follow-up</h2>${tag(EMAIL_STATE[d.email], d.email === 'AWAITING_APPROVAL' ? 'blue' : '')}</div>
      <form data-form="fu-draft">
        <label class="fl-l" for="fu-subject">About</label>
        <select id="fu-subject" name="subject">${V.data.exceptions.filter((e) => e.status === 'OPEN').map((e) => `<option value="${e.exceptionKey}"${e.exceptionKey === d.subject ? ' selected' : ''}>${esc(`${monthShort(e.period)} · ${EX_KIND[e.exceptionKey]} ${money(e.differenceCents)}`)}</option>`).join('')}</select>
        <p class="muted small">To · ${esc(d.subject === 'exception-bank-control-2026-03' ? 'Bank settlement desk (synthetic)' : 'Bookkeeper (synthetic)')} · the smallest useful request, no personal data.</p>
        <label class="fl-l" for="fu-q">Question</label>
        <textarea id="fu-q" name="question" rows="4" placeholder="${esc(ex ? `Ask for what would explain ${monthShort(ex.period)}'s ${money(ex.differenceCents)}` : 'Your question')}">${esc(d.question)}</textarea>
        ${ladder(d.email)}
        <div class="row-btns"><button type="submit" class="btn">Save draft</button><button type="button" class="btn primary" data-act="request-approval"${d.email !== 'DRAFT' ? ' disabled' : ''}>Ask for approval</button>${ownerBtn('approve', 'Approve')}${ownerBtn('send', 'Send')}</div>
        <p class="saved" role="status">${d.email === 'AWAITING_APPROVAL' ? 'Waiting for your approval. Approving would store “Approved, not sent”; sending stays outside Mhoo.' : d.saved ? 'Draft saved on this page only.' : ''}</p>
        ${explainHTML('draft')}
      </form>`;
  }
  function draftState() {
    const d = S.draft, c = p.querySelector('#composer');
    if (!c) return;
    c.querySelector('.card-top').innerHTML = `<h2>New follow-up</h2>${tag(EMAIL_STATE[d.email], d.email === 'AWAITING_APPROVAL' ? 'blue' : '')}`;
    c.querySelector('.ladder').outerHTML = ladder(d.email);
    c.querySelector('[data-act="request-approval"]').disabled = d.email !== 'DRAFT';
    c.querySelector('.saved').textContent = d.email === 'AWAITING_APPROVAL' ? 'Waiting for your approval. Approving would store “Approved, not sent”; sending stays outside Mhoo.' : 'Edited: back to Draft. Ask for approval again when it reads right.';
  }
  list(); composer();
  return { destroy: clearFx, update() { list(); }, composer, list, draftState };
}

const PAGES = { field: FieldPage, trace: TracePage, coverage: CoveragePage, exceptions: ExceptionsPage, followups: FollowUpsPage };

// ---- events ---------------------------------------------------------------------------------
dev.page.addEventListener('click', (e) => {
  const t = e.target instanceof Element ? e.target : null;
  const b = t?.closest('button');
  if (!b) return;
  if (b.dataset.owner) {
    const scope = b.closest('[data-form="dispo"]') ? `ex-${b.closest('form').dataset.key}` : b.closest('#composer') ? 'draft' : b.closest('[data-fu]') ? `fu-${b.closest('[data-fu]').dataset.fu}` : b.closest('.hidden-file') ? 'trace-recheck' : b.closest('.conn') ? 'conn' : b.closest('#receipts') ? 'rec' : b.closest('#cell-detail') ? 'cov' : 'rex';
    S.explain[scope] = b.dataset.owner;
    const holder = b.closest('form, li, .hidden-file, .card');
    const out = holder?.querySelector(':scope > .explain, .explain');
    if (out) out.textContent = OWNER_TEXT[b.dataset.owner];
    return;
  }
  const act = b.dataset.act;
  if (act === 'ask') { island.el.querySelector('.cue-orb')?.click(); return; }
  if (act === 'trace') { navigate('trace', `trace-${b.dataset.period}`); return; }
  if (act === 'period') { S.tracePeriod = b.dataset.period; S.traced = false; S.row = null; page.update(); return; }
  if (act === 'trace-toggle') { page.toggleTrace(); return; }
  if (act === 'row') { page.selectRow(b.dataset.row); return; }
  if (act === 'row-close') { page.selectRow(S.row); return; }
  if (act === 'goto-row') { S.tracePeriod = b.dataset.period; S.traced = true; S.row = b.dataset.row; navigate('trace'); return; }
  if (act === 'cell') { S.cell = b.dataset.cell; delete S.explain.cov; page.update(); return; }
  if (act === 'request-approval') {
    const q = dev.page.querySelector('#fu-q')?.value.trim() ?? '';
    S.draft.question = q;
    if (!q) { dev.page.querySelector('#composer .saved').textContent = 'Write the question first.'; return; }
    S.draft.email = 'AWAITING_APPROVAL';
    const ex = exById(S.draft.subject);
    const id = `fu-new-${S.draft.subject}`;
    const existing = S.followUps.find((f) => f.id === id);
    if (existing) Object.assign(existing, { question: q, email: 'AWAITING_APPROVAL', nextAction: 'Approve it here, then send it yourself. Mhoo never sends.' });
    else S.followUps.push({ id, question: q, subject: { kind: 'TRANSACTION', reference: S.draft.subject, label: `${monthShort(ex.period)} · ${EX_KIND[ex.exceptionKey]} ${money(ex.differenceCents)}` }, state: 'TO_DO', email: 'AWAITING_APPROVAL', owner: 'Owner', recipient: S.draft.subject === 'exception-bank-control-2026-03' ? 'Bank settlement desk (synthetic)' : 'Bookkeeper (synthetic)', nextAction: 'Approve it here, then send it yourself. Mhoo never sends.', updated: 'today' });
    derive(); page.composer(); page.list(); island.refresh();
    return;
  }
  if (b.dataset.go) { navigate(b.dataset.go, b.dataset.actId || null); }
});
dev.page.addEventListener('change', (e) => {
  const t = e.target;
  if (t.matches?.('input[type="radio"][name^="keep-"]')) {
    const key = t.name.slice(5);
    S.choice[key] = t.value;
    const ex = exById(key);
    const pv = t.closest('form').querySelector('[data-preview]');
    if (pv) pv.textContent = `If you recorded “keep ${t.value}”, exposure would fall from ${money(V.exposure)} to ${money(V.exposure - ex.differenceCents)} and the other row would stay in lineage. Nothing is recorded here.`;
  }
  if (t.id === 'fu-subject') { S.draft.question = dev.page.querySelector('#fu-q')?.value ?? S.draft.question; switchDraft(t.value); page.composer(); }
});
dev.page.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'fu-q' && S.draft.email === 'AWAITING_APPROVAL') {
    // Editing a question after asking for approval takes it back to Draft; it must be asked again.
    S.draft.email = 'DRAFT'; S.draft.question = t.value;
    const f = S.followUps.find((x) => x.id === `fu-new-${S.draft.subject}`);
    if (f) Object.assign(f, { email: 'DRAFT', nextAction: 'Edited after the request: ask for approval again.' });
    derive(); page.draftState?.(); page.list?.(); island.refresh();
  }
  if (t.matches?.('form[data-form="dispo"] textarea') && S.recheckArmed && S.mode === 'fixture') {
    S.recheckArmed = false;
    // Prototype stand-in for a real event: the scheduled March control re-check lands while
    // the owner is typing. The island holds it (he's working) and delivers it when he saves.
    clearTimeout(S.recheckTimer);
    S.recheckTimer = setTimeout(() => {
      S.recheckTimer = 0;
      S.recheck = true; S.recheckAt = clock();
      dev.page.querySelectorAll('[data-recheck]').forEach((el) => { el.innerHTML = recheckHTML(); });
      dev.page.querySelector('.dispo .hint')?.remove();
      island.refresh();
    }, 1400);
  }
});
dev.page.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  if (f.dataset.form === 'dispo') {
    S.notes[f.dataset.key] = f.querySelector('textarea').value;
    f.querySelector('.saved').textContent = 'Saved on this page only. A note is not a decision.';
  }
  if (f.dataset.form === 'fu-draft') {
    S.draft.question = f.querySelector('#fu-q').value;
    S.draft.saved = true;
    f.querySelector('.saved').textContent = 'Draft saved on this page only.';
  }
  island.ingest({ type: 'save' });
});

// ---- dock: prototype-only switches ------------------------------------------------------------
const dock = dev.root.querySelector('.pd-dock');
const extra = document.createElement('span');
extra.className = 'ft-dock';
extra.innerHTML = `<button type="button" data-ft="tour" aria-pressed="false">Tour</button>
  <button type="button" data-ft="custody" aria-pressed="false" title="Simulate a stored file that no longer matches its receipt"><span class="pd-long">Custody alarm</span><span class="pd-short">Alarm</span></button>
  <span class="pd-seg ft-data" role="group" aria-label="Data source" hidden><button type="button" data-data="fixture" aria-pressed="true"><span class="pd-long">Fixture</span><span class="pd-short">Fix</span></button><button type="button" data-data="real" aria-pressed="false"><span class="pd-long">Local real</span><span class="pd-short">Real</span></button></span>`;
dock.insertBefore(extra, dock.querySelector('.pd-seg'));
function setCustody(on) {
  S.custody = !!on;
  extra.querySelector('[data-ft="custody"]').setAttribute('aria-pressed', String(S.custody));
  update();
}
function switchDraft(subject) {
  if (S.draft.subject === subject) return;
  S.drafts[S.draft.subject] = S.draft;
  S.draft = S.drafts[subject] ?? { subject, question: '', email: 'DRAFT', saved: false };
}
function setMode(mode) {
  if (mode === 'real' && !S.real) return;
  tour?.stop();
  S.mode = mode;
  S.data = mode === 'real' ? S.real : FIXTURE;
  if (mode === 'real') { S.custody = false; S.tracePeriod = S.real.months.at(-2) ?? S.real.months[0]; S.cell = S.real.coverage[0]?.key; }
  else { S.tracePeriod = '2026-02'; S.cell = 'coverage-toast-2026-02'; }
  S.traced = false; S.row = null;
  extra.querySelectorAll('[data-data]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.data === mode)));
  extra.querySelector('[data-ft="custody"]').disabled = mode === 'real';
  extra.querySelector('[data-ft="custody"]').setAttribute('aria-pressed', 'false');
  dev.root.querySelector('.pd-note').textContent = mode === 'real' ? 'Local real data · this machine only · never published' : 'Synthetic fixture · nothing here approves, sends, imports or spends';
  derive(); render(); island.refresh();
}
extra.addEventListener('click', (e) => {
  const b = e.target instanceof Element ? e.target.closest('button') : null;
  if (!b) return;
  if (b.dataset.ft === 'custody') setCustody(!S.custody);
  if (b.dataset.ft === 'tour') tour.toggle();
  if (b.dataset.data) setMode(b.dataset.data);
});

// Local real data: only ever looked for on this machine (localhost), never in a published copy.
async function probeReal() {
  if (!/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
  try {
    const r = await fetch('./real-data.local.json', { cache: 'no-store' });
    if (!r.ok) return;
    S.real = M.fromReal(await r.json());
    extra.querySelector('.ft-data').hidden = false;
  } catch { /* no local file: fixture only */ }
}

// ---- go ------------------------------------------------------------------------------------
render();
const tour = mountTour({ dev, island, app: {
  S, get V() { return V; }, navigate, setCustody, get page() { return page; }, update, render,
  button: () => extra.querySelector('[data-ft="tour"]'),
} });
const ready = probeReal();
window.financeProto = { island, dev, S, get V() { return V; }, tour, navigate, setCustody, setMode, ready, get page() { return page; } }; // debug handle for checks
