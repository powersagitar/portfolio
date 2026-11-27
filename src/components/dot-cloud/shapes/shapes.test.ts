import { describe, expect, test } from 'bun:test';

import { SECTIONS } from '@/lib/sections';

import { SHAPES } from '../registry';
import { mulberry32 } from '../rng';
import type { CloudKey, ShapeBuild, ShapeDef } from '../types';
import { about } from './about';
import { badge } from './badge';
import { contact, orbit } from './contact';
import { home } from './home';
import { howto } from './howto';
import { mssg } from './mssg';
import {
  DZ,
  ICON,
  LAYER_Z,
  S,
  inRounded,
  roundedOutline,
  spaces,
} from './spaces';

const N = 1200;
const build = <B extends ShapeBuild>(s: ShapeDef<B>, seed = 7): B =>
  s.build(N, mulberry32(seed));
const pts = (s: ShapeDef) => build(s).points;

describe('every shape', () => {
  for (const s of [home, about, badge, howto, mssg, spaces, contact]) {
    test(`${s.id}: size, finite, determinism`, () => {
      const a = pts(s);
      expect(a.length).toBe(3600);
      expect(a.every(Number.isFinite)).toBe(true);
      expect(Array.from(pts(s))).toEqual(Array.from(a));
      expect(Array.from(build(s, 8).points)).not.toEqual(Array.from(a));
    });
  }
});

test('home bounds', () => {
  const p = pts(home);
  for (let i = 0; i < N; i++) {
    expect(Math.abs(p[i * 3])).toBeLessThanOrEqual(1.5);
    expect(Math.abs(p[i * 3 + 1])).toBeLessThanOrEqual(1.05);
    expect(Math.abs(p[i * 3 + 2])).toBeLessThanOrEqual(1);
  }
});

test('about network', () => {
  const { points: p, net } = build(about);
  expect(net.nodes.length).toBe(21);
  expect(net.edges.length).toBe(98);
  expect(net.depth).toBe(3);
  for (let i = 0; i < 21 * 22; i++) {
    const c = net.nodes[Math.floor(i / 22)];
    const d = Math.hypot(
      p[i * 3] - c[0],
      p[i * 3 + 1] - c[1],
      p[i * 3 + 2] - c[2],
    );
    expect(d).toBeLessThanOrEqual(0.055 + 1e-6);
  }
});

test('badge board and lanyard', () => {
  const p = pts(badge);
  const split = 984;
  for (let i = 0; i < N; i++) {
    const [x, y, z] = [p[i * 3], p[i * 3 + 1], p[i * 3 + 2]];
    if (i < split) {
      expect(Math.abs(x)).toBeLessThanOrEqual(0.5);
      expect(y).toBeGreaterThanOrEqual(-0.48);
      expect(y).toBeLessThanOrEqual(1.08);
      expect(Math.abs(z)).toBeLessThanOrEqual(0.025);
    } else {
      expect(z).toBe(0);
      expect(y).toBeGreaterThanOrEqual(-1.3);
      expect(y).toBeLessThanOrEqual(-0.48);
    }
  }
});

test('howto depth', () => {
  const p = pts(howto);
  for (let i = 0; i < N; i++)
    expect(Math.abs(p[i * 3 + 2])).toBeLessThanOrEqual(0.16);
});

test('mssg slabs', () => {
  const p = pts(mssg);
  for (let i = 0; i < N; i++) {
    const z = p[i * 3 + 2];
    expect([-0.51, -0.17, 0.17, 0.51].some((v) => Math.abs(z - v) < 1e-6)).toBe(
      true,
    );
  }
});

test('spaces app icon', () => {
  const p = pts(spaces);
  const e = 1e-4;
  const px = (i: number) => [
    p[i * 3] / S + ICON.CX,
    p[i * 3 + 1] / S + ICON.CY,
    p[i * 3 + 2],
  ];
  // Signed distance (px) to a rounded rectangle's outline.
  const sdf = (x: number, y: number, b: (typeof ICON.SPACES)[number]) => {
    const qx = Math.abs(x - (b.x + b.w / 2)) - (b.w / 2 - ICON.R);
    const qy = Math.abs(y - (b.y + b.h / 2)) - (b.h / 2 - ICON.R);
    return (
      Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
      Math.min(Math.max(qx, qy), 0) -
      ICON.R
    );
  };
  const front = ICON.SPACES[2];
  for (let i = 0; i < N; i++) {
    const [x, y, z] = px(i);
    expect(Math.abs(p[i * 3])).toBeLessThanOrEqual(0.82);
    expect(Math.abs(p[i * 3 + 1])).toBeLessThanOrEqual(0.67);
    const k = i % 20;
    if (k < 12) {
      const layer = k < 3 ? 0 : k < 7 ? 1 : 2;
      expect(Math.abs(z - LAYER_Z[layer])).toBeLessThanOrEqual(DZ + e);
      expect(Math.abs(sdf(x, y, ICON.SPACES[layer]))).toBeLessThan(0.05);
    } else if (k < 14) {
      expect(Math.abs(z - LAYER_Z[2])).toBeLessThanOrEqual(DZ + e);
      expect(inRounded(x, y, front, ICON.R + 0.05)).toBe(true);
      expect(y - front.y).toBeLessThanOrEqual(ICON.BAR + 0.05);
    } else {
      expect(z).toBeLessThanOrEqual(LAYER_Z[2] + e);
      // The numeral stays inside the front Space, below its menu bar.
      expect(sdf(x, y, front)).toBeLessThan(-20);
      expect(y).toBeGreaterThan(front.y + ICON.BAR);
    }
  }
});

test('roundedOutline starts, turns and closes on the outline', () => {
  const b = ICON.SPACES[0];
  const at = (s: number) => roundedOutline(s, b, ICON.R);
  expect(at(0)[0]).toBeCloseTo(b.x + ICON.R, 6);
  expect(at(0)[1]).toBeCloseTo(b.y, 6);
  expect(at(1)[0]).toBeCloseTo(b.x + ICON.R, 6);
  expect(at(1)[1]).toBeCloseTo(b.y, 6);
});

test('contact earth and orbits', () => {
  const p = pts(contact);
  const ME = Math.floor(N * 0.62);
  expect(ME).toBe(744);
  for (let i = 0; i < N; i++) {
    const r = Math.hypot(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
    expect(Math.abs(r - (i < ME ? 0.55 : 0.9))).toBeLessThan(1e-5);
  }
  const o = orbit(0, 0);
  expect(o[0]).toBeCloseTo(0.9, 10);
  expect(o[1]).toBeCloseTo(0, 10);
  expect(o[2]).toBeCloseTo(0, 10);
});

test('views and tilts', () => {
  expect(home.view).toEqual({ kind: 'spin', rate: 0.02 });
  expect(about.view).toEqual({ kind: 'settle' });
  expect(contact.view).toEqual({ kind: 'spin', rate: 0.06 });
  expect(badge.view).toEqual({ kind: 'spin', rate: 0.2 });
  expect(spaces.view).toEqual({ kind: 'spin', rate: 0.2 });
  expect(
    [home, about, badge, howto, mssg, spaces, contact].map((s) => s.tilt),
  ).toEqual([-0.2, -0.08, -0.2, -0.2, -0.2, -0.2, -0.38]);
});

test('registry has home plus every section', () => {
  const keys: CloudKey[] = ['home', ...SECTIONS.map((s) => s.id)];
  expect(Object.keys(SHAPES).sort()).toEqual([...keys].sort());
});
