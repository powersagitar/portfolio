import { describe, expect, test } from 'bun:test';

import { SHAPES } from '../registry';
import { mulberry32 } from '../rng';
import type { CloudKey } from '../types';
import { about } from './about';
import { badge } from './badge';
import { contact, orbit } from './contact';
import { home } from './home';
import { howto } from './howto';
import { mssg } from './mssg';

const N = 1200;
const build = (s: typeof home, seed = 7) => s.build(N, mulberry32(seed));
const pts = (s: typeof home) => build(s).points;

describe('every shape', () => {
  for (const s of [home, about, badge, howto, mssg, contact]) {
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
  expect(net!.nodes.length).toBe(21);
  expect(net!.edges.length).toBe(98);
  expect(net!.depth).toBe(3);
  for (let i = 0; i < 21 * 22; i++) {
    const c = net!.nodes[Math.floor(i / 22)];
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
  expect([home, about, badge, howto, mssg, contact].map((s) => s.tilt)).toEqual(
    [-0.2, -0.08, -0.2, -0.2, -0.2, -0.38],
  );
});

test('registry has all 7 keys', () => {
  const keys: CloudKey[] = [
    'home',
    'about',
    'badge',
    'howto',
    'mssg',
    'writing',
    'contact',
  ];
  expect(Object.keys(SHAPES).sort()).toEqual([...keys].sort());
});
