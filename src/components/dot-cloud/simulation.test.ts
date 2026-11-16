import { describe, expect, test } from 'bun:test';

import { TAU, dotAlpha, homeLayout, makeProjector, postLayout } from './math';
import { SHAPES } from './registry';
import { mulberry32 } from './rng';
import { penAt } from './shapes/pen';
import { writing } from './shapes/writing';
import {
  DEFAULT_SEED,
  type HomeInput,
  createHomeSim,
  createPostSim,
} from './simulation';
import type {
  CloudKey,
  OverlayCtx,
  OverlayFrame,
  ShapeBuild,
  ShapeDef,
} from './types';

const FRAME = 1000 / 60;
const base = { mx: 0, my: 0, W: 1440, H: 900, dpr: 1, phone: false };

/** Steps a sim with a shared clock. */
function driver(reduce: boolean, shapes?: Record<CloudKey, ShapeDef>) {
  const sim = createHomeSim({ reduce, shapes });
  let now = 0;
  const run = (key: CloudKey, frames: number, extra?: Partial<HomeInput>) => {
    let f = sim.step({ ...base, key, now, ...extra });
    for (let k = 1; k < frames; k++) {
      now += FRAME;
      f = sim.step({ ...base, key, now, ...extra });
    }
    now += FRAME;
    return f;
  };
  return { sim, run, now: () => now };
}

/** Reproduces the sim's own builds (same seed, same CloudKey order). */
function builds(n = 1200, seed = DEFAULT_SEED) {
  const r = mulberry32(seed);
  const out = {} as Record<CloudKey, ShapeBuild>;
  for (const k of Object.keys(SHAPES) as CloudKey[])
    out[k] = SHAPES[k].build(n, r);
  return out;
}

const maxDiff = (a: Float32Array, b: Float32Array) => {
  let m = 0;
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]));
  return m;
};

describe('home sim', () => {
  test('reduce: badge snaps in one step', () => {
    const { sim, run } = driver(true);
    run('badge', 1);
    expect(Array.from(sim.state().cur)).toEqual(
      Array.from(builds().badge.points),
    );
  });

  test('morphs to badge within 600 steps', () => {
    const { sim, run } = driver(false);
    run('home', 1);
    expect(maxDiff(sim.state().cur, builds().badge.points)).toBeGreaterThan(
      0.1,
    );
    run('badge', 600);
    expect(maxDiff(sim.state().cur, builds().badge.points)).toBeLessThan(1e-3);
  });

  test('home drifts', () => {
    const { sim, run } = driver(false);
    run('home', 600);
    const a = sim.state().cur.slice();
    run('home', 100);
    expect(maxDiff(a, sim.state().cur)).toBeGreaterThan(0.01);
  });

  test('about settles near 0.35', () => {
    const { sim, run } = driver(false);
    run('about', 900);
    const ry = ((sim.state().ry % TAU) + TAU) % TAU;
    expect(Math.abs(ry - 0.35)).toBeLessThan(0.2);
  });

  test('re-selecting writing restarts the quill without a jump', () => {
    const { sim, run, now } = driver(false);
    run('writing', 400);
    run('about', 30);
    const prev = sim.state().cur.slice();
    const at = now();
    run('writing', 1);
    const s = sim.state();
    expect(s.selectedAt).toBe(at);
    const w = builds().writing;
    const inkU = w.inkU!;
    const anchor = w.inkAnchor!;
    const ox = penAt(0)[0] - penAt(1)[0];
    const oy = penAt(0)[1] - penAt(1)[1];
    let riding = 0;
    for (let i = 0; i < 1200; i++) {
      const j = i * 3;
      // ink far from the nib rides on its quill anchor at the pen start
      if (inkU[i] >= 0.08) {
        riding++;
        const q = anchor[i] * 3;
        expect(s.target[j]).toBeCloseTo(w.points[q] + ox, 5);
        expect(s.target[j + 1]).toBeCloseTo(w.points[q + 1] + oy, 5);
      }
      // ink about to be fed into the nib may move fast; the rest eases
      const fast = inkU[i] >= 0 && inkU[i] < 0.08;
      for (let c = 0; c < 3; c++) {
        const move = Math.abs(s.cur[j + c] - prev[j + c]);
        const gap = Math.abs(s.target[j + c] - prev[j + c]);
        expect(move).toBeLessThanOrEqual((fast ? 0.5 : 0.1) * gap + 1e-6);
      }
    }
    expect(riding).toBeGreaterThan(0);
  });

  test('dt is clamped', () => {
    const sim = createHomeSim({ reduce: false });
    sim.step({ ...base, key: 'badge', now: 0 });
    sim.step({ ...base, key: 'badge', now: FRAME });
    const ry0 = sim.state().ry;
    sim.step({ ...base, key: 'badge', now: FRAME + 10_000 });
    expect(Math.abs(sim.state().ry - ry0)).toBeLessThanOrEqual(0.01 + 1e-9);
  });

  test('overlay alpha eases in and out; emitted only above 0.01', () => {
    const calls: OverlayCtx[] = [];
    const frame: OverlayFrame = {
      lines: [],
      dots: {
        xy: new Float32Array(0),
        size: new Float32Array(0),
        alpha: new Float32Array(0),
        count: 0,
      },
    };
    const about: ShapeDef = {
      ...SHAPES.about,
      overlay: () => ({
        frame: (ctx) => {
          calls.push({ ...ctx });
          return frame;
        },
      }),
    };
    const { sim, run } = driver(false, { ...SHAPES, about });
    run('home', 1);
    let f = run('about', 120, { mx: 0.2, my: -0.1 });
    expect(sim.state().overlayAlpha.about).toBeGreaterThan(0.9);
    expect(f.overlays).toEqual([frame]);
    // project matches the dots' projector this frame
    const last = calls[calls.length - 1];
    const s = sim.state();
    const proj = makeProjector(
      s.ry + 0.2 * 0.6,
      SHAPES.about.tilt - 0.1 * 0.3,
      homeLayout(1440, 900, false, s.homeBlend),
    );
    const p = last.project(0.3, -0.2, 0.1);
    const q = proj(0.3, -0.2, 0.1);
    expect(p.x).toBeCloseTo(q.x, 3);
    expect(p.y).toBeCloseTo(q.y, 3);
    expect(f.dots.xy[0]).toBeCloseTo(proj(s.cur[0], s.cur[1], s.cur[2]).x, 2);
    expect(f.dots.xy[1]).toBeCloseTo(proj(s.cur[0], s.cur[1], s.cur[2]).y, 2);
    expect(last.alpha).toBe(s.overlayAlpha.about!);
    expect(last.reduce).toBe(false);
    expect(last.dpr).toBe(1);
    f = run('home', 120);
    expect(sim.state().overlayAlpha.about).toBeLessThan(0.01);
    expect(f.overlays).toEqual([]);
  });

  test('dot batch: 1200 dots, alpha in [0.072, 1]', () => {
    const { run } = driver(false);
    for (const key of ['home', 'about', 'badge'] as CloudKey[]) {
      const f = run(key, 30);
      expect(f.dots.count).toBe(1200);
      for (let i = 0; i < 1200; i++) {
        expect(f.dots.alpha[i]).toBeGreaterThanOrEqual(0.072 - 1e-6);
        expect(f.dots.alpha[i]).toBeLessThanOrEqual(1);
      }
    }
  });

  test('buffers are reused across frames', () => {
    const { sim, run } = driver(false);
    const a = run('home', 1);
    const cur = sim.state().cur;
    const b = run('badge', 5);
    expect(b.dots.xy).toBe(a.dots.xy);
    expect(b.overlays).toBe(a.overlays);
    expect(sim.state().cur).toBe(cur);
  });
});

describe('post sim', () => {
  test('reduce at now=0 shows the projected finished quill', () => {
    const sim = createPostSim({ reduce: true });
    const f = sim.step({ now: 0, mx: 0, my: 0, W: 1440, H: 900, dpr: 1 });
    const b = writing.build(900, mulberry32(DEFAULT_SEED));
    const pts = writing.animate!(b, new Float32Array(900 * 3), 1e9, false);
    const proj = makeProjector(0.6, -0.25, postLayout(1440, 900));
    expect(f.dots.count).toBe(900);
    expect(f.overlays).toEqual([]);
    for (let i = 0; i < 900; i++) {
      const p = proj(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
      expect(f.dots.xy[i * 2]).toBeCloseTo(p.x, 2);
      expect(f.dots.xy[i * 2 + 1]).toBeCloseTo(p.y, 2);
      expect(f.dots.alpha[i]).toBeCloseTo(dotAlpha(p.z, false), 5);
    }
  });

  test('eases dots and settles on the finished quill', () => {
    const sim = createPostSim({ reduce: false });
    const step = (now: number) =>
      sim.step({ now, mx: 0, my: 0, W: 1440, H: 900, dpr: 1 });
    const a = step(0).dots.xy.slice();
    const b1 = step(FRAME).dots.xy.slice();
    expect(Array.from(b1)).not.toEqual(Array.from(a));
    let f = step(FRAME * 2);
    for (let k = 3; k < 60 * 8; k++) f = step(FRAME * k);
    const b = writing.build(900, mulberry32(DEFAULT_SEED));
    const pts = writing.animate!(b, new Float32Array(900 * 3), 1e9, false);
    const t = (FRAME * (60 * 8 - 1)) / 1000;
    const proj = makeProjector(
      Math.sin(t * 0.3) * 0.5,
      -0.25,
      postLayout(1440, 900),
    );
    for (let i = 0; i < 900; i++) {
      const p = proj(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
      expect(f.dots.xy[i * 2]).toBeCloseTo(p.x, 0);
      expect(f.dots.xy[i * 2 + 1]).toBeCloseTo(p.y, 0);
    }
  });
});
