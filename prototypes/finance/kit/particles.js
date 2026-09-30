// particles.js: data that forms from particles, in the MHO-316 language (the mhoo.dev
// landing's particle world and the /00 home field). A value, a word or a shape is stamped
// in heavy Arial, sampled on a grid into small square particles, and the particles fly in
// with minimum-jerk easing and settle. When the data changes they lift off and re-form
// into the new value; when the canvas scrolls up out of view they scatter. Particles are
// the data, never decoration: pass the real number, the real queue length, the real series.
//
//   const p = formParticles(canvas, { text: 'r2', density: 1, color: '#172033' });
//   p.set({ text: 'r3' });               // lift off, re-form into the new value
//   p.set({ values: [3, 5, 2, 8], highlight: 3 });   // dot bars, the 4th in blue
//   await p.whenSettled();
//   p.destroy();
//
// Reduced motion (html[data-motion="reduce"], or the OS setting when unset): static dots,
// no flight, no scatter, no drift. DPR-aware. The loop stops when settled and off screen.

const random = (n, s = 0) => { const v = Math.sin(n * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const minimumJerk = (x) => { const t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a, b, t) => a + (b - a) * t;

const INK = '#172033';
const BLUE = '#075cff';
const FLIGHT_MS = 900;
const STAGGER_MS = 280;

function reduced() {
  const m = document.documentElement.dataset.motion;
  if (m) return m === 'reduce';
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}
function rgbOf(color) {
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = '#000';
  c.fillStyle = color;
  const hex = c.fillStyle;
  if (hex.startsWith('#')) return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const m = hex.match(/[\d.]+/g) ?? [23, 32, 51];
  return m.slice(0, 3).map(Number);
}
function scrollParent(el) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if (o === 'auto' || o === 'scroll') return p;
  }
  return null;
}

/**
 * @param {HTMLCanvasElement} canvas  sized by CSS; the module sets its backing store.
 * @param {{text?: string, values?: number[], shape?: 'circle'|'ring'|'square'|'bar'|'line'|((g: CanvasRenderingContext2D, w: number, h: number) => void),
 *          density?: number, color?: string, accent?: string, highlight?: number|number[]|'last',
 *          weight?: number|string, align?: 'center'|'left'|'right', progress?: number,
 *          scatterOnScroll?: boolean, scrollRoot?: Element|null, drift?: boolean, label?: string}} opts
 */
export function formParticles(canvas, opts = {}) {
  if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('formParticles needs a <canvas>');
  const g = canvas.getContext('2d');
  let o = { density: 1, color: INK, accent: BLUE, weight: 900, align: 'center', scatterOnScroll: true, drift: true, ...opts };
  let W = 0, H = 0, dpr = 1;
  let parts = [];
  let raf = 0, visible = true, destroyed = false, flightEnd = 0, seq = 0;
  let scroll = 0;
  let ink = rgbOf(o.color), accent = rgbOf(o.accent);
  let settleWaiters = [];
  const t0 = performance.now();

  if (o.label) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', o.label); }
  else if (!canvas.hasAttribute('aria-label')) canvas.setAttribute('aria-hidden', 'true');

  // ---- stamp: draw the data offscreen, sample it on a grid ----------------------------------
  function stamp() {
    const step = Math.max(2.2, Math.min(W, 1100) / 170) / Math.max(0.3, o.density);
    const sc = document.createElement('canvas');
    sc.width = Math.max(1, Math.ceil(W)); sc.height = Math.max(1, Math.ceil(H));
    const c = sc.getContext('2d', { willReadFrequently: true });
    c.fillStyle = '#111'; c.strokeStyle = '#111';
    const marks = []; // [x0, x1] ranges that count as "highlight" (blue)
    if (typeof o.text === 'string' && o.text.length) {
      let size = H * 0.82;
      c.font = `${o.weight} ${size}px Arial, Helvetica, sans-serif`;
      const w = c.measureText(o.text).width;
      if (w > W * 0.96) { size *= (W * 0.96) / w; c.font = `${o.weight} ${size}px Arial, Helvetica, sans-serif`; }
      c.textBaseline = 'middle';
      c.textAlign = o.align;
      const x = o.align === 'left' ? 0 : o.align === 'right' ? W : W / 2;
      c.fillText(o.text, x, H / 2 + size * 0.04);
    } else if (Array.isArray(o.values) && o.values.length && o.shape !== 'line') {
      const vals = o.values.map((v) => Number(v) || 0);
      const max = Math.max(0, ...vals), min = Math.min(0, ...vals), span = max - min || 1;
      const n = vals.length, gap = Math.max(step, (W / n) * 0.28), bw = (W - gap * (n - 1)) / n;
      const zero = H * (max / span);
      const hi = new Set(o.highlight === 'last' ? [n - 1] : [].concat(o.highlight ?? []));
      vals.forEach((v, i) => {
        const x = i * (bw + gap), h = Math.max(step, (Math.abs(v) / span) * H);
        c.fillRect(x, v >= 0 ? zero - h : zero, bw, h);
        if (hi.has(i)) marks.push([x, x + bw]);
      });
    } else if (Array.isArray(o.values) && o.values.length) {
      const vals = o.values.map((v) => Number(v) || 0);
      const max = Math.max(...vals), min = Math.min(...vals), span = max - min || 1;
      c.lineWidth = Math.max(step * 1.6, H * 0.06); c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      vals.forEach((v, i) => {
        const x = (i / Math.max(1, vals.length - 1)) * (W - c.lineWidth) + c.lineWidth / 2;
        const y = H - c.lineWidth / 2 - ((v - min) / span) * (H - c.lineWidth);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      });
      c.stroke();
      if (o.highlight === 'last') marks.push([W - c.lineWidth * 2, W]);
    } else if (typeof o.shape === 'function') {
      o.shape(c, W, H);
    } else {
      const r = Math.min(W, H) * 0.44;
      if (o.shape === 'ring' || o.shape === 'circle') {
        c.beginPath(); c.arc(W / 2, H / 2, r, 0, Math.PI * 2);
        if (o.shape === 'ring') { c.lineWidth = Math.max(step * 2.2, r * 0.22); c.stroke(); } else c.fill();
      } else if (o.shape === 'bar') {
        const p = clamp01(o.progress ?? 1);
        c.globalAlpha = 0.28; c.fillRect(0, H * 0.3, W, H * 0.4); c.globalAlpha = 1;
        c.fillRect(0, H * 0.3, W * p, H * 0.4);
        marks.push([0, W * p]);
      } else c.fillRect(W / 2 - r, H / 2 - r, r * 2, r * 2);
    }
    const px = c.getImageData(0, 0, sc.width, sc.height).data;
    const out = [];
    for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
      const a = px[(Math.floor(y) * sc.width + Math.floor(x)) * 4 + 3];
      if (a <= 140) continue;
      const seed = random(out.length + 1, 7);
      const faded = a < 250 ? 0.35 : 1; // translucent stamp (bar track) = quieter particles
      out.push({ x, y, size: step * (0.62 + seed * 0.3), alpha: (0.72 + seed * 0.28) * faded, hi: marks.some(([a0, a1]) => x >= a0 && x <= a1) && faded === 1 });
    }
    return out;
  }

  // ---- particles ----------------------------------------------------------------------
  function spawn(n) {
    const ang = random(n, 3) * Math.PI * 2, rad = (0.35 + random(n, 5) * 0.8) * Math.max(W, H);
    return {
      x: W / 2 + Math.cos(ang) * rad, y: H / 2 + Math.sin(ang) * rad * 0.6, a: 0,
      sx: 0, sy: 0, sa: 0, tx: W / 2, ty: H / 2, ta: 0, size: 2, tsize: 2, hi: false, dead: false,
      delay: random(n, 9) * STAGGER_MS, kick: { x: Math.cos(ang), y: Math.sin(ang) },
      scat: { x: (random(n, 11) - 0.5) * 2, y: -(0.3 + random(n, 13)) }, flow: { s: 0.2 + random(n, 17) * 0.4, p: random(n, 19) * 6.28, amp: 0.4 + random(n, 23) * 0.8 },
    };
  }
  function retarget(animate) {
    const pts = stamp();
    const next = [];
    // Keep existing particles (sorted left to right so the re-form reads as a sweep).
    const live = parts.filter((p) => !p.dead).sort((a, b) => a.tx - b.tx || a.ty - b.ty);
    pts.sort((a, b) => a.x - b.x || a.y - b.y);
    for (let i = 0; i < pts.length; i++) {
      const p = live[i] ?? spawn(parts.length + i + seq * 7919);
      const q = pts[i];
      Object.assign(p, { sx: p.x, sy: p.y, sa: p.a, tx: q.x, ty: q.y, ta: q.alpha, tsize: q.size, hi: q.hi, dead: false });
      if (!live[i]) p.size = q.size;
      next.push(p);
    }
    for (let i = pts.length; i < live.length; i++) {
      const p = live[i];
      Object.assign(p, { sx: p.x, sy: p.y, sa: p.a, tx: p.x + p.kick.x * 60, ty: p.y + p.kick.y * 60, ta: 0, dead: true });
      next.push(p);
    }
    parts = next;
    seq++;
    if (!animate || reduced()) {
      for (const p of parts) { p.x = p.tx; p.y = p.ty; p.a = p.ta; p.size = p.tsize; }
      parts = parts.filter((p) => !p.dead);
      flightEnd = 0;
      draw(performance.now());
      markSettled();
      return;
    }
    flightStart = performance.now();
    flightEnd = flightStart + FLIGHT_MS + STAGGER_MS;
    canvas.dataset.particles = 'forming';
    wake();
  }
  let flightStart = 0;

  function markSettled() {
    canvas.dataset.particles = reduced() ? 'static' : 'settled';
    const w = settleWaiters; settleWaiters = [];
    w.forEach((fn) => fn());
    o.onSettle?.();
  }

  // ---- drawing ------------------------------------------------------------------------
  function snap() {
    for (const p of parts) { p.x = p.tx; p.y = p.ty; p.a = p.ta; p.size = p.tsize; }
    parts = parts.filter((p) => !p.dead);
    flightEnd = 0;
  }
  function draw(t) {
    // Finish a flight before painting, so the last frame is the settled data.
    const landed = flightEnd && t >= flightEnd;
    if (landed) snap();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const red = reduced();
    const s = red || !o.scatterOnScroll ? 0 : smooth(scroll);
    const flying = flightEnd && t < flightEnd;
    const time = (t - t0) / 1000;
    const drift = !red && o.drift && !flying;
    for (const p of parts) {
      if (flying) {
        const k = minimumJerk((t - flightStart - p.delay) / FLIGHT_MS);
        const lift = Math.sin(k * Math.PI) * 18; // lift off and settle: an arc, not a slide
        p.x = mix(p.sx, p.tx, k) + p.kick.x * lift;
        p.y = mix(p.sy, p.ty, k) + p.kick.y * lift - lift * 0.4;
        p.a = mix(p.sa, p.ta, k);
        p.size = mix(p.size, p.tsize, 0.2);
      }
      let x = p.x, y = p.y, a = p.a;
      if (drift) { x += Math.sin(time * p.flow.s + p.flow.p) * p.flow.amp; y += Math.cos(time * p.flow.s * 0.83 + p.flow.p) * p.flow.amp * 0.6; }
      if (s > 0) { x += p.scat.x * s * W * 0.35; y += p.scat.y * s * H * 1.4; a *= 1 - s * 0.85; }
      if (a <= 0.01) continue;
      const rgb = p.hi ? accent : ink;
      g.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a > 1 ? 1 : a.toFixed(3)})`;
      const z = p.size;
      g.fillRect(x - z / 2, y - z / 2, z, z);
    }
    if (landed) markSettled();
  }
  function loop(t) {
    raf = 0;
    if (destroyed || document.hidden) return;
    readScroll();
    draw(t);
    const keep = !reduced() && visible && (flightEnd || o.drift || scrollMoving);
    scrollMoving = false;
    if (keep) raf = requestAnimationFrame(loop);
  }
  function wake() { if (!raf && !destroyed && !document.hidden) raf = requestAnimationFrame(loop); }

  // ---- size, scroll, visibility ---------------------------------------------------------
  function resize() {
    if (destroyed) return;
    const r = canvas.getBoundingClientRect();
    const cw = canvas.clientWidth || r.width, ch = canvas.clientHeight || r.height;
    if (!cw || !ch) return;
    const nd = Math.min(devicePixelRatio || 1, 2);
    if (cw === W && ch === H && nd === dpr) return;
    const first = !W;
    W = cw; H = ch; dpr = nd;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    retarget(first && !reduced());
  }
  let scrollMoving = false;
  function readScroll() {
    if (!o.scatterOnScroll) return;
    const r = canvas.getBoundingClientRect();
    const rootEl = o.scrollRoot ?? scrollParent(canvas);
    const top = rootEl ? rootEl.getBoundingClientRect().top : 0;
    // 0 while the canvas is fully below the scroll root's top edge, 1 once it has scrolled out.
    scroll = r.height ? clamp01((top - r.top) / r.height) : 0;
  }
  const onScroll = () => { scrollMoving = true; wake(); };
  // Any scroll (window or a scrolling ancestor) wakes the loop; capture sees non-bubbling scrolls.
  function bindScroll() { document.addEventListener('scroll', onScroll, { capture: true, passive: true }); }
  function unbindScroll() { document.removeEventListener('scroll', onScroll, { capture: true }); }

  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null;
  ro?.observe(canvas);
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) wake(); }) : null;
  io?.observe(canvas);
  const onVis = () => { if (!document.hidden) wake(); };
  document.addEventListener('visibilitychange', onVis);
  const onMotion = () => {
    if (destroyed) return;
    if (reduced()) { snap(); draw(performance.now()); markSettled(); } else { if (canvas.dataset.particles === 'static') canvas.dataset.particles = 'settled'; wake(); }
  };
  const motionObs = new MutationObserver(onMotion);
  motionObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  let mq = null;
  try { mq = matchMedia('(prefers-reduced-motion: reduce)'); mq.addEventListener?.('change', onMotion); } catch { /* ignore */ }
  bindScroll();
  canvas.dataset.particles = 'forming';
  resize();
  let firstRaf = W ? 0 : requestAnimationFrame(() => { firstRaf = 0; resize(); });

  return {
    /** Re-form into new data. Pass any of the options; the rest stay. */
    set(next = {}) {
      if (destroyed) return;
      o = { ...o, ...next };
      if ('text' in next && next.text != null && !('values' in next)) o.values = undefined;
      if ('values' in next && next.values != null && !('text' in next)) o.text = undefined;
      if ('shape' in next && !('text' in next) && !('values' in next)) { o.text = undefined; o.values = undefined; }
      ink = rgbOf(o.color); accent = rgbOf(o.accent);
      if (next.label) { canvas.setAttribute('aria-label', next.label); canvas.setAttribute('role', 'img'); canvas.removeAttribute('aria-hidden'); }
      if (W) retarget(true);
    },
    /** Resolves once the particles have settled (immediately under reduced motion). */
    whenSettled() {
      if (canvas.dataset.particles !== 'forming') return Promise.resolve();
      return new Promise((res) => settleWaiters.push(res));
    },
    get count() { return parts.filter((p) => !p.dead).length; },
    get state() { return canvas.dataset.particles; },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(firstRaf);
      ro?.disconnect(); io?.disconnect(); motionObs.disconnect();
      mq?.removeEventListener?.('change', onMotion);
      document.removeEventListener('visibilitychange', onVis);
      unbindScroll();
      settleWaiters.forEach((fn) => fn()); settleWaiters = [];
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      parts = [];
    },
  };
}
