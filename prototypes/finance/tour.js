// tour.js: a short guided tour of the Proof Field. Six moments; each one is played on the real
// page (the same clicks and keys a person would use) and each says how to do it by hand.
// The panel is prototype chrome (light/dark), outside the device.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function mountTour({ dev, island, app }) {
  const panel = document.createElement('aside');
  panel.className = 'ft-tour';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Tour');
  let token = 0;
  let running = -1;
  const results = new Map();

  const sleep = (ms, my) => new Promise((res, rej) => setTimeout(() => (my === token ? res() : rej(new Error('stopped'))), reducedMs(ms)));
  const reducedMs = (ms) => (document.documentElement.dataset.motion === 'reduce' ? Math.min(ms, 350) : ms);
  const $ = (sel) => dev.root.querySelector(sel);
  const cueAction = () => island.el.querySelector('.cue-body:not(.is-out) .cue-action');
  async function waitFor(fn, my, ms = 5000) {
    const until = performance.now() + ms;
    while (performance.now() < until) { if (fn()) return true; await sleep(80, my); }
    return !!fn();
  }
  function calm() {
    // Close Ask and leave any field, so the moment starts from a browsing state.
    const input = island.el.querySelector('.cue-ask-input');
    if (island.getState().ask) input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    island.el.querySelector('.cue')?.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
  }
  async function type(el, text, my, per = 45) {
    el.focus({ preventScroll: true });
    for (const ch of text) {
      el.value += ch;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(per, my);
    }
  }
  async function askLocal(q, my) {
    island.el.querySelector('.cue-orb').click();
    await sleep(250, my);
    const input = island.el.querySelector('.cue-ask-input');
    for (const ch of q) { input.value += ch; input.dispatchEvent(new Event('input', { bubbles: true })); await sleep(30, my); }
    await sleep(200, my);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await sleep(400, my);
    return island.el.querySelector('.cue-answer .cue-sentence')?.textContent ?? '';
  }

  const moments = [
    {
      title: 'First look',
      hand: 'Hover the Cue line at the top left, read its “because”, then press “Open exception →”.',
      async run(my) {
        app.setCustody(false);
        app.navigate('field');
        await sleep(900, my);
        const cue = island.el.querySelector('.cue');
        cue.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
        await waitFor(() => island.getState().shape === 'why', my, 2000);
        const line = island.getState().line;
        const because = island.el.querySelector('.cue-body:not(.is-out) .cue-row3-text')?.textContent ?? '';
        await sleep(1600, my);
        cue.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
        if (line?.id === 'feb-overlap') cueAction()?.click();
        else app.navigate('exceptions', 'exception-pos-overlap-2026-02');
        const merged = await waitFor(() => dev.page.querySelector('[data-ex="exception-pos-overlap-2026-02"] .bars')?.dataset.merged === 'true', my, 4000);
        await sleep(1400, my);
        const ok = line?.id === 'feb-overlap' && /same event key/.test(because) && app.S.route === 'exceptions' && merged;
        return { ok, text: ok ? 'The Cue led with February’s overlap. Its bar shows $125.00 agreeing (green) and $125.00 left over in amber: one sale, counted twice.' : `Expected the February line; got ${line?.id ?? 'none'}.` };
      },
    },
    {
      title: 'Trace a number',
      hand: 'Open Trace, pick Feb and press “Trace this number”. Then pick the Toast row.',
      async run(my) {
        app.navigate('trace', 'trace-2026-02');
        await waitFor(() => app.S.traced, my, 2000);
        await sleep(1700, my);
        app.S.row = null;
        app.page.selectRow('fact-toast-2026-02-001-r1');
        await sleep(900, my);
        const ev = dev.page.querySelector('[data-region="evidence"]');
        const text = ev && !ev.hidden ? ev.textContent : '';
        const ok = /artifact-toast-2026-02-v1#row-1/.test(text) && /SHA-256/.test(text);
        return { ok, text: ok ? '$364.00 lifted off into its 7 rows (2 excluded, drifted aside). The Toast row opened its file, SHA-256 and row pointer artifact-toast-2026-02-v1#row-1.' : 'The evidence strip did not open.' };
      },
    },
    {
      title: 'Gap honesty',
      hand: 'On Field, look at April (stipple). Press ⌘K and ask “what did we spend in April”.',
      async run(my) {
        app.navigate('field');
        await sleep(1400, my);
        const ans = await askLocal('what did we spend in April', my);
        await sleep(1800, my);
        const ok = /unknown, not \$0/.test(ans);
        return { ok, text: ok ? `Ask answered from the page: “${ans}”` : `Unexpected answer: ${ans}` };
      },
    },
    {
      title: 'Draft a disposition',
      hand: 'Open the February exception and type a reviewer note. The March re-check lands while you type; press “Save note”.',
      async run(my) {
        // Replay from the start: the March re-check hasn't landed yet, so it is news again.
        clearTimeout(app.S.recheckTimer);
        Object.assign(app.S, { recheck: false, recheckAt: null, recheckTimer: 0, recheckArmed: true });
        app.update();
        app.navigate('exceptions', 'exception-pos-overlap-2026-02');
        await sleep(1100, my);
        const ta = dev.page.querySelector('#note-exception-pos-overlap-2026-02');
        ta.value = '';
        await type(ta, 'Clover feed started mid-February; Toast is the original record.', my, 40);
        const held = await waitFor(() => island.getState().held.includes('mar-control'), my, 4000);
        await sleep(700, my);
        dev.page.querySelector('form[data-key="exception-pos-overlap-2026-02"] button[type="submit"]').click();
        const lean = await waitFor(() => island.getState().cue?.mode === 'lean' && island.getState().cue?.id === 'mar-control', my, 1500);
        ta.blur();
        await sleep(1800, my);
        const ok = held && lean;
        return { ok, text: ok ? 'While you typed, the March re-check was held (no interruption). Saving was the break: it arrived as a Lean. “Record decision” only explains.' : `held=${held} lean=${lean}` };
      },
    },
    {
      title: 'Follow-up',
      hand: 'On the March exception press “Draft follow-up →”, write the question, then “Ask for approval”, “Approve” and “Send”.',
      async run(my) {
        const S = app.S;
        S.followUps = S.followUps.filter((f) => !f.id.startsWith('fu-new-'));
        S.draft = { subject: 'exception-bank-control-2026-03', question: '', email: 'DRAFT', saved: false };
        S.drafts = {};
        delete S.explain.draft;
        app.navigate('followups', 'draft-mar');
        app.update();
        await sleep(900, my);
        app.page.composer();
        await type(dev.page.querySelector('#fu-q'), 'Could you send the settlement detail for March 2026, so we can see what makes up the $1.00 difference?', my, 18);
        dev.page.querySelector('#fu-q').blur();
        await sleep(400, my);
        dev.page.querySelector('[data-act="request-approval"]').click();
        await sleep(900, my);
        dev.page.querySelector('#composer [data-owner="approve"]').click();
        await sleep(1600, my);
        const approveText = dev.page.querySelector('#composer .explain')?.textContent ?? '';
        dev.page.querySelector('#composer [data-owner="send"]').click();
        await sleep(1400, my);
        const sendText = dev.page.querySelector('#composer .explain')?.textContent ?? '';
        const approvedNotSent = [...dev.page.querySelectorAll('.ladder [aria-current="step"]')].some((el) => /Approved, not sent/.test(el.textContent));
        const ok = S.draft.email === 'AWAITING_APPROVAL' && /approves nothing/.test(approveText) && /never sends/.test(sendText) && approvedNotSent;
        return { ok, text: ok ? 'The draft is Awaiting approval. “Approve” and “Send” explained the real gates; the April request reads “Approved, not sent”.' : 'The draft did not reach Awaiting approval.' };
      },
    },
    {
      title: 'Custody alarm',
      hand: 'Press “Custody alarm” in the dock. Press it again to restore.',
      async run(my) {
        app.navigate('field');
        await sleep(900, my);
        app.setCustody(true);
        await sleep(2200, my);
        const st = island.getState();
        const feb = app.V.byPeriod.get('2026-02');
        const ok = st.shape === 'alert' && st.line?.id === 'custody' && feb.net === 21400;
        return { ok, text: ok ? 'An amber P0 broke through and can’t be set aside. The Feb bank file’s 2 dots left every total: February re-formed from $364.00 to $214.00, and 8 → 7 of 20 complete. Press “Custody alarm” again to restore.' : `shape=${st.shape} line=${st.line?.id}` };
      },
    },
  ];

  panel.innerHTML = `<div class="ft-top"><h2>TOUR</h2><span>Six moments. Each plays on the page, and each is doable by hand.</span><button type="button" class="ft-close" aria-label="Close tour">×</button></div>
    <ol class="ft-list">${moments.map((m, i) => `<li data-m="${i}"><div class="ft-m"><span class="ft-n">${i + 1}</span><b>${esc(m.title)}</b><button type="button" class="ft-play" data-play="${i}">Show me</button></div>
      <p class="ft-hand"><span>By hand</span> ${esc(m.hand)}</p><p class="ft-res" role="status"></p></li>`).join('')}</ol>`;
  dev.root.append(panel);

  function setOpen(on) {
    panel.hidden = !on;
    dev.root.dataset.tour = on ? 'on' : 'off';
    app.button()?.setAttribute('aria-pressed', String(on));
    if (on && dev.getPrefs().why) dev.setPref('why', false);
    if (!on) stop();
    dev.fit();
  }
  function stop() { token++; running = -1; paint(); }
  function paint() {
    panel.querySelectorAll('[data-m]').forEach((li) => {
      const i = Number(li.dataset.m), r = results.get(i);
      li.dataset.state = running === i ? 'running' : r ? (r.ok ? 'ok' : 'fail') : '';
      li.querySelector('.ft-play').textContent = running === i ? 'Stop' : r ? 'Again' : 'Show me';
      li.querySelector('.ft-res').textContent = running === i ? 'Playing on the page…' : r ? `${r.ok ? '✓' : '×'} ${r.text}` : '';
    });
  }
  async function run(i) {
    const my = ++token;
    running = i;
    results.delete(i);
    paint();
    calm();
    try {
      const r = await moments[i].run(my);
      if (my !== token) return null;
      results.set(i, r);
      running = -1;
      paint();
      return r;
    } catch (err) {
      if (my !== token) return null; // stopped: by the owner, the Stop button or another moment
      running = -1; results.set(i, { ok: false, text: String(err?.message ?? err) }); paint();
      return { ok: false, text: String(err?.message ?? err) };
    }
  }
  panel.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('button') : null;
    if (!b) return;
    if (b.classList.contains('ft-close')) { setOpen(false); app.button()?.focus(); return; }
    if (b.dataset.play) { const i = Number(b.dataset.play); if (running === i) stop(); else run(i); }
  });
  // The owner takes over: any real pointer or key on the page (outside this panel) ends the moment,
  // so the tour never keeps driving a page he has moved on from.
  const takeOver = (e) => { if (running >= 0 && e.isTrusted && !panel.contains(e.target)) stop(); };
  document.addEventListener('pointerdown', takeOver, true);
  document.addEventListener('keydown', takeOver, true);
  dev.onPrefs((p) => { if (p.why && !panel.hidden) { panel.hidden = true; dev.root.dataset.tour = 'off'; app.button()?.setAttribute('aria-pressed', 'false'); stop(); dev.fit(); } });

  return { moments, run, stop, toggle: () => setOpen(panel.hidden), open: () => setOpen(true), close: () => setOpen(false), results };
}
