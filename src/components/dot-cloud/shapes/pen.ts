import { clamp } from '../math';

export type PenLut = {
  P: [number, number][];
  L: number[];
  T: number;
  /** penAt(1), computed once. */
  end: [number, number];
};

type Pt = [number, number];

/**
 * Main:358-361. "MD" signature, quick style, in one stroke: a fast slanted M,
 * the D stem, a wide bowl that swings back left and strikes through both
 * letters into the nib (letter units, +y up; slanted and scaled in buildPen).
 */
const SIG: Pt[] = [
  [0, 0.0],
  [0.2, 1.0],
  [0.4, 2.0],
  [0.48, 1.2],
  [0.55, 0.5],
  [0.75, 1.3],
  [0.95, 2.1],
  [1.03, 1.1],
  [1.1, 0.2],
  [1.35, 0.05],
  [1.6, 1.2],
  [1.75, 2.3],
  [1.7, 1.2],
  [1.65, 0.05],
  [2.6, 0.15],
  [3.4, 0.7],
  [3.6, 1.5],
  [3.3, 2.2],
  [2.5, 2.5],
  [1.4, 2.4],
  [0.4, 1.9],
  [-0.3, 1.2],
  [0.3, 0.95],
  [2.2, 1.05],
  [4.0, 1.15],
  [5.2, 1.25],
];

/** Slant (x += SH * y) and scale from letter units to unit space. */
const SH = 0.3;
const K = 0.36;
/** Where the stroke ends in unit space: the quill's nib. */
export const NIB: Pt = [0.7, 0.5];

/** Main:362-371. Catmull-Rom through pts, `per` samples per segment. */
function catmullRom(pts: Pt[], per: number): Pt[] {
  const out: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, n - 1)];
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b +
          (-a + c) * t +
          (2 * a - 5 * b + 4 * c - d) * t2 +
          (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[n - 1]);
  return out;
}

let lut: PenLut | null = null;

/** Main:357-377. Memoised. The stroke ends exactly at NIB. */
export function buildPen(): PenLut {
  if (lut) return lut;
  const last = SIG[SIG.length - 1];
  const ex = last[0] + SH * last[1];
  const ey = last[1];
  const P = catmullRom(SIG, 14).map((q): Pt => [
    NIB[0] + (q[0] + SH * q[1] - ex) * K,
    NIB[1] - (q[1] - ey) * K,
  ]);
  const L = [0];
  for (let i = 1; i < P.length; i++)
    L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const built: PenLut = { P, L, T: L[L.length - 1], end: [0, 0] };
  penInto(built, 1, built.end, 0);
  lut = built;
  return lut;
}

/** Main:378-385. Allocation-free: writes the pen position at u (clamped) to out[j], out[j+1]. */
export function penInto(
  { P, L, T }: Pick<PenLut, 'P' | 'L' | 'T'>,
  u: number,
  out: ArrayLike<number> & { [k: number]: number },
  j: number,
): void {
  const d = clamp(u, 0, 1) * T;
  let lo = 0;
  let hi = L.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (L[mid] <= d) lo = mid;
    else hi = mid;
  }
  const s = L[hi] > L[lo] ? (d - L[lo]) / (L[hi] - L[lo]) : 0;
  out[j] = P[lo][0] + (P[hi][0] - P[lo][0]) * s;
  out[j + 1] = P[lo][1] + (P[hi][1] - P[lo][1]) * s;
}

/** Position along the pen path, u in [0,1] by arc length (clamped). */
export function penAt(u: number): [number, number] {
  const r: [number, number] = [0, 0];
  penInto(buildPen(), u, r, 0);
  return r;
}
