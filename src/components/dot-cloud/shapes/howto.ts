import type { ShapeDef } from '../types';
import { make } from './make';

const seg = (
  a: [number, number],
  b: [number, number],
  s: number,
): [number, number] => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];

/** Main:292-296. A prompt glyph: chevron plus underscore. */
export const howto: ShapeDef = {
  id: 'howto',
  build: (n, r) => ({
    points: make(n, (i) => {
      const k = i % 3;
      const s = r();
      const p =
        k === 0
          ? seg([-0.75, -0.5], [-0.1, 0], s)
          : k === 1
            ? seg([-0.1, 0], [-0.75, 0.5], s)
            : seg([0.12, 0.5], [0.8, 0.5], s);
      return [
        p[0] + (r() - 0.5) * 0.08,
        p[1] + (r() - 0.5) * 0.08,
        (r() * 2 - 1) * 0.16,
      ];
    }),
  }),
  view: { kind: 'spin', rate: 0.2 },
  tilt: -0.2,
};
