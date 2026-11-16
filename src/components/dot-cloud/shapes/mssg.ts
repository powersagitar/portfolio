import type { ShapeDef } from '../types';
import { make } from './make';

/** Main:297-301. Four stacked slabs. */
export const mssg: ShapeDef = {
  id: 'mssg',
  build: (n, r) => ({
    points: make(n, (i) => {
      const k = (i % 4) - 1.5;
      return [
        (r() * 2 - 1) * 0.6 + k * 0.14,
        (r() * 2 - 1) * 0.8 - k * 0.14,
        k * 0.34,
      ];
    }),
  }),
  view: { kind: 'spin', rate: 0.2 },
  tilt: -0.2,
};
