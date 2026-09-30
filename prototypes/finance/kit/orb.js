// orb.js: paints real thinking-orbs-engine frames onto a canvas and recolours
// the dots from the frame data (no CSS filter). One shared rAF loop drives every
// mounted orb and stops while the tab is hidden. Owner: architect.
//
//   const orb = mountOrb(canvas, { size: 64, preset: 'breathing', tint: 'ink' });
//   orb.setPreset('working');          // 300 ms crossfade (instant under reduced motion)
//   orb.setTint('blue', { mix: .6 });  // lerp dots toward #075cff at 60% over 600 ms
//   orb.freeze(true);                  // elapsed time stops; still repaints recolours
//   orb.setReducedMotion(true);        // static frame, no crossfade, tint snaps
//   orb.destroy();

import { MODE_FRAMES, resolvePreset, STATE_TO_MODE } from './thinking-orbs-engine.js';

/** The 9 engine presets, in engine order. */
export const ORB_PRESETS = Object.freeze(Object.keys(STATE_TO_MODE));

/** Dot colours. `ink` is --ink #172033; others match tokens.css. */
export const ORB_TINTS = Object.freeze({
  ink: [23, 32, 51],
  blue: [7, 92, 255],
  amber: [154, 98, 0],
  green: [11, 107, 66],
});

const CROSSFADE_MS = 300; // --m-orb-x
const TINT_MS = 600;
const LINE_ALPHA = 0.5; // connecting preset's links at 50% alpha

const live = new Set();
let raf = 0;

function loop(now) {
  raf = 0;
  if (document.hidden) return; // resumed by visibilitychange
  // Keep scheduling only while some orb still moves (a crossfade, a tint, or elapsed time).
  // Under reduced motion or a freeze the loop stops after the repaint; setters kick() it again.
  let more = false;
  for (const orb of live) if (orb._tick(now)) more = true;
  if (more) raf = requestAnimationFrame(loop);
}
function kick() {
  if (!raf && live.size && !document.hidden) raf = requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    for (const orb of live) orb._resetClock();
    kick();
  }
});

const lerp = (a, b, t) => a + (b - a) * t;
const mixRGB = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (t) => 1 - (1 - t) * (1 - t);

// Depth shade. The engine's `white` is brightness on a dark ground (front dots
// have higher white, ~0.1..0.78). On the light island front dots must read
// strongest, so alpha = a · (0.55 + 0.45 · depth), depth = white normalised.
// On the white capsule the field needs more presence than on a dark ground: the floor is
// 0.72 (so back dots still read) and front dots reach full ink.
const shade = (white, floor = 0.72) => floor + (1 - floor) * clamp01((white ?? 0.5) / 0.7);
/** Idle ("breathing", nothing in flight) is the quietest state: lighter, smaller dots on the
 *  CONTRACT §8.3 floor, so it never outweighs real activity. Amber (P0, stopped) stays strong. */
const QUIET = { breathing: { a: 0.55, r: 0.8, floor: 0.55 } };
/** The engine's field fills ~72% of its box; scale it to ~90% of the button (k) and give
 *  dots a little more body (rMul), so the orb reads as a solid dotted disc at 74% zoom. */
const PRESENCE = { 64: { k: 1.25, rMul: 1.3 }, 20: { k: 1.2, rMul: 1.15 } };

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{size?:64|20, preset?:string, tint?:keyof ORB_TINTS, mix?:number,
 *          frozen?:boolean, reducedMotion?:boolean, speed?:number,
 *          elapsed?:number, backing?:number}} [opts]
 */
export function mountOrb(canvas, opts = {}) {
  if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('mountOrb needs a <canvas>');
  const size = opts.size === 20 ? 20 : 64; // the engine has only two tuned profiles
  const backing = opts.backing ?? 2; // 128×128 for 64, 40×40 for 20
  canvas.width = canvas.height = size * backing;
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');

  const check = (p) => {
    if (!ORB_PRESETS.includes(p)) throw new RangeError(`Unknown orb preset "${p}"`);
    return p;
  };

  let preset = check(opts.preset ?? 'breathing');
  let fromPreset = null; // crossfade source
  let xfadeStart = 0;
  let elapsed = opts.elapsed ?? 0; // seconds of engine time before × preset speed
  let last = performance.now();
  let frozen = !!opts.frozen;
  let reduced = !!opts.reducedMotion;
  const speed = opts.speed ?? 1;

  const target0 = mixRGB(ORB_TINTS.ink, ORB_TINTS[opts.tint ?? 'ink'] ?? ORB_TINTS.ink, opts.mix ?? 1);
  let color = target0.slice();
  let colorFrom = color.slice();
  let colorTo = color.slice();
  let tintStart = 0;
  let tintMs = 0;
  let dirty = true;
  let destroyed = false;
  let tintName = opts.tint ?? 'ink';

  function drawPreset(name, alphaMul0, rgb) {
    const q = tintName !== 'amber' ? QUIET[name] : null;
    const alphaMul = alphaMul0 * (q?.a ?? 1);
    const rK = q?.r ?? 1;
    const floor = q?.floor ?? 0.72;
    const { mode, speed: s, opts: o } = resolvePreset(name, size);
    let frame;
    try {
      frame = MODE_FRAMES[mode](size, elapsed * s * speed, o);
    } catch {
      // morph (shaping) can index past its last shape at an exact float boundary; nudge.
      frame = MODE_FRAMES[mode](size, elapsed * s * speed + 1e-3, o);
    }
    const [r, g, b] = rgb;
    const R = Math.round(r), G = Math.round(g), B = Math.round(b);
    if (frame.lines && frame.lines.length) {
      for (const l of frame.lines) {
        const a = (l.a ?? 1) * LINE_ALPHA * shade(l.white, floor) * alphaMul;
        if (a <= 0.003) continue;
        ctx.strokeStyle = `rgba(${R},${G},${B},${a})`;
        ctx.lineWidth = l.w;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
      }
    }
    for (const d of frame.dots) {
      const a = (d.a ?? 1) * shade(d.white, floor) * alphaMul;
      if (a <= 0.003 || !(d.r > 0)) continue;
      ctx.fillStyle = `rgba(${R},${G},${B},${a > 1 ? 1 : a})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r * rMul * rK, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const { k, rMul } = PRESENCE[size];
  function paint(now) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const kb = backing * k;
    ctx.setTransform(kb, 0, 0, kb, ((1 - k) * size * backing) / 2, ((1 - k) * size * backing) / 2);
    if (fromPreset) {
      const k = clamp01((now - xfadeStart) / CROSSFADE_MS);
      drawPreset(fromPreset, 1 - k, color);
      drawPreset(preset, k, color);
      if (k >= 1) fromPreset = null;
    } else {
      drawPreset(preset, 1, color);
    }
  }

  const api = {
    canvas,
    size,
    _tick(now) {
      if (destroyed) return false;
      // rAF timestamps can precede a performance.now() taken at mount; never step
      // time backwards (the engine's morph preset indexes shapes by time and breaks on t < 0).
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      if (now > last) last = now;
      const moving = !frozen && !reduced;
      if (moving) elapsed += dt;
      let animating = moving || !!fromPreset;
      if (tintMs && now - tintStart < tintMs) {
        color = mixRGB(colorFrom, colorTo, easeOut(clamp01((now - tintStart) / tintMs)));
        animating = true;
      } else if (tintMs) {
        color = colorTo.slice();
        tintMs = 0;
        animating = true;
      }
      if (animating || dirty) {
        paint(now);
        dirty = false;
      }
      return moving || !!fromPreset || !!tintMs;
    },
    _resetClock() {
      last = performance.now();
    },
    /** Switch preset (one of ORB_PRESETS). 300 ms crossfade unless reduced motion. */
    setPreset(name) {
      check(name);
      if (name === preset) return api;
      if (!reduced) {
        fromPreset = preset;
        xfadeStart = performance.now();
      }
      preset = name;
      dirty = true;
      kick();
      return api;
    },
    /** Recolour: 'ink' | 'blue' | 'amber' | 'green'. mix 0..1 toward that tint from ink. */
    setTint(name, { mix = 1, ms = TINT_MS } = {}) {
      const rgb = ORB_TINTS[name];
      if (!rgb) throw new RangeError(`Unknown orb tint "${name}"`);
      const to = mixRGB(ORB_TINTS.ink, rgb, clamp01(mix));
      if (tintName !== name) dirty = true;
      tintName = name;
      if (to.every((v, i) => Math.abs(v - colorTo[i]) < 0.5) && !tintMs) return api;
      colorFrom = color.slice();
      colorTo = to;
      if (reduced || ms <= 0) {
        color = to.slice();
        tintMs = 0;
      } else {
        tintStart = performance.now();
        tintMs = ms;
      }
      dirty = true;
      kick();
      return api;
    },
    /** true = stop elapsed time (P0 "stopped, not proceeding"); frame still repaints on recolour. */
    freeze(on = true) {
      frozen = !!on;
      dirty = true;
      kick();
      return api;
    },
    setReducedMotion(on = true) {
      reduced = !!on;
      if (reduced) fromPreset = null;
      dirty = true;
      kick();
      return api;
    },
    getPreset: () => preset,
    getElapsed: () => elapsed,
    getColor: () => color.map(Math.round),
    isFrozen: () => frozen,
    destroy() {
      destroyed = true;
      live.delete(api);
    },
  };

  live.add(api);
  api._tick(performance.now()); // paint the first frame synchronously (no empty flash on mount)
  kick();
  return api;
}
