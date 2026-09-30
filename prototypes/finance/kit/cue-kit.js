// cue-kit.js: the Cue island, small and generic. One capsule at the top left of the app's
// screen that says the one thing that matters next in this app, with a reason you can check.
//
//   const island = mountIsland(root, {
//     appLabel: 'Finance',
//     sections: [{ label: 'Overview', route: 'overview', current: true }, …],
//     getCandidates: () => [{ id, tier: 'P0'|'P1'|'P2'|'P3', kicker, sentence, because,
//                             action: { label, route, pageAct }, objectId, app }],
//     ask: (text) => ({ kicker, answer, action, provenance }) | null,
//     onNavigate: (route, pageAct) => {},
//   });
//   island.refresh(); island.ingest({ type: 'save' }); island.setSections([...]); island.destroy();
//
// Rules it keeps (from the Cue prototype, MHO-317):
// - One line, ranked P0 > P1 > P2 > P3, then the order getCandidates() returns (the app's own
//   order). A better line replaces the current one only after the current one has been up
//   20 s (hysteresis), unless it is P0 or the current one is gone.
// - New P1 news while you're working (a field focused, media playing) is held and delivered
//   as a Lean at your next break: save/submit, route change, media ended, leaving a field for
//   8 s, or 45 s idle. Nothing is held longer than 25 min. P0 always breaks through.
// - "because" shows on hover or keyboard focus. The object the line is about
//   ([data-island-object]) gets a dotted ring.
// - Esc (while you're on the capsule) and "Not now" set the line aside, with "Set aside · Undo".
// - Ask (⌘K or /): ghost text from the top candidate; answers come from opts.ask, locally.
// - It never approves, sends, publishes, merges, deploys or spends: an action whose label
//   says so is rewritten to "Open →", and typed commands like "send …" are refused.
// - It never calls focus() on load. It only moves focus when you open Ask (and back on Esc).
// - Reduced motion: html[data-motion="reduce"], or the OS setting when data-motion is unset.
// - Privacy: it reads only [data-island-object] ids and field labels, never values or keys
//   (except its own shortcuts and the Ask input).

import { mountOrb } from './orb.js';

const TIERS = { P0: 0, P1: 1, P2: 2, P3: 3 };
export const TIMING = Object.freeze({
  hysteresisMs: 20_000, leanMs: 6_000, idleBreakMs: 45_000, fieldBlurBreakMs: 8_000,
  ceilingMs: 25 * 60_000, ackMs: 4_000, whyEnterMs: 400, whyGraceMs: 600,
  ringHoldMs: 2_400, weavingMs: 1_600, resolveMs: 300, announceQuietMs: 1_200,
});
// An action label that starts with one of these verbs would do something, not open something.
const AUTHORITY = /^\s*(approve|send|resend|publish|unpublish|merge|deploy|release|pay|spend|charge|refund|delete|remove|archive|post|sync|import|submit|resubmit|retry|run|start|generate|render|sign|transfer|buy|order|accept|reject|void)\b/i;
const ASK_VERB = /^(?:(?:please|can you|could you|hey|go ahead and|just)\s+)*(approve|send|publish|merge|deploy|pay|spend|charge|refund|delete|post|sync|import|submit|sign|transfer|buy|order)\b/i;
const BREAK_WORDS = {
  save: 'you saved', submit: 'you submitted', route: 'you changed page', 'media-ended': 'the media ended',
  'field-blur': 'you left the field', idle: 'you paused', ceiling: 'it had waited 25 min', break: 'you paused',
  'lean-ended': 'the cue before it ended', 'alert-cleared': 'the alert cleared',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const now = () => performance.now();
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const lerp = (a, b, t) => a + (b - a) * t;
const pad = (n) => String(n).padStart(2, '0');
const clockOf = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const fmtDur = (ms) => { const s = Math.max(1, Math.round(ms / 1000)); return s < 60 ? `${s} s` : `${Math.round(s / 60)} min`; };
const isEditable = (el) => !!el && el instanceof Element && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) &&
  !(el.tagName === 'INPUT' && /^(button|submit|reset|checkbox|radio|range|color|file|image)$/i.test(el.type));
const store = (kind) => ({
  get(k) { try { return JSON.parse(window[kind].getItem(k) ?? 'null'); } catch { return null; } },
  set(k, v) { try { window[kind].setItem(k, JSON.stringify(v)); } catch { /* storage may be blocked */ } },
});
const local = store('localStorage');
const session = store('sessionStorage');

/** True when motion should be reduced: html[data-motion="reduce"], else the OS setting. */
export function reducedMotion() {
  const m = document.documentElement.dataset.motion;
  if (m) return m === 'reduce';
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** Arrow split so the action reads "Label →" with the arrow outside the accessible name. */
const splitLabel = (label) => {
  const m = String(label ?? '').match(/^(.*?)\s*→\s*$/);
  return m ? { text: m[1], arrow: true } : { text: String(label ?? ''), arrow: false };
};

/**
 * Mount the island into `root` (an element positioned relative; the app's screen).
 * @returns {{refresh(): void, ingest(event: object): void, setSections(sections: object[]): void,
 *            destroy(): void, getLog(): object[], onLog(fn: Function): Function, getState(): object}}
 */
export function mountIsland(root, opts = {}) {
  if (!(root instanceof Element)) throw new TypeError('mountIsland needs a root element');
  const appLabel = String(opts.appLabel ?? 'App');
  const scope = opts.scope instanceof Element ? opts.scope : document;
  const keyBase = `cue-kit:${appLabel.toLowerCase().replace(/\W+/g, '-')}`;
  let sections = Array.isArray(opts.sections) ? opts.sections.slice() : [];

  // ---- state ----------------------------------------------------------------
  const S = {
    booted: false, cands: [], byId: new Map(), seen: new Map(),
    line: null, lineSince: 0, keptKey: null, recheckT: 0,
    cue: null, cueSeq: 0, leanLeft: 0, leanT: 0, leanStart: 0,
    held: [], alerted: new Set(),
    dismissed: new Map(Object.entries(session.get(`${keyBase}:aside`) ?? {})),
    notNow: new Map(Object.entries(local.get(`${keyBase}:notnow`) ?? {})),
    lastDismiss: null, ack: { until: 0, t: 0 },
    working: { field: null, fieldLabel: null, media: new Set(), manual: null, blurT: 0 },
    lastActivity: now(), lastPing: 0,
    ui: { hover: false, why: false, focus: false, clicked: false, hoverT: 0, leaveT: 0, escAt: -1e9 },
    ask: { open: false, prev: null, ghost: '', result: null, typingUntil: 0, resolvingUntil: 0 },
    weavingUntil: 0, orbT: 0, exempt: null, shape: 'rest', shownSig: '', ring: { el: null, t: 0, raf: 0 },
    log: [], logFns: new Set(), destroyed: false,
  };

  // ---- DOM ------------------------------------------------------------------
  const host = document.createElement('div');
  host.className = 'cue-host';
  host.innerHTML = `
    <div class="cue" data-shape="rest" role="region" aria-label="${esc(appLabel)} island">
      <button type="button" class="cue-orb" data-cue-key="orb" aria-label="Ask ${esc(appLabel)} (⌘K)" aria-expanded="false"><canvas></canvas></button>
      <div class="cue-lane">
        <div class="cue-row1"><nav class="cue-sections" aria-label="${esc(appLabel)} sections"></nav><span class="cue-kbd" aria-hidden="true">⌘K</span></div>
        <div class="cue-body" data-layout="line" data-row3="off">
          <div class="cue-row2"><div class="cue-text"><span class="cue-kicker"></span><span class="cue-sentence"></span></div><span class="cue-action-slot"></span></div>
          <div class="cue-row3"><span class="cue-row3-text"></span><span class="cue-ack" hidden>Set aside · <button type="button" class="cue-undo" data-cue-key="undo">Undo</button></span><button type="button" class="cue-notnow" data-cue-key="notnow">Not now</button></div>
        </div>
        <div class="cue-ask" hidden>
          <div class="cue-row2 cue-ask-row"><span class="cue-kicker">ASK</span>
            <label class="cue-ask-field"><span class="vh">Ask ${esc(appLabel)}</span><span class="cue-ghost" aria-hidden="true"><span class="cue-ghost-typed"></span><span class="cue-ghost-rest"></span></span><input class="cue-ask-input" type="text" autocomplete="off" spellcheck="false" enterkeyhint="go"></label>
          </div>
          <div class="cue-ask-alert" hidden><div class="cue-row2"><span class="cue-kicker" data-tone="amber"></span><span class="cue-action-slot"></span><span class="cue-sentence"></span></div></div>
          <div class="cue-answer" hidden data-layout="wrap"><div class="cue-row2"><span class="cue-kicker"></span><span class="cue-action-slot"></span><span class="cue-sentence"></span></div><div class="cue-provenance"></div></div>
        </div>
      </div>
      <canvas class="cue-reveal" aria-hidden="true"></canvas>
    </div>
    <div class="vh" aria-live="polite" aria-atomic="true"></div>
    <div class="vh" aria-live="assertive" aria-atomic="true"></div>`;
  root.prepend(host); // first in DOM and tab order: it sits above the page
  const $ = (sel) => host.querySelector(sel);
  const node = $('.cue'), body = $('.cue-body'), askPane = $('.cue-ask'), input = $('.cue-ask-input');
  const askAlert = $('.cue-ask-alert');
  const answerEl = $('.cue-answer'), navEl = $('.cue-sections'), orbBtn = $('.cue-orb'), revealCv = $('.cue-reveal');
  const [livePolite, liveAssertive] = host.querySelectorAll('[aria-live]');
  const loadedAt = now();

  let orb = null;
  try { orb = mountOrb(orbBtn.querySelector('canvas'), { size: 64, preset: 'breathing', tint: 'ink', reducedMotion: reducedMotion() }); }
  catch (err) { console.warn('[cue-kit] orb unavailable', err); }

  // ---- log (the "Why" view reads this) --------------------------------------------
  function log(kind, text) {
    const entry = { at: Date.now(), clock: clockOf(), kind, text };
    S.log.unshift(entry);
    if (S.log.length > 40) S.log.length = 40;
    for (const fn of S.logFns) { try { fn(entry, S.log.slice()); } catch (e) { console.error(e); } }
  }
  const nameOf = (c) => (c ? `“${c.sentence.replace(/[.!?]+$/, '')}”` : 'nothing');

  // ---- candidates -------------------------------------------------------------------
  function normalize(list) {
    const out = [];
    const ids = new Set();
    (Array.isArray(list) ? list : []).forEach((raw, i) => {
      if (!raw || raw.id == null || ids.has(String(raw.id))) return;
      const tier = TIERS[raw.tier] ?? (Number.isInteger(raw.tier) ? Math.max(0, Math.min(3, raw.tier)) : 2);
      let action = raw.action && raw.action.label ? { label: String(raw.action.label), route: raw.action.route ?? null, pageAct: raw.action.pageAct ?? null } : null;
      if (action && AUTHORITY.test(action.label)) {
        const key = `contract:${raw.id}:${action.label}`;
        if (!S.seen.has(key)) {
          S.seen.set(key, true);
          log('contract', `Changed the action "${action.label}" to "Open →". The island never approves, sends, publishes, merges, deploys or spends; that stays on the page.`);
        }
        action = { ...action, label: 'Open →' };
      }
      ids.add(String(raw.id));
      out.push({
        id: String(raw.id), tier, order: i, kicker: String(raw.kicker ?? '').toUpperCase(), sentence: String(raw.sentence ?? ''),
        because: raw.because ? String(raw.because) : '', action, objectId: raw.objectId ?? null, app: raw.app ?? appLabel,
        tone: raw.tone ?? (tier === 0 ? 'amber' : 'blue'), askHint: raw.ask ?? null,
        sig: `${raw.id}|${raw.sentence}`,
      });
    });
    return out.sort((a, b) => a.tier - b.tier || a.order - b.order);
  }
  // Esc sets an item aside for the session (by id); Not now hides it until its words change.
  const isAside = (c) => S.dismissed.has(c.id) || S.notNow.get(c.id) === c.sig;
  const isHeld = (c) => S.held.some((h) => h.c.id === c.id);
  // Held news can't take the line before it is delivered at a break.
  const eligible = () => S.cands.filter((c) => !isAside(c) && !isHeld(c));
  const tierName = (c) => `P${c.tier}`;

  // ---- working / breaks -------------------------------------------------------------
  function workingState() {
    if (S.working.manual) return { why: 'manual', where: S.working.manual };
    if (S.working.field) return { why: 'field', where: `were in ${S.working.fieldLabel}` };
    if (S.working.media.size) return { why: 'media', where: 'were watching' };
    if (S.ask.open) return { why: 'ask', where: 'were asking' };
    return null;
  }
  function hold(c, w) {
    if (S.held.some((h) => h.c.id === c.id)) return;
    S.held.push({ c, at: now(), why: w.why, where: w.where });
    log('held', `Held ${nameOf(c)} because you ${w.where}. It comes at your next break: save, page change, media end or 45 s idle (at most 25 min).`);
  }
  function naturalBreak(name) {
    if (!S.held.length) return;
    if (S.cands.some((c) => c.tier === 0)) { log('held', `Break (${BREAK_WORDS[name] ?? name}), but the P0 stays first; held news keeps waiting.`); return; }
    const live = S.held.map((h) => ({ h, c: S.byId.get(h.c.id) })).filter((x) => x.c && !isAside(x.c)).sort((a, b) => a.c.tier - b.c.tier || a.c.order - b.c.order);
    S.held = [];
    pickLine();
    if (!live.length) { log('held', `Break (${BREAK_WORDS[name] ?? name}); what was held has already resolved.`); return; }
    const [top, ...rest] = live;
    deliverLean(top.c, { held: top.h, breakName: name });
    if (rest.length) log('held', `Also held: ${rest.map((x) => nameOf(x.c)).join(', ')}. They stay in the ranking instead of a second interruption.`);
  }

  // ---- lean / alert -------------------------------------------------------------------
  function deliverLean(c, { held = null, breakName = null } = {}) {
    const because = held
      ? `Held ${fmtDur(now() - held.at)} while you ${held.where} · delivered when ${BREAK_WORDS[breakName] ?? breakName}`
      : c.because;
    S.cue = { mode: 'lean', c, because, seq: ++S.cueSeq };
    S.weavingUntil = now() + TIMING.weavingMs;
    log('delivered', held ? `Delivered ${nameOf(c)} as a Lean when ${BREAK_WORDS[breakName] ?? breakName} (held ${fmtDur(now() - held.at)}).` : `Delivered ${nameOf(c)} as a Lean: new ${tierName(c)} news and you were browsing.`);
    // A delivered Lean has already announced itself, so it may take the line now (no hysteresis).
    const el = eligible();
    const ci = el.findIndex((x) => x.id === c.id), li = el.findIndex((x) => x.id === S.line?.id);
    if (ci >= 0 && S.line?.id !== c.id && (li < 0 || ci <= li)) setLine(el[ci], 'the Lean announced it and it ranks at least as high');
    startLeanTimer();
    announce(`${c.kicker}: ${c.sentence}`);
    render({ reveal: true });
    ringOn(c.objectId);
  }
  function startLeanTimer() {
    clearTimeout(S.leanT);
    S.leanLeft = TIMING.leanMs;
    resumeLean();
  }
  function pauseLean() {
    if (!S.leanT) return;
    clearTimeout(S.leanT);
    S.leanT = 0;
    S.leanLeft = Math.max(0, S.leanLeft - (now() - S.leanStart));
  }
  function resumeLean() {
    if (!S.cue || S.cue.mode !== 'lean' || S.leanT) return;
    if (S.ui.hover || S.ui.focus) return; // paused while you're on it
    S.leanStart = now();
    S.leanT = setTimeout(() => { S.leanT = 0; endLean(); }, Math.max(200, S.leanLeft));
  }
  function endLean() {
    if (S.cue?.mode !== 'lean') return;
    S.cue = null;
    // News that waited behind this Lean (not behind your work) comes next.
    if (S.held.length && S.held.every((h) => h.why === 'cue') && !workingState()) naturalBreak('lean-ended');
    render();
  }

  // ---- line picking (hysteresis) ----------------------------------------------------------
  function setLine(c, reason) {
    const prev = S.line;
    S.line = c ?? null;
    S.lineSince = now();
    S.keptKey = null;
    clearTimeout(S.recheckT);
    if (reason) log('line', c ? `Line: ${nameOf(c)} (${tierName(c)}) because ${reason}.${prev && prev.id !== c.id ? ` It replaced ${nameOf(prev)}.` : ''}` : `Line: nothing waiting in ${appLabel}; the island stays quiet.`);
    if (c && (!prev || prev.id !== c.id)) ringOn(c.objectId);
  }
  function pickLine() {
    const el = eligible();
    const top = el[0] ?? null;
    const cur = S.line ? el.find((c) => c.id === S.line.id) ?? null : null;
    if (cur) S.line = cur; // fresh copy of the same candidate (its words may have changed)
    if (!top) { if (S.line) setLine(null, 'nothing is waiting'); return; }
    if (!S.line) return setLine(top, S.booted ? 'it ranks first' : `it ranks first in ${appLabel}`);
    if (!cur) {
      const gone = S.byId.get(S.line.id);
      return setLine(top, gone && isAside(gone) ? `you set ${nameOf(gone)} aside` : `${nameOf(S.line)} was resolved`);
    }
    if (top.id === cur.id) return;
    if (S.exempt) return setLine(top, S.exempt);
    const better = top.tier < cur.tier || (top.tier === cur.tier && top.order < cur.order);
    if (!better) return;
    if (top.tier === 0) return setLine(top, 'P0 always comes first');
    const up = now() - S.lineSince;
    if (up >= TIMING.hysteresisMs) return setLine(top, `it outranks ${nameOf(cur)} (${tierName(top)} vs ${tierName(cur)}) and the old line had ${Math.round(up / 1000)} s`);
    const key = `${cur.id}>${top.id}`;
    if (S.keptKey !== key) {
      S.keptKey = key;
      log('kept', `Kept ${nameOf(cur)}: ${nameOf(top)} ranks higher, but a line stays at least 20 s so it doesn't flicker (up ${Math.round(up / 1000)} s).`);
    }
    clearTimeout(S.recheckT);
    S.recheckT = setTimeout(() => { if (!S.destroyed) { pickLine(); render(); } }, TIMING.hysteresisMs - up + 50);
  }

  // ---- refresh ------------------------------------------------------------------------
  function refresh() {
    if (S.destroyed) return;
    let list;
    try { list = opts.getCandidates ? opts.getCandidates() : []; }
    catch (err) { console.error('[cue-kit] getCandidates threw', err); list = []; }
    S.cands = normalize(list);
    S.byId = new Map(S.cands.map((c) => [c.id, c]));
    const fresh = S.cands.filter((c) => S.seen.get(c.id) !== c.sig);
    for (const c of S.cands) S.seen.set(c.id, c.sig);

    // P0: breaks through everything. The highest-ranked P0 is the alert; each new one is
    // announced once; one that resolves and comes back alerts again.
    const p0s = S.cands.filter((c) => c.tier === 0);
    for (const sig of [...S.alerted]) if (!p0s.some((c) => c.sig === sig)) S.alerted.delete(sig);
    const newP0 = p0s.filter((c) => !S.alerted.has(c.sig));
    let alertCleared = false;
    if (p0s.length) {
      const top = p0s[0];
      newP0.forEach((c) => S.alerted.add(c.sig));
      if (S.cue?.mode === 'lean') { clearTimeout(S.leanT); S.leanT = 0; }
      const seq = newP0.length || S.cue?.mode !== 'alert' || S.cue.c.id !== top.id ? ++S.cueSeq : S.cue.seq;
      S.cue = { mode: 'alert', c: top, because: top.because, seq };
      if (S.line?.id !== top.id) setLine(top, 'P0 always comes first, even while you work');
      for (const c of newP0) {
        log('alert', `Broke through with ${nameOf(c)}: P0 means money or data may be at risk. It can't be set aside until it's resolved.`);
        announce(`${c.kicker}: ${c.sentence}`, true);
      }
    } else if (S.cue?.mode === 'alert') {
      log('alert', `The alert cleared: ${nameOf(S.cue.c)} is no longer P0.`);
      S.cue = null;
      alertCleared = true;
    }

    // P1 news (after the first refresh): a Lean now, or held until your next break.
    if (S.booted) {
      const news = fresh.filter((c) => c.tier === 1 && !isAside(c));
      for (const c of news) {
        if (S.line?.id === c.id) continue;
        const w = workingState();
        if (p0s.length) hold(c, { why: 'alert', where: 'had an alert to read' });
        else if (w) hold(c, w);
        else if (S.cue) hold(c, { why: 'cue', where: 'were reading another cue' });
        else deliverLean(c);
      }
    }
    // Held items that resolved while waiting fall away quietly.
    S.held = S.held.filter((h) => S.byId.has(h.c.id));
    if (S.cue?.mode === 'lean' && !S.byId.has(S.cue.c.id)) S.cue = null;

    pickLine();
    S.booted = true;
    if (alertCleared && !workingState()) naturalBreak('alert-cleared');
    render();
  }

  // ---- rendering ----------------------------------------------------------------------
  function currentView() {
    if (S.cue) {
      const c = S.byId.get(S.cue.c.id) ?? S.cue.c;
      return { mode: S.cue.mode, c, because: S.cue.because, seq: S.cue.seq, dismissible: S.cue.mode !== 'alert' };
    }
    if (S.line) return { mode: 'line', c: S.line, because: S.line.because, seq: null, dismissible: S.line.tier !== 0 };
    return { mode: 'quiet', c: { id: null, kicker: appLabel.toUpperCase(), sentence: 'Nothing needs you here right now.', action: null, tone: 'blue', objectId: null, tier: 3 }, because: '', dismissible: false };
  }
  function deriveShape(v) {
    if (S.ask.open) return 'ask';
    if (v.mode === 'alert') return 'alert';
    if (v.mode === 'lean') return 'lean';
    if (ackOn()) return 'why'; // "Set aside · Undo" stays reachable, even when nothing is left
    if ((S.ui.why || S.ui.focus) && (v.because || ackOn() || S.held.length) && v.mode !== 'quiet') return 'why';
    return 'rest';
  }
  const ackOn = () => S.ack.until > now();
  function row3Text(v, shape) {
    const parts = [];
    if (v.because) parts.push(/^held\b/i.test(v.because) ? v.because : `because ${v.because.replace(/^because\s+/i, '')}`);
    if (shape === 'why' && S.held.length) parts.push(`${S.held.length} held for your next pause`);
    return parts.join(' · ');
  }
  function actionHTML(a) {
    if (!a) return '';
    const { text, arrow } = splitLabel(a.label);
    return `<a class="cue-action" data-cue-key="action" href="#${esc(a.route ?? '')}" aria-label="${esc(text)}"><span class="cue-action-t">${esc(text)}</span>${arrow ? '<span class="cue-action-arrow" aria-hidden="true"> →</span>' : ''}</a>`;
  }
  function setAction(slot, a) {
    const had = document.activeElement && slot.contains(document.activeElement);
    const html = actionHTML(a);
    if (slot.innerHTML !== html) {
      slot.innerHTML = html;
      if (had) (slot.querySelector('.cue-action') ?? orbBtn).focus({ preventScroll: true }); // keep a keyboard user's place
    }
  }
  function fillBody(v, shape) {
    const layout = shape === 'lean' || shape === 'alert' ? 'wrap' : 'line';
    const r3 = (shape === 'why' || shape === 'lean' || shape === 'alert') && (row3Text(v, shape) || v.dismissible || ackOn());
    body.dataset.layout = layout;
    body.dataset.row3 = r3 ? 'on' : 'off';
    const k = body.querySelector('.cue-kicker');
    k.textContent = v.mode === 'lean' ? `${v.c.kicker} · JUST NOW` : v.c.kicker;
    k.dataset.tone = v.c.tone;
    body.querySelector('.cue-sentence').textContent = v.c.sentence;
    setAction(body.querySelector('.cue-action-slot'), v.c.action);
    const acking = ackOn();
    body.querySelector('.cue-row3-text').textContent = row3Text(v, shape);
    body.querySelector('.cue-row3-text').hidden = acking;
    body.querySelector('.cue-ack').hidden = !acking;
    body.querySelector('.cue-notnow').hidden = acking || !v.dismissible;
  }
  function targetHeight(shape) {
    const cs = getComputedStyle(node);
    const px = (name, d) => parseFloat(cs.getPropertyValue(name)) || d;
    const phone = node.offsetWidth < 500;
    const maxH = phone ? 172 : 140;
    const lastBottom = (el) => { let y = el.offsetHeight; for (let e = el; e && e !== node; e = e.offsetParent) y += e.offsetTop; return y + 1; };
    if (shape === 'ask') {
      const last = !askAlert.hidden ? (S.ask.result ? answerEl.querySelector('.cue-provenance') : askAlert) : S.ask.result ? answerEl.querySelector('.cue-provenance') : askPane.querySelector('.cue-ask-row');
      return Math.min(maxH + 28, Math.max(px('--cue-h-ask', 72), Math.ceil(lastBottom(last) + (phone ? 10 : 13))));
    }
    if (shape === 'lean' || shape === 'alert') {
      const last = body.dataset.row3 === 'on' ? body.querySelector('.cue-row3') : body.querySelector('.cue-row2');
      return Math.min(maxH, Math.max(px('--cue-h-lean', 112), Math.ceil(lastBottom(last) + (phone ? 10 : 13))));
    }
    if (shape === 'why') return px('--cue-h-why', 92);
    return px('--cue-h-rest', 72);
  }
  const TEXT_OUT = [{ opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' }, { opacity: 0, filter: 'blur(6px)', transform: 'translateY(-3px)' }];
  const TEXT_IN = [{ opacity: 0, filter: 'blur(6px)', transform: 'translateY(3px)' }, { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' }];

  function render({ reveal = false } = {}) {
    if (S.destroyed) return;
    const v = currentView();
    const shape = deriveShape(v);
    const sig = `${v.mode}|${v.c.id}|${v.c.kicker}|${v.c.sentence}|${v.seq}`;
    const major = sig !== S.shownSig;
    const first = !S.shownSig;
    S.shownSig = sig;
    if (S.shape !== shape) { S.shape = shape; node.dataset.shape = shape; }
    body.inert = shape === 'ask';
    askPane.hidden = shape !== 'ask';
    node.classList.toggle('is-asking', shape === 'ask');
    orbBtn.setAttribute('aria-expanded', String(shape === 'ask'));

    // A P0 while Ask is open: an amber strip under the question; the input keeps its focus.
    const stripOn = shape === 'ask' && v.mode === 'alert';
    node.classList.toggle('has-alert', stripOn);
    askAlert.hidden = !stripOn;
    if (stripOn) {
      askAlert.querySelector('.cue-kicker').textContent = v.c.kicker;
      askAlert.querySelector('.cue-sentence').textContent = v.c.sentence;
      setAction(askAlert.querySelector('.cue-action-slot'), v.c.action);
    }
    const doFill = () => fillBody(v, shape);
    if (major && !first && !reducedMotion() && document.visibilityState === 'visible') {
      const clone = body.cloneNode(true);
      clone.classList.add('is-out');
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
      host.querySelectorAll('.cue-body.is-out').forEach((e) => e.remove());
      body.after(clone);
      const out = clone.animate(TEXT_OUT, { duration: 140, easing: 'ease-in', fill: 'forwards' });
      out.onfinish = () => clone.remove();
      setTimeout(() => clone.remove(), 400);
      doFill();
      const parts = [body.querySelector('.cue-kicker'), body.querySelector('.cue-action-slot'), body.querySelector('.cue-row3')];
      if (!reveal) parts.push(body.querySelector('.cue-sentence'));
      parts.forEach((el) => el.animate(TEXT_IN, { duration: 220, delay: 120, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
      if (reveal) runReveal(body.querySelector('.cue-sentence'), 160);
    } else {
      doFill();
      if (major && !first && reducedMotion()) body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
    }
    node.style.height = `${targetHeight(shape)}px`;
    syncOrb(v);
    syncRing(shape, v);
    host.dataset.state = shape; // for tests and the Why view
  }

  function syncOrb(v) {
    if (!orb) return;
    const t = now();
    orb.setReducedMotion(reducedMotion());
    if (v.mode === 'alert') { orb.setPreset('breathing'); orb.setTint('amber'); orb.freeze(true); return; }
    orb.freeze(false);
    let preset = 'breathing', tint = 'ink', mix = 1;
    if (S.ask.resolvingUntil > t) preset = 'searching';
    else if (S.ask.open) preset = S.ask.typingUntil > t ? 'composing' : 'listening';
    else if (S.weavingUntil > t) { preset = 'weaving'; tint = 'blue'; }
    if (tint === 'ink' && S.held.length) { tint = 'blue'; mix = 0.6; }
    orb.setPreset(preset);
    orb.setTint(tint, { mix });
    const until = Math.max(S.ask.resolvingUntil, S.ask.typingUntil, S.weavingUntil);
    if (until > t) { clearTimeout(S.orbT); S.orbT = setTimeout(() => syncOrb(currentView()), until - t + 20); }
  }

  // ---- dotted ring --------------------------------------------------------------------
  function objectEl(id) {
    if (!id) return null;
    try { return scope.querySelector(`[data-island-object="${CSS.escape(String(id))}"]`); } catch { return null; }
  }
  function ringOn(id, holdMs = TIMING.ringHoldMs) {
    const el = objectEl(id);
    if (S.ring.el && S.ring.el !== el) ringOff();
    if (!el) return;
    S.ring.el = el;
    el.classList.add('cue-ring-target');
    cancelAnimationFrame(S.ring.raf);
    S.ring.raf = requestAnimationFrame(() => { if (!S.destroyed && S.ring.el === el) el.classList.add('is-ring-on'); });
    clearTimeout(S.ring.t);
    if (holdMs) S.ring.t = setTimeout(() => { if (S.shape !== 'why') ringOff(); }, holdMs);
  }
  function ringOff({ now: sync = false } = {}) {
    const el = S.ring.el;
    clearTimeout(S.ring.t);
    cancelAnimationFrame(S.ring.raf);
    S.ring.el = null;
    if (!el) return;
    el.classList.remove('is-ring-on');
    if (sync) { el.classList.remove('cue-ring-target'); return; }
    setTimeout(() => { if (!el.classList.contains('is-ring-on')) el.classList.remove('cue-ring-target'); }, 450);
  }
  function syncRing(shape, v) {
    if (shape === 'why' && v.c.objectId) ringOn(v.c.objectId, 0);
    else if (S.ring.el && !S.ring.t) ringOff();
  }

  // ---- stipple-to-type reveal (a Lean's sentence forms from blue dots) -------------------
  function runReveal(el, delay) {
    if (!el || reducedMotion()) return;
    const dots = sampleText(el);
    if (!dots.length) return;
    const W = Math.ceil(node.offsetWidth + 40), H = Math.ceil(node.offsetHeight + 60), R = 2;
    revealCv.width = W * R; revealCv.height = H * R;
    revealCv.style.width = `${W}px`; revealCv.style.height = `${H}px`;
    const g = revealCv.getContext('2d');
    el.style.opacity = '0';
    const t0 = now() + delay, conv = 260, fade = 120, sweep = 90;
    const xs = dots.map((d) => d.x), minX = Math.min(...xs), span = Math.max(1, Math.max(...xs) - minX);
    for (const d of dots) d.delay = ((d.x - minX) / span) * sweep;
    const step = () => {
      if (S.destroyed || !el.isConnected) return;
      const e = now() - t0;
      g.setTransform(R, 0, 0, R, 0, 0);
      g.clearRect(0, 0, W, H);
      if (e >= 0) {
        const k = clamp01((e - conv) / fade);
        el.style.opacity = k > 0 ? String(easeOutCubic(k)) : '0';
        if (k >= 1) { el.style.opacity = ''; g.clearRect(0, 0, W, H); return; }
        const inkK = clamp01(k * 2);
        const col = `${Math.round(lerp(7, 23, inkK))},${Math.round(lerp(92, 32, inkK))},${Math.round(lerp(255, 51, inkK))}`;
        for (const d of dots) {
          const p = clamp01((e - d.delay) / (conv - sweep));
          if (p <= 0) continue;
          const q = easeOutCubic(p), a = q * d.a * (1 - k);
          if (a < 0.02) continue;
          g.fillStyle = `rgba(${col},${a.toFixed(3)})`;
          g.fillRect(d.x + d.jx * (1 - q) - 0.8, d.y + d.jy * (1 - q) - 0.8, 1.6, 1.6);
        }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function sampleText(el) {
    const tn = el.firstChild;
    if (!tn || tn.nodeType !== 3 || !tn.data.trim()) return [];
    const capR = node.getBoundingClientRect();
    const scale = capR.width / (node.offsetWidth || 1) || 1;
    const lx = (x) => (x - capR.left) / scale, ly = (y) => (y - capR.top) / scale;
    const elR = el.getBoundingClientRect();
    const box = { x0: Math.floor(lx(elR.left)) - 2, y0: Math.floor(ly(elR.top)) - 2, x1: Math.ceil(lx(elR.right)) + 2, y1: Math.ceil(ly(elR.bottom)) + 2 };
    const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
    if (bw <= 0 || bh <= 0) return [];
    const R = 2, oc = document.createElement('canvas');
    oc.width = bw * R; oc.height = bh * R;
    const o = oc.getContext('2d', { willReadFrequently: true });
    const cs = getComputedStyle(el);
    o.setTransform(R, 0, 0, R, -box.x0 * R, -box.y0 * R);
    o.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    o.fillStyle = '#000';
    const m = o.measureText('Hg');
    const asc = m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.9;
    const range = document.createRange();
    const re = /\S+/g;
    let mm;
    while ((mm = re.exec(tn.data))) {
      range.setStart(tn, mm.index); range.setEnd(tn, mm.index + mm[0].length);
      const rr = range.getClientRects()[0];
      if (!rr || ly(rr.top) > box.y1 - 4) continue;
      o.fillText(mm[0], lx(rr.left), ly(rr.top) + asc);
    }
    const data = o.getImageData(0, 0, oc.width, oc.height).data;
    const C = 3 * R, dots = [];
    for (let cy = 0; cy < oc.height; cy += C) for (let cx = 0; cx < oc.width; cx += C) {
      let sum = 0, sx = 0, sy = 0;
      for (let y = cy; y < Math.min(cy + C, oc.height); y++) for (let x = cx; x < Math.min(cx + C, oc.width); x++) {
        const a = data[(y * oc.width + x) * 4 + 3];
        if (a) { sum += a; sx += x * a; sy += y * a; }
      }
      const cover = sum / (255 * C * C);
      if (cover < 0.08) continue;
      dots.push({ x: box.x0 + sx / sum / R, y: box.y0 + sy / sum / R, a: Math.min(1, 0.45 + cover * 1.4), jx: (Math.random() * 2 - 1) * 6, jy: (Math.random() * 2 - 1) * 6 });
    }
    return dots;
  }

  // ---- announcements ------------------------------------------------------------------
  const announced = new Map();
  function announce(text, assertive = false, { asked = false } = {}) {
    if (!text) return;
    const t = now();
    for (const [k, at] of announced) if (t - at > 10_000) announced.delete(k);
    if (announced.has(text) && !asked) return;
    announced.set(text, t);
    const el = assertive ? liveAssertive : livePolite;
    el.textContent = '';
    // Screen readers drop live text written while the page is still loading.
    setTimeout(() => { if (!S.destroyed) el.textContent = text; }, asked ? 40 : Math.max(40, TIMING.announceQuietMs - (t - loadedAt)));
  }

  // ---- sections (row 1) -------------------------------------------------------------------
  function renderSections() {
    navEl.innerHTML = sections.map((s, i) => `<a href="#${esc(s.route)}" data-i="${i}"${s.current ? ' aria-current="page"' : ''}>${esc(String(s.label).toUpperCase())}</a>`).join('');
  }
  function setSections(next) {
    const before = sections.find((s) => s.current)?.route;
    sections = Array.isArray(next) ? next.slice() : [];
    renderSections();
    const after = sections.find((s) => s.current)?.route;
    if (S.booted && before !== after) ingest({ type: 'route', route: after });
  }

  // ---- dismiss / undo -------------------------------------------------------------------
  function dismiss(via) {
    const v = currentView();
    if (!v.dismissible || !v.c.id) return false;
    const c = v.c;
    if (via === 'notnow') { S.notNow.set(c.id, c.sig); local.set(`${keyBase}:notnow`, Object.fromEntries(S.notNow)); }
    else { S.dismissed.set(c.id, true); session.set(`${keyBase}:aside`, Object.fromEntries(S.dismissed)); }
    S.lastDismiss = { c, via, wasCue: S.cue ? { ...S.cue } : null };
    if (S.cue?.c.id === c.id) { S.cue = null; clearTimeout(S.leanT); S.leanT = 0; }
    log('dismiss', via === 'notnow'
      ? `Not now on ${nameOf(c)}: hidden until its words change. Undo for 4 s.`
      : `Esc set ${nameOf(c)} aside for this session. Undo for 4 s.`);
    clearTimeout(S.ack.t);
    S.ack.until = now() + TIMING.ackMs;
    S.ack.t = setTimeout(ackExpire, TIMING.ackMs);
    pickLine();
    render();
    return true;
  }
  function ackExpire() {
    const u = body.querySelector('.cue-undo');
    if (u && (u.matches(':hover') || document.activeElement === u)) { S.ack.until = now() + 600; S.ack.t = setTimeout(ackExpire, 600); return; }
    S.ack.until = 0;
    S.lastDismiss = null;
    render();
  }
  function undo() {
    const d = S.lastDismiss;
    if (!d) return;
    S.dismissed.delete(d.c.id); S.notNow.delete(d.c.id);
    session.set(`${keyBase}:aside`, Object.fromEntries(S.dismissed));
    local.set(`${keyBase}:notnow`, Object.fromEntries(S.notNow));
    clearTimeout(S.ack.t);
    S.ack.until = 0;
    S.lastDismiss = null;
    const c = S.byId.get(d.c.id);
    if (c) setLine(c, 'you pressed Undo');
    render();
  }

  // ---- Ask ---------------------------------------------------------------------------
  function ghostList() {
    const el = eligible();
    const top = el[0];
    const list = [];
    for (const c of el) if (c.askHint) list.push(c.askHint);
    if (top) list.push(`why ${top.kicker.toLowerCase()}`);
    list.push('what needs me', "what's next");
    return list;
  }
  function updateGhost() {
    const typed = input.value;
    const low = typed.toLowerCase();
    const g = ghostList().find((q) => q.toLowerCase().startsWith(low) && q.length > typed.length) ?? '';
    S.ask.ghost = g;
    $('.cue-ghost-typed').textContent = g ? typed : '';
    $('.cue-ghost-rest').textContent = g ? g.slice(typed.length) : '';
  }
  function openAsk() {
    if (S.ask.open) { input.focus({ preventScroll: true }); return; }
    S.ask.open = true;
    S.ask.prev = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    S.ask.result = null;
    answerEl.hidden = true;
    input.value = '';
    updateGhost();
    render();
    input.focus({ preventScroll: true });
    log('ask', 'Ask opened. Answers are worked out on this page from live state, with no AI call.');
  }
  function closeAsk({ restore = false } = {}) {
    if (!S.ask.open) return;
    S.ask.open = false;
    S.ask.result = null;
    answerEl.hidden = true;
    const prev = S.ask.prev;
    S.ask.prev = null;
    render();
    if (restore) (prev && prev.isConnected ? prev : orbBtn).focus({ preventScroll: true });
    if (!S.ask.open && !workingState()) naturalBreak('break');
  }
  function builtinAnswer(text) {
    const t = text.toLowerCase().trim();
    const el = eligible();
    const top = el[0];
    if (/^why\b/.test(t) && top) {
      const c = el.find((x) => t.includes(x.kicker.toLowerCase())) ?? top;
      return { kicker: c.kicker, answer: c.because ? `${c.sentence} Because ${c.because.replace(/^because\s+/i, '')}.` : c.sentence, action: c.action, provenance: `From the ${appLabel} line, ranked ${tierName(c)}.` };
    }
    if (top) {
      const rest = el.length - 1;
      return { kicker: top.kicker, answer: `Here's what's waiting: ${top.sentence}${rest ? ` Then ${rest} more.` : ''}`, action: top.action, provenance: `Ranked from ${el.length} live item${el.length === 1 ? '' : 's'} in ${appLabel}.` };
    }
    return { kicker: appLabel.toUpperCase(), answer: `Nothing needs you in ${appLabel} right now.`, action: null, provenance: 'From this page\'s live state.' };
  }
  function runAsk(raw) {
    const text = String(raw ?? '').trim() || S.ask.ghost;
    if (!text) return;
    S.ask.resolvingUntil = now() + TIMING.resolveMs;
    let r = null;
    const verb = text.match(ASK_VERB);
    if (verb) {
      const v = verb[1].toLowerCase();
      const top = eligible()[0];
      r = { kicker: 'ASK', answer: `I can't ${v} from here. That stays yours, on its own page, next to exactly what it does.`, action: top?.action ? { ...top.action, label: 'Open →' } : null, provenance: 'The island never approves, sends, publishes, merges, deploys or spends.' };
      log('refused', `Refused "${text}": typed words never start an action. Offered to open the page instead.`);
    } else {
      try { r = opts.ask ? opts.ask(text) : null; } catch (err) { console.error('[cue-kit] ask threw', err); r = null; }
      if (!r || !r.answer) r = builtinAnswer(text);
      if (r.action && AUTHORITY.test(r.action.label ?? '')) r = { ...r, action: { ...r.action, label: 'Open →' } };
      log('ask', `Answered "${text}" from live state: ${r.answer}`);
    }
    S.ask.result = r;
    answerEl.hidden = false;
    const k = answerEl.querySelector('.cue-kicker');
    k.textContent = String(r.kicker ?? 'ASK').toUpperCase();
    k.dataset.tone = 'blue';
    answerEl.querySelector('.cue-sentence').textContent = r.answer;
    answerEl.querySelector('.cue-provenance').textContent = r.provenance ?? '';
    setAction(answerEl.querySelector('.cue-action-slot'), r.action ?? null);
    if (!reducedMotion()) answerEl.animate(TEXT_IN, { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' });
    announce(`${r.kicker ?? 'Ask'}: ${r.answer}`, false, { asked: true });
    render();
  }

  // ---- events ----------------------------------------------------------------------
  function go(a) {
    if (!a) return;
    try { opts.onNavigate?.(a.route ?? null, a.pageAct ?? null); } catch (err) { console.error('[cue-kit] onNavigate threw', err); }
  }
  function onClick(e) {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    if (t.closest('.cue-orb')) { S.ask.open ? closeAsk({ restore: false }) : openAsk(); return; }
    if (t.closest('[data-cue-key="notnow"]')) { dismiss('notnow'); return; }
    if (t.closest('[data-cue-key="undo"]')) { undo(); return; }
    const sec = t.closest('.cue-sections a');
    if (sec) { e.preventDefault(); const s = sections[Number(sec.dataset.i)]; if (s) go({ route: s.route }); return; }
    const act = t.closest('.cue-action');
    if (!act) return;
    e.preventDefault(); // never lets a hash through
    if (answerEl.contains(act)) { const a = S.ask.result?.action; closeAsk(); go(a); return; }
    if (askAlert.contains(act)) { const a = S.cue?.c.action; closeAsk(); go(a); return; }
    const v = currentView();
    log('action', `You took ${nameOf(v.c)} → ${splitLabel(v.c.action?.label).text}. Navigation only; nothing was approved or sent.`);
    if (v.mode === 'lean') endLean();
    go(v.c.action);
  }
  function onKeydown(e) {
    const k = e.key;
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && (k === 'k' || k === 'K')) { e.preventDefault(); openAsk(); return; }
    if (S.ask.open && e.target === input) {
      S.ask.typingUntil = now() + 600;
      if (k === 'Escape') { e.preventDefault(); closeAsk({ restore: true }); S.ui.escAt = now(); }
      else if (k === 'Enter') { e.preventDefault(); runAsk(input.value); }
      else if ((k === 'Tab' && !e.shiftKey) || (k === 'ArrowRight' && input.selectionStart === input.value.length)) {
        if (S.ask.ghost && S.ask.ghost.toLowerCase() !== input.value.toLowerCase()) { e.preventDefault(); input.value = S.ask.ghost; updateGhost(); }
      }
      return;
    }
    if (k === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditable(e.target)) { e.preventDefault(); openAsk(); return; }
    if (k === 'Escape') {
      if (S.ask.open && node.contains(e.target)) { e.preventDefault(); closeAsk({ restore: true }); S.ui.escAt = now(); return; }
      if (e.repeat || now() - S.ui.escAt < 700 || ackOn()) return;
      const engaged = S.ui.focus || S.ui.clicked;
      if ((S.shape === 'lean' || S.shape === 'why') && engaged && dismiss('esc')) S.ui.escAt = now();
    }
  }
  function onEnter(e) {
    if (e.pointerType === 'touch') return;
    clearTimeout(S.ui.leaveT);
    S.ui.hover = true;
    pauseLean();
    clearTimeout(S.ui.hoverT);
    S.ui.hoverT = setTimeout(() => { S.ui.why = true; render(); }, TIMING.whyEnterMs);
  }
  function onLeave(e) {
    if (e.pointerType === 'touch') return;
    clearTimeout(S.ui.hoverT);
    clearTimeout(S.ui.leaveT);
    S.ui.leaveT = setTimeout(() => { S.ui.hover = false; S.ui.why = false; S.ui.clicked = false; resumeLean(); render(); }, TIMING.whyGraceMs);
  }
  function onFocusIn(e) {
    if (node.contains(e.target)) {
      let vis = false;
      try { vis = e.target.matches(':focus-visible'); } catch { /* old engines */ }
      if (vis && !askPane.contains(e.target) && !S.ui.focus) { S.ui.focus = true; pauseLean(); render(); }
      return;
    }
    if (host.contains(e.target)) return;
    if (isEditable(e.target) && (scope === document || scope.contains(e.target))) {
      clearTimeout(S.working.blurT);
      S.working.field = e.target;
      const el = e.target;
      const label = el.getAttribute('aria-label') || el.labels?.[0]?.textContent?.trim() || el.closest('[data-island-object]')?.dataset.islandLabel || 'a field';
      S.working.fieldLabel = label.length > 40 ? `${label.slice(0, 39)}…` : label;
      render();
    }
  }
  function onFocusOut(e) {
    if (node.contains(e.target)) {
      if (e.relatedTarget && node.contains(e.relatedTarget)) return;
      if (S.ui.focus) { S.ui.focus = false; resumeLean(); render(); }
      if (S.ask.open && !S.ask.result && !input.value) setTimeout(() => { if (S.ask.open && !node.contains(document.activeElement) && !input.value) closeAsk(); }, 0);
      return;
    }
    if (S.working.field && e.target === S.working.field) {
      S.working.field = null;
      clearTimeout(S.working.blurT);
      S.working.blurT = setTimeout(() => { if (!S.working.field && !workingState()) naturalBreak('field-blur'); }, TIMING.fieldBlurBreakMs);
      render();
    }
  }
  function onSubmit(e) { if (!host.contains(e.target)) setTimeout(() => ingest({ type: 'submit' }), 0); }
  function onMedia(e) {
    const m = e.target;
    if (!(m instanceof HTMLMediaElement) || (scope !== document && !scope.contains(m))) return;
    if (e.type === 'play' || e.type === 'playing') S.working.media.add(m);
    else S.working.media.delete(m);
    if (e.type === 'ended') naturalBreak('media-ended');
    render();
  }
  function onActivity(e) {
    const t = now();
    S.lastActivity = t;
    if (e.type === 'pointerdown' && !node.contains(e.target)) S.ui.clicked = false;
    if (e.type === 'pointerdown' && node.contains(e.target)) S.ui.clicked = true;
  }
  const tick = setInterval(() => {
    if (S.destroyed || document.hidden) return;
    if (!S.held.length) return;
    const t = now();
    const oldest = Math.min(...S.held.map((h) => h.at));
    if (t - oldest >= TIMING.ceilingMs) naturalBreak('ceiling');
    else if (t - S.lastActivity >= TIMING.idleBreakMs && !S.working.media.size && !S.working.manual) naturalBreak('idle');
  }, 1000);

  const motionObs = new MutationObserver(() => render());
  motionObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  let mq = null;
  try { mq = matchMedia('(prefers-reduced-motion: reduce)'); mq.addEventListener?.('change', render); } catch { /* ignore */ }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { node.style.height = `${targetHeight(S.shape)}px`; }) : null;
  ro?.observe(root);

  node.addEventListener('click', onClick);
  node.addEventListener('pointerenter', onEnter);
  node.addEventListener('pointerleave', onLeave);
  input.addEventListener('input', () => { S.ask.typingUntil = now() + 600; if (S.ask.result) { S.ask.result = null; answerEl.hidden = true; render(); } updateGhost(); syncOrb(currentView()); });
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  document.addEventListener('submit', onSubmit, true);
  for (const t of ['play', 'playing', 'pause', 'ended', 'emptied']) document.addEventListener(t, onMedia, true);
  for (const t of ['pointerdown', 'keydown', 'wheel', 'input']) document.addEventListener(t, onActivity, { capture: true, passive: true });

  // ---- public API ---------------------------------------------------------------------
  /** Tell the island something happened. Events:
   *  {type:'save'|'submit'|'media-ended'|'break'} a natural break (delivers what was held)
   *  {type:'route', route}                        page change: a break, then a refresh
   *  {type:'changed'}                             candidates changed: same as refresh()
   *  {type:'working', on:true|false, label}       you're busy in something the kit can't see
   *  {type:'activity'}                            the owner is active (resets the 45 s idle) */
  function ingest(ev = {}) {
    if (S.destroyed) return;
    const type = ev.type;
    if (type === 'save' || type === 'submit' || type === 'media-ended' || type === 'break') {
      S.lastActivity = now();
      naturalBreak(type);
      render();
    } else if (type === 'route') {
      S.lastActivity = now();
      if (S.cue?.mode === 'lean') { clearTimeout(S.leanT); S.leanT = 0; S.cue = null; }
      S.working.field = null;
      // A new page is a new context: re-read it first, then the best line here takes over
      // without waiting 20 s, then anything held is delivered.
      S.exempt = `you opened ${ev.route ?? 'a new page'}, a new context`;
      refresh();
      S.exempt = null;
      naturalBreak('route');
      render();
    } else if (type === 'changed') refresh();
    else if (type === 'working') {
      S.working.manual = ev.on ? String(ev.label ? `were in ${ev.label}` : 'were working') : null;
      if (!ev.on) naturalBreak('break');
      render();
    } else if (type === 'activity') S.lastActivity = now();
  }

  function destroy() {
    if (S.destroyed) return;
    S.destroyed = true;
    clearInterval(tick);
    clearTimeout(S.leanT); clearTimeout(S.recheckT); clearTimeout(S.ack.t); clearTimeout(S.orbT);
    clearTimeout(S.ui.hoverT); clearTimeout(S.ui.leaveT); clearTimeout(S.working.blurT);
    ringOff({ now: true });
    motionObs.disconnect();
    ro?.disconnect();
    mq?.removeEventListener?.('change', render);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    document.removeEventListener('submit', onSubmit, true);
    for (const t of ['play', 'playing', 'pause', 'ended', 'emptied']) document.removeEventListener(t, onMedia, true);
    for (const t of ['pointerdown', 'keydown', 'wheel', 'input']) document.removeEventListener(t, onActivity, { capture: true });
    orb?.destroy();
    host.remove();
    S.logFns.clear();
  }

  // Start from what's already true: a field focused or media playing before the island mounted.
  if (isEditable(document.activeElement)) onFocusIn({ target: document.activeElement });
  (scope === document ? document : scope).querySelectorAll('video, audio').forEach((m) => { if (!m.paused && !m.ended) S.working.media.add(m); });
  renderSections();
  refresh();
  log('line', `Mounted for ${appLabel}. It reads only this app's candidates and [data-island-object] ids.`);

  return {
    refresh, ingest, setSections, destroy,
    getLog: () => S.log.slice(),
    onLog(fn) { S.logFns.add(fn); return () => S.logFns.delete(fn); },
    getState: () => ({
      shape: S.shape, line: S.line ? { id: S.line.id, tier: tierName(S.line), sentence: S.line.sentence } : null,
      cue: S.cue ? { mode: S.cue.mode, id: S.cue.c.id } : null, held: S.held.map((h) => h.c.id),
      working: workingState()?.why ?? null, ask: S.ask.open,
    }),
    el: host,
  };
}
