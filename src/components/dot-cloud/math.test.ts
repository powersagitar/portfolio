import { describe, expect, test } from 'bun:test';

import {
  dotAlpha,
  dotSize,
  easeRate,
  homeLayout,
  isPhone,
  makeProjector,
  postLayout,
} from './math';
import { mulberry32 } from './rng';

const close = (a: object, b: Record<string, number>) => {
  for (const [k, v] of Object.entries(b)) {
    expect((a as Record<string, number>)[k]).toBeCloseTo(v, 6);
  }
};

describe('layouts', () => {
  test('home desktop, blend 0', () => {
    close(homeLayout(1000, 800, false, 0), {
      ox: 710,
      oy: 400,
      sx: 197.2,
      sy: 197.2,
    });
  });
  test('home desktop, blend 1', () => {
    close(homeLayout(1000, 800, false, 1), {
      ox: 500,
      oy: 400,
      sx: 500 / 1.3,
      sy: 400 / 0.92,
    });
  });
  test('home phone, blend 0', () => {
    close(homeLayout(390, 844, true, 0), {
      ox: 195,
      oy: 303.84,
      sx: 132.6,
      sy: 132.6,
    });
  });
  test('post', () => {
    close(postLayout(800, 600), { ox: 400, oy: 300, sx: 216, sy: 216 });
  });
  test('isPhone boundary', () => {
    expect(isPhone(700)).toBe(true);
    expect(isPhone(701)).toBe(false);
  });
});

describe('projector', () => {
  const p = makeProjector(0, 0, { ox: 0, oy: 0, sx: 100, sy: 100 });
  test('origin and axes', () => {
    close(p(0, 0, 0), { x: 0, y: 0, f: 1, z: 0 });
    expect(p(1, 0, 0).x).toBeCloseTo(100, 6);
    close(p(0, 0, 1), { f: 0.75, z: 1 });
    expect(p(0, 0, -1).f).toBeCloseTo(1.5, 6);
  });
  test('quarter turn about y', () => {
    const q = makeProjector(Math.PI / 2, 0, { ox: 0, oy: 0, sx: 100, sy: 100 })(
      1,
      0,
      0,
    );
    expect(q.vx).toBeCloseTo(0, 6);
    expect(q.z).toBeCloseTo(-1, 6);
  });
});

describe('dots', () => {
  test('size', () => {
    expect(dotSize(1, 2)).toBeCloseTo(3.8, 6);
  });
  test('alpha', () => {
    expect(dotAlpha(0, false)).toBeCloseTo(0.6, 6);
    expect(dotAlpha(5, false)).toBeCloseTo(0.12, 6);
    expect(dotAlpha(-2, false)).toBeCloseTo(1, 6);
    expect(dotAlpha(0, true)).toBeCloseTo(0.36, 6);
  });
});

test('easeRate is frame-rate independent', () => {
  expect(easeRate(0.05, 1 / 60)).toBeCloseTo(0.05, 6);
  expect(easeRate(0.05, 1 / 30)).toBeCloseTo(0.0975, 6);
});

test('mulberry32 is deterministic and in [0,1)', () => {
  const a = mulberry32(1);
  const b = mulberry32(1);
  for (let i = 0; i < 5; i++) {
    const v = a();
    expect(v).toBe(b());
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  }
});
