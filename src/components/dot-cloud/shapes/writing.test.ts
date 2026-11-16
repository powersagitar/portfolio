import { describe, expect, test } from 'bun:test';

import { SHAPES } from '../registry';
import { mulberry32 } from '../rng';
import { buildPen, penAt } from './pen';
import { writing } from './writing';

const N = 1200;
const b = writing.build(N, mulberry32(7));
const inkU = b.inkU as Float32Array;
const animate = writing.animate!;
const frame = (t: number, reduce: boolean) =>
  animate(b, new Float32Array(N * 3), t, reduce);

describe('pen', () => {
  test('endpoints', () => {
    expect(penAt(0)[0]).toBeCloseTo(-1.2, 6);
    expect(penAt(0)[1]).toBeCloseTo(0.51, 6);
    expect(penAt(1)[0]).toBeCloseTo(0.55, 6);
    expect(penAt(1)[1]).toBeCloseTo(0.5, 6);
  });
  test('lift is a gap between the two strokes', () => {
    const { lift } = buildPen();
    expect(lift[0]).toBeGreaterThan(0);
    expect(lift[0]).toBeLessThan(lift[1]);
    expect(lift[1]).toBeLessThan(1);
  });
  test('clamps u', () => {
    expect(penAt(-1)).toEqual(penAt(0));
    expect(penAt(2)).toEqual(penAt(1));
  });
  test('speed is bounded by total length', () => {
    const { T } = buildPen();
    for (let k = 0; k < 100; k++) {
      const u = k * 0.01;
      const a = penAt(u);
      const c = penAt(u + 0.01);
      expect(Math.hypot(c[0] - a[0], c[1] - a[1])).toBeLessThanOrEqual(
        0.01 * T + 1e-6,
      );
    }
  });
});

describe('writing', () => {
  test('registered, settle view', () => {
    expect(SHAPES.writing).toBe(writing);
    expect(writing.view).toEqual({ kind: 'settle' });
    expect(writing.tilt).toBe(-0.2);
  });

  test('inkU layout', () => {
    const { lift } = buildPen();
    expect(inkU.length).toBe(N);
    for (let i = 0; i < N; i++) {
      if (i % 20 < 9) expect(inkU[i]).toBe(-1);
      else {
        expect(inkU[i]).toBeGreaterThanOrEqual(0);
        expect(inkU[i]).toBeLessThanOrEqual(1);
        expect(inkU[i] > lift[0] && inkU[i] < lift[1]).toBe(false);
      }
    }
  });

  test('animate writes into out and returns it', () => {
    const out = new Float32Array(N * 3);
    expect(animate(b, out, 1, false)).toBe(out);
  });

  test('t=0: ink at the pen start, quill offset', () => {
    const o = frame(0, false);
    for (let i = 0; i < N; i++) {
      if (inkU[i] >= 0) {
        expect(o[i * 3]).toBeCloseTo(penAt(0)[0], 5);
        expect(o[i * 3 + 1]).toBeCloseTo(penAt(0)[1], 5);
      }
    }
    expect(o[0]).toBeCloseTo(b.points[0] + penAt(0)[0] - penAt(1)[0], 5);
    expect(o[1]).toBeCloseTo(b.points[1] + penAt(0)[1] - penAt(1)[1], 5);
  });

  for (const [t, reduce] of [
    [6, false],
    [0, true],
  ] as const) {
    test(`finished frame (t=${t}, reduce=${reduce})`, () => {
      const o = frame(t, reduce);
      for (let i = 0; i < N; i++) {
        if (inkU[i] < 0) {
          for (let k = 0; k < 3; k++)
            expect(o[i * 3 + k]).toBeCloseTo(b.points[i * 3 + k], 5);
        } else {
          expect(o[i * 3]).toBeCloseTo(penAt(inkU[i])[0], 5);
          expect(o[i * 3 + 1]).toBeCloseTo(penAt(inkU[i])[1], 5);
        }
      }
    });
  }

  test('mid-write clamps ink at the pen', () => {
    const o = frame(2.75, false);
    let hi = 0;
    for (let i = 0; i < N; i++) {
      if (inkU[i] < 0) continue;
      const e = penAt(Math.min(inkU[i], 0.5));
      if (inkU[i] > 0.5) hi++;
      expect(o[i * 3]).toBeCloseTo(e[0], 5);
      expect(o[i * 3 + 1]).toBeCloseTo(e[1], 5);
    }
    expect(hi).toBeGreaterThan(0);
  });
});
