// dots.js: exact-count particles for the Proof Field. The kit's formParticles samples a stamped
// shape into however many particles fit; here the count *is* the meaning: one dot is one fact,
// or one dollar in a reconciliation bar. Same language as the kit (small square particles,
// minimum-jerk flight with a lift-off arc, ≤1 px drift once settled, static under reduced
// motion), plus identity: a dot keeps its id, so a fact flies from where it was to where it goes.
//
//   const d = mountDots(canvas, { label, layout: (W, H) => ({ points, backdrop(g, W, H) {} }) });
//   d.update();                 // re-run layout and fly every dot to its new place
//   d.update(newLayout);        // swap the layout, then fly
//   d.hit(x, y)                 // the point under a CSS-pixel position (or null)
//   d.destroy();
//
// point = { id, x, y, size, color: 'ink'|'blue'|'amber'|'green'|'faint'|'muted', alpha?, shape?: 'sq'|'ring'|'stale',
//           wander?: px (drift amplitude, for excluded facts), from?: {x, y} (spawn point), meta? }

const PALETTE = {
  ink: [23, 32, 51], blue: [7, 92, 255], amber: [199, 132, 16], amberInk: [154, 98, 0], green: [11, 107, 66],
  faint: [150, 162, 176], muted: [82, 97, 116],
};
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const minimumJerk = (x) => { const t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a, b, t) => a + (b - a) * t;
const random = (n, s = 0) => { const v = Math.sin(n * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
const FLIGHT_MS = 950;
const STAGGER_MS = 320;

export function reduced() {
  const m = document.documentElement.dataset.motion;
  if (m) return m === 'reduce';
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

export function mountDots(canvas, opts = {}) {
  const g = canvas.getContext('2d');
  let layout = opts.layout ?? (() => ({ points: [] }));
  let W = 0, H = 0, dpr = 1, raf = 0, visible = true, destroyed = false;
  let flightStart = 0, flightEnd = 0, backdrop = null;
  let dots = new Map();
  let waiters = [];
  const t0 = performance.now();
  if (opts.label) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', opts.label); } else canvas.setAttribute('aria-hidden', 'true');

  function apply(animate) {
    const res = layout(W, H) ?? { points: [] };
    backdrop = res.backdrop ?? null;
    const next = new Map();
    const pts = res.points ?? [];
    const n = pts.length;
    pts.forEach((q, i) => {
      const seed = hash(String(q.id));
      let d = dots.get(q.id);
      if (!d || d.dead) {
        const ang = seed * Math.PI * 2;
        const from = q.from ?? { x: q.x + Math.cos(ang) * (40 + seed * 80), y: q.y + Math.sin(ang) * (30 + seed * 50) };
        d = { id: q.id, x: from.x, y: from.y, a: 0, size: q.size, rgb: (PALETTE[q.color] ?? PALETTE.ink).slice(), kick: { x: Math.cos(ang), y: Math.sin(ang) },
          flow: { s: 0.25 + random(seed * 1000, 3) * 0.4, p: seed * 6.28 }, born: true };
      }
      Object.assign(d, {
        sx: d.x, sy: d.y, sa: d.a, ssize: d.size, srgb: d.rgb.slice(),
        tx: q.x, ty: q.y, ta: q.alpha ?? 1, tsize: q.size, trgb: (PALETTE[q.color] ?? PALETTE.ink).slice(),
        shape: q.shape ?? 'sq', wander: q.wander ?? 0, meta: q.meta ?? null, dead: false,
        // Stagger left to right so a re-form reads as a sweep, not a pop.
        delay: (n > 1 ? (q.x / Math.max(1, W)) * 0.75 + seed * 0.25 : 0) * STAGGER_MS,
      });
      next.set(q.id, d);
    });
    for (const [id, d] of dots) {
      if (next.has(id) || d.dead) continue;
      Object.assign(d, { sx: d.x, sy: d.y, sa: d.a, ssize: d.size, srgb: d.rgb.slice(), tx: d.x + d.kick.x * 50, ty: d.y + d.kick.y * 40 - 20, ta: 0, tsize: d.size, trgb: d.rgb.slice(), dead: true, delay: hash(id) * STAGGER_MS });
      next.set(id, d);
    }
    dots = next;
    if (!animate || reduced()) { snap(); draw(performance.now()); settled(); return; }
    flightStart = performance.now();
    flightEnd = flightStart + FLIGHT_MS + STAGGER_MS;
    canvas.dataset.particles = 'forming';
    wake();
  }
  function snap() {
    for (const [id, d] of dots) {
      if (d.dead) { dots.delete(id); continue; }
      d.x = d.tx; d.y = d.ty; d.a = d.ta; d.size = d.tsize; d.rgb = d.trgb.slice();
    }
    flightEnd = 0;
  }
  function settled() {
    canvas.dataset.particles = reduced() ? 'static' : 'settled';
    const w = waiters; waiters = []; w.forEach((fn) => fn());
  }
  function draw(t) {
    const landed = flightEnd && t >= flightEnd;
    if (landed) snap();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    if (backdrop) { g.save(); backdrop(g, W, H); g.restore(); }
    const red = reduced();
    const flying = flightEnd && t < flightEnd;
    const time = (t - t0) / 1000;
    for (const d of dots.values()) {
      if (flying) {
        const k = minimumJerk((t - flightStart - d.delay) / FLIGHT_MS);
        const lift = Math.sin(k * Math.PI) * 14;
        d.x = mix(d.sx, d.tx, k) + d.kick.x * lift * 0.5;
        d.y = mix(d.sy, d.ty, k) - lift * 0.6;
        d.a = mix(d.sa, d.ta, k);
        d.size = mix(d.ssize, d.tsize, k);
        for (let i = 0; i < 3; i++) d.rgb[i] = mix(d.srgb[i], d.trgb[i], k);
      }
      let x = d.x, y = d.y;
      if (!red && !flying) {
        const amp = d.wander || 0.6;
        x += Math.sin(time * d.flow.s + d.flow.p) * amp;
        y += Math.cos(time * d.flow.s * 0.83 + d.flow.p) * amp * 0.6;
      }
      if (d.a <= 0.01) continue;
      const c = `rgba(${d.rgb[0] | 0},${d.rgb[1] | 0},${d.rgb[2] | 0},${d.a > 1 ? 1 : d.a.toFixed(3)})`;
      const z = d.size;
      if (d.shape === 'ring') {
        g.strokeStyle = c; g.lineWidth = Math.max(1.5, z * 0.14);
        g.beginPath(); g.arc(x, y, z / 2, 0, Math.PI * 2); g.stroke();
      } else {
        g.fillStyle = c;
        g.fillRect(x - z / 2, y - z / 2, z, z);
        if (d.shape === 'stale') {
          g.strokeStyle = `rgba(245,184,61,${d.a > 1 ? 1 : d.a.toFixed(3)})`; g.lineWidth = 1.5;
          g.strokeRect(x - z / 2 - 3, y - z / 2 - 3, z + 6, z + 6);
        }
      }
    }
    if (landed) settled();
  }
  function loop(t) {
    raf = 0;
    if (destroyed || document.hidden) return;
    draw(t);
    if (!reduced() && visible && (flightEnd || opts.drift !== false)) raf = requestAnimationFrame(loop);
  }
  function wake() { if (!raf && !destroyed && !document.hidden) raf = requestAnimationFrame(loop); }
  function resize() {
    if (destroyed) return;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const nd = Math.min(devicePixelRatio || 1, 2);
    if (cw === W && ch === H && nd === dpr) return;
    const first = !W;
    W = cw; H = ch; dpr = nd;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    apply(first && !reduced());
  }
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null;
  ro?.observe(canvas);
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver((es) => { visible = es.some((e) => e.isIntersecting); if (visible) wake(); }) : null;
  io?.observe(canvas);
  const onVis = () => { if (!document.hidden) wake(); };
  document.addEventListener('visibilitychange', onVis);
  const motionObs = new MutationObserver(() => { if (destroyed) return; if (reduced()) { snap(); draw(performance.now()); settled(); } else { if (canvas.dataset.particles === 'static') canvas.dataset.particles = 'settled'; wake(); } });
  motionObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
  canvas.dataset.particles = 'forming';
  resize();
  let firstRaf = W ? 0 : requestAnimationFrame(() => { firstRaf = 0; resize(); });

  return {
    update(nextLayout, { animate = true } = {}) {
      if (destroyed) return;
      if (typeof nextLayout === 'function') layout = nextLayout;
      if (W) apply(animate);
    },
    hit(x, y, pad = 4) {
      let best = null, bd = Infinity;
      for (const d of dots.values()) {
        if (d.dead || !d.meta) continue;
        const r = d.size / 2 + pad;
        const dx = Math.abs(d.tx - x), dy = Math.abs(d.ty - y);
        if (dx <= r && dy <= r && dx + dy < bd) { best = d; bd = dx + dy; }
      }
      return best ? { id: best.id, x: best.tx, y: best.ty, size: best.size, meta: best.meta } : null;
    },
    whenSettled() { return canvas.dataset.particles === 'forming' ? new Promise((r) => waiters.push(r)) : Promise.resolve(); },
    get count() { let n = 0; for (const d of dots.values()) if (!d.dead) n++; return n; },
    countBy(pred) { let n = 0; for (const d of dots.values()) if (!d.dead && pred(d)) n++; return n; },
    get size() { return { W, H }; },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); cancelAnimationFrame(firstRaf);
      ro?.disconnect(); io?.disconnect(); motionObs.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      waiters.forEach((fn) => fn()); waiters = [];
      dots = new Map();
    },
  };
}

/** Paint the 6px stipple dot grid ("no evidence") into a rect on a canvas. */
export function stipple(g, x, y, w, h, { step = 6, r = 1, color = 'rgba(195,203,214,1)', fill = 'rgba(244,246,248,1)', radius = 8 } = {}) {
  g.save();
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, w, h, radius); else g.rect(x, y, w, h);
  g.fillStyle = fill; g.fill(); g.clip();
  g.fillStyle = color;
  for (let yy = y + step / 2; yy < y + h; yy += step) for (let xx = x + step / 2; xx < x + w; xx += step) { g.beginPath(); g.arc(xx, yy, r, 0, Math.PI * 2); g.fill(); }
  g.restore();
}
