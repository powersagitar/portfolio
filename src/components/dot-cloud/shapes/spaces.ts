import type { ShapeDef } from '../types';
import { make } from './make';

type Rect = { x: number; y: number; w: number; h: number };

/**
 * The app icon's geometry in its own 1024px canvas
 * (`SpaceIndicator/App/SpaceIndicator.icon/Assets/*.svg`), +y down as here.
 */
export const ICON = {
  /** Corner radius of every Space. */
  R: 72,
  /** Back, middle, front Space, stepping down and to the left. */
  SPACES: [
    { x: 296, y: 214, w: 540, h: 404 },
    { x: 240, y: 276, w: 540, h: 404 },
    { x: 184, y: 338, w: 540, h: 404 },
  ] as readonly Rect[],
  /** Height of the menu bar across the top of the front Space. */
  BAR: 56,
  /** The numeral 3 as two elliptical bowls: centre, radii, angle span. */
  BOWLS: [
    { cx: 455, cy: 504, rx: 80, ry: 56, a0: 160, a1: 455 },
    { cx: 456, cy: 622, rx: 86, ry: 64, a0: 262, a1: 552 },
  ],
  /** Centre of the stack, mapped to the origin. */
  CX: 510,
  CY: 478,
} as const;

/** Icon px to unit space: the stack spans x ±0.8, y ±0.65. */
export const S = 1.6 / 652;
/** Depth of each Space (back, middle, front); the numeral sits on the front. */
export const LAYER_Z = [0.22, 0, -0.22] as const;
/** Half depth of each layer, and half width of the numeral's stroke (px). */
export const DZ = 0.02;
export const STROKE = 16;

/** A point at fraction `s` of the length of a rounded rectangle's outline. */
export function roundedOutline(s: number, b: Rect, rad: number) {
  const sw = b.w - 2 * rad;
  const sh = b.h - 2 * rad;
  const arc = (Math.PI / 2) * rad;
  // Clockwise from the top-left corner's end: edge, corner, edge, corner...
  const segs = [sw, arc, sh, arc, sw, arc, sh, arc];
  let d = s * segs.reduce((a, v) => a + v, 0);
  let k = 0;
  while (k < 7 && d > segs[k]) d -= segs[k++];
  const [l, t, r, btm] = [
    b.x + rad,
    b.y + rad,
    b.x + b.w - rad,
    b.y + b.h - rad,
  ];
  const corner = (cx: number, cy: number, from: number): [number, number] => {
    const a = from + d / rad;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };
  switch (k) {
    case 0:
      return [l + d, b.y];
    case 1:
      return corner(r, t, -Math.PI / 2);
    case 2:
      return [b.x + b.w, t + d];
    case 3:
      return corner(r, btm, 0);
    case 4:
      return [r - d, b.y + b.h];
    case 5:
      return corner(l, btm, Math.PI / 2);
    case 6:
      return [b.x, btm - d];
    default:
      return corner(l, t, Math.PI);
  }
}

/** The numeral's centreline as a polyline, with cumulative lengths. */
function numeralPath() {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const { cx, cy, rx, ry, a0, a1 } of ICON.BOWLS) {
    for (let j = 0; j <= 96; j++) {
      const a = ((a0 + ((a1 - a0) * j) / 96) * Math.PI) / 180;
      xs.push(cx + Math.cos(a) * rx);
      ys.push(cy + Math.sin(a) * ry);
    }
  }
  const L = [0];
  for (let j = 1; j < xs.length; j++)
    L.push(L[j - 1] + Math.hypot(xs[j] - xs[j - 1], ys[j] - ys[j - 1]));
  return { xs, ys, L };
}

/** A point at fraction `u` of the numeral's length (arc-length uniform). */
function numeralAt(p: ReturnType<typeof numeralPath>, u: number) {
  const { xs, ys, L } = p;
  const d = u * L[L.length - 1];
  let j = 1;
  while (j < L.length - 1 && L[j] < d) j++;
  const t = (d - L[j - 1]) / (L[j] - L[j - 1] || 1);
  return [
    xs[j - 1] + (xs[j] - xs[j - 1]) * t,
    ys[j - 1] + (ys[j] - ys[j - 1]) * t,
  ];
}

/** Inside a rounded rectangle (corner radius `rad`)? */
export function inRounded(x: number, y: number, b: Rect, rad: number) {
  const qx = Math.max(Math.abs(x - (b.x + b.w / 2)) - (b.w / 2 - rad), 0);
  const qy = Math.max(Math.abs(y - (b.y + b.h / 2)) - (b.h / 2 - rad), 0);
  return Math.hypot(qx, qy) <= rad;
}

const toUnit = (x: number, y: number, z: number): [number, number, number] => [
  (x - ICON.CX) * S,
  (y - ICON.CY) * S,
  z,
];

/**
 * Not in the design source: the Space Indicator app icon. Three stacked Spaces
 * (outlines, back to front at depths `LAYER_Z`), the front one with its menu
 * bar filled and a stroked numeral 3. Point counts follow the icon's opacities:
 * the back Space is sparsest. `i % 20`: <3 back, <7 middle, <12 front, <14 bar,
 * else numeral.
 */
export const spaces: ShapeDef = {
  id: 'spaces',
  build: (n, r) => {
    const path = numeralPath();
    const front = ICON.SPACES[2];
    return {
      points: make(n, (i) => {
        const k = i % 20;
        const jz = (r() * 2 - 1) * DZ;
        if (k < 12) {
          const layer = k < 3 ? 0 : k < 7 ? 1 : 2;
          const [x, y] = roundedOutline(r(), ICON.SPACES[layer], ICON.R);
          return toUnit(x, y, LAYER_Z[layer] + jz);
        }
        if (k < 14) {
          // Uniform over the bar, clipped to the front Space's top corners.
          let x: number, y: number;
          do {
            x = front.x + r() * front.w;
            y = front.y + r() * ICON.BAR;
          } while (!inRounded(x, y, front, ICON.R));
          return toUnit(x, y, LAYER_Z[2] + jz);
        }
        const [x, y] = numeralAt(path, r());
        const a = r() * Math.PI * 2;
        const q = STROKE * Math.sqrt(r());
        return toUnit(
          x + Math.cos(a) * q,
          y + Math.sin(a) * q,
          LAYER_Z[2] - DZ + jz,
        );
      }),
    };
  },
  view: { kind: 'spin', rate: 0.2 },
  tilt: -0.2,
};
