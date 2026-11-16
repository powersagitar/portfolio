import type { ShapeDef } from '../types';
import { make } from './make';

/** Main:286-291. Portrait board; the lanyard clips to the top edge. */
export const badge: ShapeDef = {
  id: 'badge',
  build: (n, r) => ({
    points: make(n, (i) => {
      if (i < n * 0.82)
        return [
          (r() * 2 - 1) * 0.5,
          (r() * 2 - 1) * 0.78 + 0.3,
          (r() * 2 - 1) * 0.025,
        ];
      const s = r();
      const side = i % 2 ? 1 : -1;
      return [side * 0.32 * (1 - s), -0.48 - 0.82 * s, 0];
    }),
  }),
  view: { kind: 'spin', rate: 0.2 },
  tilt: -0.2,
};
