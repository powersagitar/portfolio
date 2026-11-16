import { clamp, easeInOutQuad } from '../math';
import type { Rng, ShapeBuild, ShapeDef } from '../types';
import { make } from './make';
import { NIB, buildPen, penAt, penInto } from './pen';

type P3 = [number, number, number];

/** The quill's top (feather tip); its nib is the pen's end, NIB. */
const TOP = [1.35, -0.7];
/** Seconds the signature takes to write. */
export const WRITE_SECONDS = 3;
/** Home: let the quill form at the start of the signature before writing. */
const HOME_DELAY = 0.35;
/** How far (in u) ahead of the nib ink starts sliding down into it. */
const FEED = 0.08;

const scratch = new Float64Array(2);

/**
 * Main:330-356. A fancy quill: S-curved shaft with a metal nib, discrete
 * curved barbs (wider vane on one side, two split gaps), soft down at the
 * base. m = i % 20: < 2 shaft, < 8 barbs, 8 down.
 */
function quillPt(m: number, r: Rng): P3 {
  const dx = TOP[0] - NIB[0];
  const dy = TOP[1] - NIB[1];
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const at = (s: number): [number, number] => {
    const b = 0.09 * Math.sin(Math.PI * s) + 0.035 * Math.sin(2 * Math.PI * s);
    return [NIB[0] + dx * s + nx * b, NIB[1] + dy * s + ny * b];
  };
  const dir = (s: number): [number, number] => {
    const a = at(Math.max(0, s - 0.01));
    const b = at(Math.min(1, s + 0.01));
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  if (m < 2) {
    // shaft: hollow barrel near the base, thinning toward the tip; a metal
    // nib with a slit at the very bottom
    const s = Math.pow(r(), 0.85);
    const p = at(s);
    const d = dir(s);
    const th = (s < 0.2 ? 0.012 : 0.006 * (1 - s)) * (r() * 2 - 1);
    if (s < 0.07) {
      const wv = 0.022 * (s / 0.07) * (r() * 2 - 1);
      return [p[0] - d[1] * wv, p[1] + d[0] * wv, 0];
    }
    return [p[0] - d[1] * th, p[1] + d[0] * th, 0];
  }
  if (m < 8) {
    // barbs: discrete curved lines sweeping toward the tip
    const side = m % 2 ? 1 : -1;
    const nb = 26;
    const bi = Math.floor(r() * nb);
    const s = 0.24 + (0.74 * (bi + 0.5)) / nb;
    const env =
      Math.pow(Math.sin(Math.PI * Math.min(1, (s - 0.24) / 0.74)), 0.65) *
      (s > 0.9 ? 1 - (s - 0.9) * 4 : 1);
    let W = (side > 0 ? 0.17 : 0.105) * env;
    if ((side > 0 && s > 0.48 && s < 0.53) || (side < 0 && s > 0.7 && s < 0.73))
      W *= 0.55;
    const v = Math.pow(r(), 0.7);
    const p = at(s);
    const d = dir(s);
    const sweep = 0.55 + 0.25 * v;
    const ox = -d[1] * side * Math.cos(sweep) + d[0] * Math.sin(sweep);
    const oy = d[0] * side * Math.cos(sweep) + d[1] * Math.sin(sweep);
    const curl = 0.04 * v * v * side;
    return [
      p[0] + ox * W * v - d[1] * curl,
      p[1] + oy * W * v + d[0] * curl,
      side * v * W * 0.3,
    ];
  }
  // down: soft wisps around the lower shaft
  const s = 0.13 + r() * 0.12;
  const p = at(s);
  const d = dir(s);
  const side = r() < 0.5 ? 1 : -1;
  const v = r();
  const a = 0.3 + r() * 0.9;
  const l = 0.05 + 0.09 * r();
  return [
    p[0] + (-d[1] * side * Math.cos(a) + d[0] * Math.sin(a) * 0.4) * l * v,
    p[1] + (d[0] * side * Math.cos(a) + d[1] * Math.sin(a) * 0.4) * l * v,
    (r() - 0.5) * 0.04,
  ];
}

/** Writing progress in [0, 1] at t seconds after writing starts. */
export function writeProgress(t: number, reduce: boolean): number {
  return reduce ? 1 : easeInOutQuad(clamp(t / WRITE_SECONDS, 0, 1));
}

/**
 * Main:386-407 and 444. The quill rides the pen so its nib sits at the pen
 * position. Written ink sits where the nib laid it; unwritten ink rides on
 * its anchor point of the quill and, just before the nib reaches it, slides
 * down into the nib. With `rate`, ink at and just ahead of the nib morphs
 * fast and written ink snaps. t is seconds since writing started (may be < 0).
 */
export function writeFrame(
  b: ShapeBuild,
  out: Float32Array,
  t: number,
  reduce: boolean,
  rate?: Float32Array,
): Float32Array {
  const base = b.points;
  const U = b.inkU as Float32Array;
  const A = b.inkAnchor as Int32Array;
  const p = writeProgress(t, reduce);
  const pen = buildPen();
  penInto(pen, p, scratch, 0);
  const tipX = scratch[0];
  const tipY = scratch[1];
  const ox = tipX - pen.end[0];
  const oy = tipY - pen.end[1];
  for (let i = 0; i < U.length; i++) {
    const j = i * 3;
    const u = U[i];
    if (u < 0) {
      out[j] = base[j] + ox;
      out[j + 1] = base[j + 1] + oy;
      out[j + 2] = base[j + 2];
    } else if (u <= p) {
      penInto(pen, u, out, j);
      out[j + 2] = base[j + 2];
      if (rate) rate[i] = reduce || u <= p - 0.03 ? 1 : 0.6;
    } else {
      const q = A[i] * 3;
      const f = Math.min(1, Math.max(0, 1 - (u - p) / FEED) * 1.6);
      const e = f * f * (3 - 2 * f);
      const qx = base[q] + ox;
      const qy = base[q + 1] + oy;
      out[j] = qx + (tipX - qx) * e;
      out[j + 1] = qy + (tipY - qy) * e;
      out[j + 2] = base[q + 2] * (1 - e);
      if (rate && u - p < FEED) rate[i] = 0.5;
    }
  }
  return out;
}

/**
 * Main:302-312. A quill with its nib at the end of an "MD" signature.
 * i % 20: < 9 quill (see quillPt), rest ink.
 */
export const writing: ShapeDef = {
  id: 'writing',
  build: (n, r) => {
    const inkU = new Float32Array(n).fill(-1);
    const points = make(n, (i) => {
      const m = i % 20;
      if (m < 9) return quillPt(m, r);
      const u = r();
      inkU[i] = u;
      const pp = penAt(u);
      return [pp[0], pp[1], (r() - 0.5) * 0.02];
    });
    // each ink dot waits on a random spot of the quill until the nib reaches it
    const quill: number[] = [];
    for (let i = 0; i < n; i++) if (inkU[i] < 0) quill.push(i);
    const inkAnchor = new Int32Array(n);
    for (let i = 0; i < n; i++)
      inkAnchor[i] = quill[Math.floor(r() * quill.length)];
    return { points, inkU, inkAnchor };
  },
  view: { kind: 'settle' },
  tilt: -0.2,
  /** Main:418-420. Write once, then stay finished. */
  animate: (b, out, t, reduce, rate) =>
    writeFrame(b, out, t - HOME_DELAY, reduce, rate),
};
