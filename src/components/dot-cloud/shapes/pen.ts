import { clamp } from '../math';

export type PenLut = {
  P: [number, number][];
  L: number[];
  T: number;
  lift: [number, number];
};

type Pt = [number, number];

/** Main:333-338. "hello" in cursive (letter units: baseline y=0, x-height 1, ascenders 2.5). */
const HELLO: Pt[] = [
  [0, 0.1],
  [0.4, 1.0],
  [0.75, 2.0],
  [0.7, 2.5],
  [0.5, 2.5],
  [0.45, 2.0],
  [0.5, 1.0],
  [0.55, 0],
  [0.6, 0.6],
  [0.85, 1.0],
  [1.05, 0.9],
  [1.1, 0.5],
  [1.15, 0.05],
  [1.35, 0.1],
  [1.6, 0.5],
  [1.85, 0.85],
  [1.75, 1.0],
  [1.5, 0.8],
  [1.5, 0.3],
  [1.7, 0.0],
  [1.95, 0.15],
  [2.2, 1.0],
  [2.45, 2.0],
  [2.4, 2.5],
  [2.2, 2.4],
  [2.15, 1.8],
  [2.2, 0.8],
  [2.3, 0.05],
  [2.5, 0.15],
  [2.75, 1.0],
  [3.0, 2.0],
  [2.95, 2.5],
  [2.75, 2.4],
  [2.7, 1.8],
  [2.75, 0.8],
  [2.85, 0.05],
  [3.05, 0.15],
  [3.3, 0.7],
  [3.5, 1.0],
  [3.7, 0.8],
  [3.65, 0.2],
  [3.45, 0.0],
  [3.25, 0.3],
  [3.35, 0.9],
  [3.6, 1.0],
  [3.85, 0.95],
  [4.05, 0.9],
];

/** Main:339-342. */
const WORLD: Pt[] = [
  [4.7, 0.9],
  [4.8, 0.4],
  [4.95, 0.0],
  [5.15, 0.4],
  [5.25, 1.0],
  [5.3, 0.4],
  [5.45, 0.0],
  [5.65, 0.4],
  [5.75, 1.0],
  [5.85, 0.95],
  [6.05, 0.9],
  [6.2, 1.0],
  [6.4, 0.8],
  [6.35, 0.2],
  [6.15, 0.0],
  [5.95, 0.3],
  [6.05, 0.9],
  [6.3, 1.0],
  [6.5, 0.95],
  [6.7, 0.9],
  [6.75, 1.1],
  [6.95, 0.95],
  [7.0, 0.8],
  [7.05, 0.4],
  [7.1, 0.0],
  [7.3, 0.15],
  [7.55, 1.0],
  [7.8, 2.0],
  [7.75, 2.5],
  [7.55, 2.4],
  [7.5, 1.8],
  [7.55, 0.8],
  [7.65, 0.05],
  [7.85, 0.15],
  [8.3, 0.9],
  [8.1, 1.0],
  [7.9, 0.6],
  [8.0, 0.05],
  [8.25, 0.3],
  [8.4, 1.2],
  [8.55, 2.5],
  [8.5, 1.5],
  [8.45, 0.4],
  [8.55, 0.0],
  [8.75, 0.15],
];

/** Main:343-352. Catmull-Rom through pts, `per` samples per segment. */
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

/** Main:331-358. Memoised. */
export function buildPen(): PenLut {
  if (lut) return lut;
  const a = catmullRom(HELLO, 12);
  const b = catmullRom(WORLD, 12);
  const P = a
    .concat(b)
    .map((q): Pt => [0.55 + (q[0] - 8.75) * 0.2, 0.53 - q[1] * 0.2]);
  const L = [0];
  for (let i = 1; i < P.length; i++)
    L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const T = L[L.length - 1];
  lut = { P, L, T, lift: [L[a.length - 1] / T, L[a.length] / T] };
  return lut;
}

/** Main:359-368. Position along the pen path, u in [0,1] by arc length (clamped). */
export function penAt(u: number): [number, number] {
  const { P, L, T } = buildPen();
  const d = clamp(u, 0, 1) * T;
  let lo = 0;
  let hi = L.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (L[mid] <= d) lo = mid;
    else hi = mid;
  }
  const s = L[hi] > L[lo] ? (d - L[lo]) / (L[hi] - L[lo]) : 0;
  return [
    P[lo][0] + (P[hi][0] - P[lo][0]) * s,
    P[lo][1] + (P[hi][1] - P[lo][1]) * s,
  ];
}
