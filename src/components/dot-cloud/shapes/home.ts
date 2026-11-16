import type { ShapeDef } from '../types';
import { make } from './make';

/** Main:265. No closed shape: free-floating dust (drift is added per frame). */
export const home: ShapeDef = {
  id: 'home',
  build: (n, r) => ({
    points: make(n, () => [
      (r() * 2 - 1) * 1.5,
      (r() * 2 - 1) * 1.05,
      (r() * 2 - 1) * 1.0,
    ]),
  }),
  view: { kind: 'spin', rate: 0.02 },
  tilt: -0.2,
};
