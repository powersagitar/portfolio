import type { ShapeDef } from '../types';
import { make } from './make';

/** Thumbnail half-width, half-height, and centre-to-centre spacing. */
export const SPACES = { W: 0.26, H: 0.18, STEP: 0.64, Z: 0.03 } as const;

/** A point at fraction `s` of the length of a w x h rectangle's outline. */
const outline = (s: number, w: number, h: number): [number, number] => {
  const per = 4 * (w + h);
  let d = s * per;
  if (d < 2 * w) return [-w + d, -h];
  d -= 2 * w;
  if (d < 2 * h) return [w, -h + d];
  d -= 2 * h;
  if (d < 2 * w) return [w - d, h];
  d -= 2 * w;
  return [-w, h - d];
};

/**
 * Not in the design source. A Mission Control strip: three Space thumbnails
 * side by side, the current (middle) one filled, the other two outlined.
 * `i % 4`: 0 and 1 fill the middle, 2 outlines the left, 3 the right.
 */
export const spaces: ShapeDef = {
  id: 'spaces',
  build: (n, r) => ({
    points: make(n, (i) => {
      const { W, H, STEP, Z } = SPACES;
      const k = i % 4;
      const z = (r() * 2 - 1) * Z;
      if (k < 2) return [(r() * 2 - 1) * W, (r() * 2 - 1) * H, z];
      const [x, y] = outline(r(), W, H);
      return [x + (k === 2 ? -STEP : STEP), y, z];
    }),
  }),
  view: { kind: 'spin', rate: 0.2 },
  tilt: -0.2,
};
