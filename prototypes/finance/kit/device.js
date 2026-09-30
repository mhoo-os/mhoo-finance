// device.js: the prototype frame. A fixed-size device (1440×900 or 390×844) scaled to fit
// the viewport, and a quiet PROTOTYPE dock: width toggle, reduced-motion toggle and a Why
// panel that shows the island's last decisions in plain English. The device (the product)
// is always light; the chrome around it follows light/dark.
//
//   const dev = mountDevice({ title: 'Finance', note: 'Synthetic data' });
//   dev.page      // <main> inside the device: render the app here (it scrolls)
//   dev.screen    // the device screen: mount the island here
//   dev.attachIsland(island)   // feeds the Why panel
//   dev.onPrefs((p) => …)      // { width: 1440|390, reducedMotion: bool, why: bool }

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SIZES = { 1440: [1440, 900], 390: [390, 844] };
const KIND = { line: 'LINE', kept: 'KEPT', held: 'HELD', delivered: 'DELIVERED', alert: 'P0', dismiss: 'SET ASIDE', ask: 'ASK', refused: 'REFUSED', contract: 'CONTRACT', action: 'ACTION' };

function read(key) { try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; } }
function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* blocked storage */ } }

/**
 * @param {{mount?: Element, title?: string, note?: string, width?: 1440|390, storageKey?: string}} [opts]
 */
export function mountDevice(opts = {}) {
  const mount = opts.mount ?? document.body;
  const key = opts.storageKey ?? `proto-device:${String(opts.title ?? 'app').toLowerCase().replace(/\W+/g, '-')}`;
  let osReduce = null;
  try { osReduce = matchMedia('(prefers-reduced-motion: reduce)'); } catch { /* ignore */ }
  const saved = read(key) ?? {};
  const prefs = {
    width: Number(opts.width ?? saved.width ?? (innerWidth < 700 ? 390 : 1440)) === 390 ? 390 : 1440,
    reducedMotion: typeof saved.reducedMotion === 'boolean' ? saved.reducedMotion : !!osReduce?.matches,
    why: !!saved.why,
  };
  let motionTouched = typeof saved.reducedMotion === 'boolean';
  const fns = new Set();

  const root = document.createElement('div');
  root.className = 'pd';
  root.innerHTML = `
    <div class="pd-stage">
      <div class="pd-fit"><div class="pd-device"><div class="pd-screen"><main class="pd-page" aria-label="${esc(opts.title ?? 'App')}"></main></div></div></div>
      <p class="pd-caption" aria-hidden="true"></p>
    </div>
    <aside class="pd-why" aria-label="Why: the island's last decisions" hidden>
      <div class="pd-why-top"><h2>WHY</h2><span>What the island decided, newest first</span><button type="button" class="pd-why-close" aria-label="Close Why">×</button></div>
      <ol class="pd-why-list"></ol>
    </aside>
    <div class="pd-dock" role="region" aria-label="Prototype controls">
      <span class="pd-label">PROTOTYPE</span>
      <span class="pd-title">${esc(opts.title ?? '')}</span>
      ${opts.note ? `<span class="pd-note">${esc(opts.note)}</span>` : ''}
      <span class="pd-spacer"></span>
      <span class="pd-seg" role="group" aria-label="Device width"><button type="button" data-w="1440" aria-pressed="false">1440</button><button type="button" data-w="390" aria-pressed="false">390</button></span>
      <button type="button" data-pref="reducedMotion" aria-pressed="false"><span class="pd-long">Reduced motion</span><span class="pd-short">Motion</span></button>
      <button type="button" data-pref="why" aria-pressed="false">Why</button>
    </div>`;
  mount.append(root);
  const $ = (s) => root.querySelector(s);
  const stage = $('.pd-stage'), fitEl = $('.pd-fit'), device = $('.pd-device'), screen = $('.pd-screen'), page = $('.pd-page');
  const why = $('.pd-why'), list = $('.pd-why-list'), caption = $('.pd-caption');

  function apply() {
    device.dataset.width = String(prefs.width);
    root.dataset.width = String(prefs.width);
    document.documentElement.dataset.motion = prefs.reducedMotion ? 'reduce' : 'full';
    root.dataset.why = prefs.why ? 'on' : 'off';
    why.hidden = !prefs.why;
    root.querySelectorAll('[data-w]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.w) === prefs.width)));
    root.querySelectorAll('[data-pref]').forEach((b) => b.setAttribute('aria-pressed', String(!!prefs[b.dataset.pref])));
    fit();
  }
  function setPref(k, v) {
    if (!(k in prefs)) return;
    if (k === 'width') v = Number(v) === 390 ? 390 : 1440;
    else v = !!v;
    if (k === 'reducedMotion') motionTouched = true;
    prefs[k] = v;
    write(key, { ...prefs, reducedMotion: motionTouched ? prefs.reducedMotion : undefined });
    apply();
    for (const fn of fns) { try { fn({ ...prefs }); } catch (e) { console.error(e); } }
  }

  // Fit the fixed-size device into the stage. Keep the island's sentence ≥ 12px on screen:
  // when the device is too tall for that, fit its width and let the stage scroll down.
  function fit() {
    const [W, H] = SIZES[prefs.width];
    const area = stage.getBoundingClientRect();
    if (!area.width || !area.height) return;
    const padX = area.width < 600 ? 8 : 28, padY = area.width < 600 ? 8 : 32;
    const floor = 12 / (W === 390 ? 15 : 14);
    const wFit = (area.width - padX * 2) / W;
    const hFit = (area.height - padY * 2) / H;
    const s = Math.max(0.1, Math.min(1, wFit, Math.max(hFit, floor)));
    device.style.transform = `scale(${s})`;
    fitEl.style.width = `${Math.floor(W * s)}px`;
    fitEl.style.height = `${Math.floor(H * s)}px`;
    device.dataset.scale = s.toFixed(4);
    stage.dataset.crop = s > hFit + 0.001 ? 'on' : 'off';
    caption.textContent = `${W} × ${H} · ${Math.round(s * 100)}%`;
  }

  root.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('button') : null;
    if (!b) return;
    if (b.dataset.w) setPref('width', b.dataset.w);
    else if (b.dataset.pref) setPref(b.dataset.pref, !prefs[b.dataset.pref]);
    else if (b.classList.contains('pd-why-close')) { setPref('why', false); root.querySelector('.pd-dock [data-pref="why"]')?.focus({ preventScroll: true }); }
  });
  const onOs = () => { if (!motionTouched) { prefs.reducedMotion = !!osReduce?.matches; apply(); for (const fn of fns) fn({ ...prefs }); } };
  osReduce?.addEventListener?.('change', onOs);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => fit()) : null;
  ro?.observe(stage);
  addEventListener('resize', fit);

  let unLog = null;
  function renderLog(entries) {
    list.innerHTML = entries.slice(0, 20).map((e) => `<li data-kind="${esc(e.kind)}"><span class="pd-why-k">${esc(e.clock)} · ${esc(KIND[e.kind] ?? String(e.kind).toUpperCase())}</span><span class="pd-why-t">${esc(e.text)}</span></li>`).join('')
      || '<li><span class="pd-why-t">No decisions yet.</span></li>';
  }

  apply();

  return {
    root, screen, page, device,
    getPrefs: () => ({ ...prefs }),
    setPref,
    onPrefs(fn) { fns.add(fn); return () => fns.delete(fn); },
    /** Show this island's decisions in the Why panel. */
    attachIsland(island) {
      unLog?.();
      renderLog(island.getLog());
      unLog = island.onLog((_, all) => renderLog(all));
    },
    fit,
    destroy() {
      unLog?.();
      ro?.disconnect();
      removeEventListener('resize', fit);
      osReduce?.removeEventListener?.('change', onOs);
      root.remove();
    },
  };
}
