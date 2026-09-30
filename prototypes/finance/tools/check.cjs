// Browser checks for the Finance prototype. Serve this folder first, then:
//   bash tools/make-preview.sh
//   python3 -m http.server 8842 --bind 127.0.0.1 --directory prototypes/finance &
//   node prototypes/finance/tools/check.cjs 8842 [shotsDir] [realShotsDir]
// Checks at 1440×900, 390×844 and 1440×900 with reduced motion: zero console/page errors, no
// request outside this folder, no horizontal scroll, island rest ≤ 80 px, particles settle
// (static under reduced motion), and every tour moment reaches its result. With a local
// real-data.local.json present it also shoots the real-data screens into realShotsDir
// (keep that outside the repo). Needs playwright-core (PLAYWRIGHT_CORE=/path/to/playwright-core).
const path = require('path');
const fs = require('fs');
if (!process.env.PLAYWRIGHT_CORE) { console.error('Set PLAYWRIGHT_CORE=/path/to/playwright-core'); process.exit(2); }
const { chromium } = require(process.env.PLAYWRIGHT_CORE);

const port = process.argv[2] || '8842';
const out = process.argv[3] || path.join(__dirname, '..', '.shots');
const realOut = process.argv[4] || null;
fs.mkdirSync(out, { recursive: true });
if (realOut) fs.mkdirSync(realOut, { recursive: true });
const origin = `http://127.0.0.1:${port}/`;
const url = `${origin}preview.html`;
const ROUTES = ['field', 'trace', 'coverage', 'exceptions', 'followups'];
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` · ${detail}` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run({ vw, vh, tag, reduce = false, real = false }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  const outside = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // The optional local real-data probe 404s when the gitignored file is absent. That's expected.
    if (/real-data\.local\.json/.test(m.location()?.url ?? '')) return;
    errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:')) outside.push(r.url()); });
  await page.goto(url);
  await page.waitForFunction(() => window.financeProto);
  await page.evaluate(() => window.financeProto.ready);
  await sleep(1800);
  const shot = (name, dir = out) => page.screenshot({ path: `${dir}/${tag}-${name}.png` });
  const hist = await page.evaluate(() => history.length);

  ok(`${tag} focus not stolen`, await page.evaluate(() => document.activeElement === document.body));
  const motion = await page.evaluate(() => document.documentElement.dataset.motion);
  ok(`${tag} motion mode`, motion === (reduce ? 'reduce' : 'full'), motion);
  const rest = await page.evaluate(() => ({ h: document.querySelector('.cue').offsetHeight, shape: document.querySelector('.cue').dataset.shape, line: window.financeProto.island.getState().line?.id }));
  ok(`${tag} island rest ≤ 80px, first line is the Feb overlap`, rest.h <= 80 && rest.shape === 'rest' && rest.line === 'feb-overlap', JSON.stringify(rest));
  const want = reduce ? 'static' : 'settled';
  // Canvases in view must settle (off-screen ones pause mid-flight by design and finish when seen).
  const settled = await page.waitForFunction((w) => { const pr = document.querySelector('.pd-page').getBoundingClientRect(); return [...document.querySelectorAll('.pd-page canvas')].filter((c) => { const r = c.getBoundingClientRect(); return r.bottom > pr.top && r.top < pr.bottom; }).every((c) => c.dataset.particles === w); }, want, { timeout: 6000 }).then(() => true).catch(() => false);
  const inked = await page.evaluate(() => { const c = document.querySelector('.field-cv'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; });
  ok(`${tag} particles ${want} and the field renders`, settled && inked > 2000, `inkedPx=${inked}`);
  const factDots = await page.evaluate(() => window.financeProto.V.facts.length);
  ok(`${tag} one dot per fact`, factDots === 20, `facts=${factDots}`);

  const overflow = async (label) => {
    const o = await page.evaluate(() => { const p = document.querySelector('.pd-page'); return { sw: document.documentElement.scrollWidth, iw: innerWidth, psw: p.scrollWidth, pcw: p.clientWidth }; });
    ok(`${tag} no horizontal scroll · ${label}`, o.sw <= o.iw && o.psw <= o.pcw + 1, JSON.stringify(o));
  };
  for (const r of ROUTES) {
    await page.evaluate((route) => window.financeProto.navigate(route, route === 'trace' ? 'trace-2026-02' : null), r);
    await sleep(reduce ? 500 : 2600);
    await overflow(r);
    await shot(`screen-${r}`);
  }
  await page.evaluate(() => window.financeProto.navigate('field'));
  await sleep(600);

  // Section nav stays in memory: no hash, no history entries.
  await page.click('.cue-sections a:nth-child(3)');
  await sleep(400);
  const nav = await page.evaluate(() => ({ hash: location.hash, route: window.financeProto.S.route, h: history.length }));
  ok(`${tag} section nav in memory`, nav.hash === '' && nav.route === 'coverage' && nav.h === hist, JSON.stringify(nav));
  await page.evaluate(() => window.financeProto.navigate('field'));
  await sleep(600);

  // Tour: every moment reaches its result.
  await page.click('.pd-dock [data-ft="tour"]');
  await sleep(300);
  const n = await page.evaluate(() => window.financeProto.tour.moments.length);
  ok(`${tag} tour has 4–6 moments`, n >= 4 && n <= 6, `n=${n}`);
  await overflow('tour open');
  for (let i = 0; i < n; i++) {
    const r = await page.evaluate((k) => window.financeProto.tour.run(k), i);
    ok(`${tag} moment ${i + 1} reaches its result`, !!r?.ok, r?.text ?? '');
    await shot(`moment-${i + 1}`);
  }
  const alert = await page.evaluate(() => ({ st: window.financeProto.island.getState(), notnow: document.querySelector('.cue-body:not(.is-out) .cue-notnow')?.hidden }));
  ok(`${tag} custody P0 cannot be set aside`, alert.st.shape === 'alert' && alert.notnow === true, JSON.stringify(alert.st));
  await page.evaluate(() => window.financeProto.setCustody(false));
  await sleep(600);
  ok(`${tag} alarm clears`, await page.evaluate(() => window.financeProto.island.getState().shape !== 'alert'));

  // Regressions from review: the banner follows custody on every page; moment 4 replays;
  // editing a requested follow-up returns it to Draft; a real click takes over from the tour.
  const banner = await page.evaluate(async () => { const f = window.financeProto; f.navigate('trace'); f.setCustody(true); await new Promise((r) => setTimeout(r, 300)); const on = !!document.querySelector('.pd-page .alarm'); f.setCustody(false); await new Promise((r) => setTimeout(r, 300)); return { on, off: !!document.querySelector('.pd-page .alarm') }; });
  ok(`${tag} custody banner follows the switch on Trace`, banner.on && !banner.off, JSON.stringify(banner));
  const again = await page.evaluate(() => window.financeProto.tour.run(3));
  ok(`${tag} moment 4 replays`, !!again?.ok, again?.text ?? '');
  await page.evaluate(() => window.financeProto.navigate('followups'));
  await sleep(600);
  await page.focus('#fu-q');
  await page.evaluate(() => { const t = document.querySelector('#fu-q'); t.setSelectionRange(t.value.length, t.value.length); });
  await page.keyboard.type(' Thanks.');
  const edited = await page.evaluate(() => { const f = window.financeProto; return { draft: f.S.draft.email, list: f.S.followUps.find((x) => x.id === 'fu-new-exception-bank-control-2026-03')?.email, btn: document.querySelector('[data-act="request-approval"]').disabled }; });
  ok(`${tag} editing a requested follow-up returns it to Draft`, edited.draft === 'DRAFT' && edited.list === 'DRAFT' && edited.btn === false, JSON.stringify(edited));
  await page.evaluate(() => document.querySelector('[data-act="request-approval"]').click()); // the open tour panel overlaps it
  const re = await page.evaluate(() => { const f = window.financeProto; return { draft: f.S.draft.email, n: f.S.followUps.filter((x) => x.id.startsWith('fu-new-')).length, q: /Thanks\.$/.test(f.S.followUps.find((x) => x.id.startsWith('fu-new-'))?.question ?? '') }; });
  ok(`${tag} re-requesting updates the same follow-up`, re.draft === 'AWAITING_APPROVAL' && re.n === 1 && re.q, JSON.stringify(re));
  await page.evaluate(() => { window.financeProto.navigate('field'); window.__m4 = window.financeProto.tour.run(3); });
  await sleep(1500);
  await page.click('.cue-sections a:nth-child(3)');
  await sleep(2500);
  const took = await page.evaluate(async () => ({ route: window.financeProto.S.route, r: await window.__m4 }));
  ok(`${tag} a real click takes over from the tour`, took.route === 'coverage' && took.r === null, JSON.stringify(took));
  await page.click('.pd-dock [data-ft="tour"]');

  // Ask refuses to send and answers from state.
  await page.mouse.click(5, 5);
  await page.keyboard.press('Control+k');
  await sleep(300);
  await page.keyboard.type('send the follow-up');
  await page.keyboard.press('Enter');
  await sleep(400);
  const refuse = await page.evaluate(() => document.querySelector('.cue-answer .cue-sentence')?.textContent ?? '');
  ok(`${tag} Ask refuses to send`, /can't send/.test(refuse), refuse);
  await page.fill('.cue-ask-input', 'why is exposure $126.00');
  await page.keyboard.press('Enter');
  await sleep(400);
  const why = await page.evaluate(() => document.querySelector('.cue-answer .cue-sentence')?.textContent ?? '');
  ok(`${tag} Ask explains exposure`, /\$125\.00 .* \+ \$1\.00/.test(why), why);
  await page.fill('.cue-ask-input', 'trace -$364.00');
  await page.keyboard.press('Enter');
  await sleep(400);
  const neg = await page.evaluate(() => document.querySelector('.cue-answer .cue-sentence')?.textContent ?? '');
  ok(`${tag} Ask keeps the sign of an amount`, !/net of/.test(neg), neg);
  await page.fill('.cue-ask-input', 'trace $364.00');
  await page.keyboard.press('Enter');
  await sleep(400);
  const pos = await page.evaluate(() => document.querySelector('.cue-answer .cue-sentence')?.textContent ?? '');
  ok(`${tag} Ask traces $364.00 to February`, /Feb.*net of/.test(pos), pos);
  await page.fill('.cue-ask-input', 'is this fraud?');
  await page.keyboard.press('Enter');
  await sleep(400);
  const fraud = await page.evaluate(() => document.querySelector('.cue-answer .cue-sentence')?.textContent ?? '');
  ok(`${tag} Ask draws no conclusions`, /doesn't draw fraud, tax or profit conclusions/.test(fraud), fraud);
  await shot('ask');
  await page.keyboard.press('Escape');
  await sleep(300);

  if (real && realOut) {
    const has = await page.evaluate(() => !!window.financeProto.S.real);
    ok(`${tag} local real data available`, has);
    if (has) {
      await page.evaluate(() => window.financeProto.setMode('real'));
      await sleep(1500);
      for (const r of ROUTES) {
        await page.evaluate((route) => window.financeProto.navigate(route), r);
        await sleep(2600);
        await overflow(`real ${r}`);
        await shot(`real-${r}`, realOut);
      }
      await page.evaluate(() => window.financeProto.navigate('trace', `trace-${window.financeProto.S.real.months.at(-2)}`));
      await sleep(2800);
      await page.evaluate(() => { const b = document.querySelector('.rows .row'); b?.click(); });
      await sleep(900);
      await shot('real-trace-evidence', realOut);
      const line = await page.evaluate(() => window.financeProto.island.getState().line?.id);
      ok(`${tag} real-data Cue line`, line === 'real-unreconciled', line);
      await page.evaluate(() => window.financeProto.setMode('fixture'));
      await sleep(600);
    }
  }
  ok(`${tag} no requests outside this folder`, outside.length === 0, outside.join(' | '));
  ok(`${tag} no console or page errors`, errors.length === 0, errors.join(' | '));
  await browser.close();
}

(async () => {
  await run({ vw: 1440, vh: 900, tag: 'd1440', real: true });
  await run({ vw: 390, vh: 844, tag: 'p390' });
  await run({ vw: 1440, vh: 900, tag: 'rm1440', reduce: true });
  const fails = results.filter((r) => !r.pass);
  console.log(`\n${results.length - fails.length}/${results.length} passed`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
