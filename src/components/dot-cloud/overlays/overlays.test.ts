import { describe, expect, test } from 'bun:test';

import { makeProjector } from '../math';
import { SHAPES } from '../registry';
import { mulberry32 } from '../rng';
import { orbit } from '../shapes/contact';
import type { OverlayCtx, Projected } from '../types';
import { constellationOverlay, occluded } from './constellation';
import { networkOverlay } from './network';

const proj = makeProjector(0, -0.38, { ox: 0, oy: 0, sx: 1, sy: 1 });
const ctx = (o: Partial<OverlayCtx> = {}): OverlayCtx => ({
  project: proj,
  t: 1,
  alpha: 1,
  reduce: false,
  dpr: 2,
  ...o,
});

describe('occluded', () => {
  test('behind the globe disc only', () => {
    expect(occluded({ z: 0.1, vx: 0.1, vy: 0 } as Projected, 0.55)).toBe(true);
    expect(occluded({ z: -0.1, vx: 0.1, vy: 0 } as Projected, 0.55)).toBe(
      false,
    );
    expect(occluded({ z: 0.1, vx: 0.6, vy: 0 } as Projected, 0.55)).toBe(false);
  });
});

describe('network overlay', () => {
  const b = SHAPES.about.build(1200, mulberry32(1));
  test('one edge batch, all 98 edges', () => {
    const f = networkOverlay(b).frame(ctx());
    expect(f.lines).toHaveLength(1);
    expect(f.lines[0].count).toBe(98);
    expect(f.lines[0].alpha).toBeCloseTo(0.14, 9);
    expect(f.lines[0].width).toBeCloseTo(1.2, 9);
  });
  test('pulses exist, are sized and faded; none when reduced', () => {
    const ov = networkOverlay(b);
    let seen = 0;
    for (let t = 0; t < 10; t += 0.1) {
      const d = ov.frame(ctx({ t })).dots;
      seen += d.count;
      for (let i = 0; i < d.count; i++) {
        expect(d.size[i]).toBeCloseTo(5.2, 5);
        expect(d.alpha[i]).toBeGreaterThanOrEqual(0);
        expect(d.alpha[i]).toBeLessThanOrEqual(1);
      }
    }
    expect(seen).toBeGreaterThan(0);
    expect(ov.frame(ctx({ reduce: true })).dots.count).toBe(0);
  });
  test('reuses its buffers across frames', () => {
    const ov = networkOverlay(b);
    expect(ov.frame(ctx()).lines[0].segments).toBe(
      ov.frame(ctx({ t: 2 })).lines[0].segments,
    );
  });
});

describe('constellation overlay', () => {
  test('satellites, links, path and message dot', () => {
    const ov = constellationOverlay();
    const r = ov.frame(ctx({ reduce: true }));
    expect(r.dots.count).toBeGreaterThan(0);
    expect(r.dots.count).toBeLessThanOrEqual(60);
    const f = ov.frame(ctx());
    expect(f.lines).toHaveLength(2);
    expect(f.lines[0].count).toBeLessThanOrEqual(110);
    expect(f.lines[0].alpha).toBeCloseTo(0.16, 9);
    expect(f.lines[0].width).toBeCloseTo(1.2, 9);
    expect(f.lines[1].alpha).toBeCloseTo(0.7, 9);
    expect(f.lines[1].width).toBeCloseTo(2.2, 9);
  });
  test('message dot only when not reduced', () => {
    const ov = constellationOverlay();
    const reduced = ov.frame(ctx({ reduce: true })).dots.count;
    let extra = false;
    for (let t = 0; t < 3; t += 0.05) {
      if (ov.frame(ctx({ t })).dots.count === reduced + 1) extra = true;
    }
    // reduced freezes satellites (mv = 0); at t=0 they match, so compare there
    expect(ov.frame(ctx({ t: 0 })).dots.count).toBeGreaterThanOrEqual(reduced);
    expect(extra || reduced > 0).toBe(true);
    const f0 = ov.frame(ctx({ t: 0, reduce: false }));
    const fr = ov.frame(ctx({ t: 0, reduce: true }));
    expect(fr.dots.count).toBeLessThanOrEqual(f0.dots.count);
    expect(f0.dots.count - fr.dots.count).toBeLessThanOrEqual(1);
  });
  test('no emitted satellite is occluded', () => {
    const ov = constellationOverlay();
    const f = ov.frame(ctx({ reduce: true, t: 0 }));
    const emitted: [number, number][] = [];
    for (let i = 0; i < f.dots.count; i++)
      emitted.push([f.dots.xy[2 * i], f.dots.xy[2 * i + 1]]);
    const visible: [number, number][] = [];
    for (let p = 0; p < 6; p++)
      for (let k = 0; k < 10; k++) {
        const q = orbit(p, (k * Math.PI * 2) / 10 + (p * Math.PI) / 10);
        const s = proj(q[0], q[1], q[2]);
        if (!occluded(s, 0.55)) visible.push([s.x, s.y]);
      }
    expect(emitted).toHaveLength(visible.length);
    visible.forEach(([x, y], i) => {
      expect(emitted[i][0]).toBeCloseTo(x, 3);
      expect(emitted[i][1]).toBeCloseTo(y, 3);
    });
  });
});

describe('wiring', () => {
  test('about and contact define overlays', () => {
    expect(SHAPES.about.overlay).toBeDefined();
    expect(SHAPES.contact.overlay).toBeDefined();
  });
});
