import { describe, expect, test } from 'bun:test';

import { SHAPES } from '../registry';
import { mulberry32 } from '../rng';
import { NIB, buildPen, penAt } from './pen';
import { WRITE_SECONDS, writeFrame, writeProgress, writing } from './writing';

const N = 1200;
const b = writing.build(N, mulberry32(7));
const inkU = b.inkU as Float32Array;
const anchor = b.inkAnchor as Int32Array;
const animate = writing.animate!;
const frame = (t: number, reduce: boolean, rate?: Float32Array) =>
  writeFrame(b, new Float32Array(N * 3), t, reduce, rate);

describe('pen', () => {
  test('one stroke from the M into the nib', () => {
    expect(penAt(0)[0]).toBeCloseTo(-1.307, 6);
    expect(penAt(0)[1]).toBeCloseTo(0.95, 6);
    expect(penAt(1)[0]).toBeCloseTo(NIB[0], 6);
    expect(penAt(1)[1]).toBeCloseTo(NIB[1], 6);
    expect(buildPen().end).toEqual(penAt(1));
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

  test('inkU and anchor layout', () => {
    expect(inkU.length).toBe(N);
    expect(anchor.length).toBe(N);
    for (let i = 0; i < N; i++) {
      if (i % 20 < 9) expect(inkU[i]).toBe(-1);
      else {
        expect(inkU[i]).toBeGreaterThanOrEqual(0);
        expect(inkU[i]).toBeLessThanOrEqual(1);
      }
      expect(inkU[anchor[i]]).toBe(-1);
    }
  });

  test('quill points stay inside the frame', () => {
    for (let i = 0; i < N; i++) {
      if (inkU[i] >= 0) continue;
      expect(Math.abs(b.points[i * 3])).toBeLessThan(1.5);
      expect(Math.abs(b.points[i * 3 + 1])).toBeLessThan(1.05);
    }
  });

  test('animate delays writeFrame and returns out', () => {
    const out = new Float32Array(N * 3);
    expect(animate(b, out, 1, false)).toBe(out);
    expect(
      Array.from(animate(b, new Float32Array(N * 3), 1.35, false)),
    ).toEqual(Array.from(frame(1, false)));
  });

  test('progress eases over WRITE_SECONDS', () => {
    expect(writeProgress(-1, false)).toBe(0);
    expect(writeProgress(WRITE_SECONDS / 2, false)).toBeCloseTo(0.5, 6);
    expect(writeProgress(WRITE_SECONDS, false)).toBe(1);
    expect(writeProgress(0, true)).toBe(1);
  });

  test('t=0: quill offset to the pen start, ink rides on the quill', () => {
    const o = frame(0, false);
    const ox = penAt(0)[0] - NIB[0];
    const oy = penAt(0)[1] - NIB[1];
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      if (inkU[i] < 0) {
        expect(o[j]).toBeCloseTo(b.points[j] + ox, 5);
        expect(o[j + 1]).toBeCloseTo(b.points[j + 1] + oy, 5);
      } else if (inkU[i] >= 0.08) {
        const q = anchor[i] * 3;
        expect(o[j]).toBeCloseTo(b.points[q] + ox, 5);
        expect(o[j + 1]).toBeCloseTo(b.points[q + 1] + oy, 5);
        expect(o[j + 2]).toBeCloseTo(b.points[q + 2], 5);
      }
    }
  });

  for (const [t, reduce] of [
    [WRITE_SECONDS, false],
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

  test('mid-write: laid, feeding and riding ink', () => {
    const p = 0.5;
    const rate = new Float32Array(N).fill(0.25);
    const o = frame(WRITE_SECONDS / 2, false, rate);
    const tip = penAt(p);
    let laid = 0;
    let feeding = 0;
    let riding = 0;
    for (let i = 0; i < N; i++) {
      const u = inkU[i];
      const j = i * 3;
      if (u < 0) {
        expect(rate[i]).toBe(0.25);
      } else if (u <= p) {
        laid++;
        expect(o[j]).toBeCloseTo(penAt(u)[0], 5);
        expect(o[j + 1]).toBeCloseTo(penAt(u)[1], 5);
        expect(rate[i]).toBeCloseTo(u <= p - 0.03 ? 1 : 0.6, 6);
      } else if (u - p < 0.08) {
        feeding++;
        expect(rate[i]).toBeCloseTo(0.5, 6);
        if (u - p < 0.03) {
          // fully slid into the nib
          expect(o[j]).toBeCloseTo(tip[0], 5);
          expect(o[j + 1]).toBeCloseTo(tip[1], 5);
        }
      } else {
        riding++;
        expect(rate[i]).toBe(0.25);
        const q = anchor[i] * 3;
        expect(o[j]).toBeCloseTo(b.points[q] + tip[0] - NIB[0], 5);
        expect(o[j + 1]).toBeCloseTo(b.points[q + 1] + tip[1] - NIB[1], 5);
      }
    }
    expect(laid).toBeGreaterThan(0);
    expect(feeding).toBeGreaterThan(0);
    expect(riding).toBeGreaterThan(0);
  });
});
