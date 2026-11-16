import { TAU } from '../math';
import { constellationOverlay } from '../overlays/constellation';
import type { ShapeDef } from '../types';
import { make } from './make';
import { ORBIT, orbit } from './orbit';

export { ORBIT, orbit };

/** Main:321-325. */
export const contact: ShapeDef = {
  id: 'contact',
  build: (n, r) => {
    const ME = Math.floor(n * 0.62);
    const { PL, RE } = ORBIT;
    return {
      points: make(n, (i) => {
        if (i < ME) {
          const y = 1 - (2 * (i + 0.5)) / ME;
          const q = Math.sqrt(1 - y * y);
          const th = i * 2.39996;
          return [Math.cos(th) * q * RE, y * RE, Math.sin(th) * q * RE];
        }
        return orbit((i - ME) % PL, r() * TAU);
      }),
    };
  },
  view: { kind: 'spin', rate: 0.06 },
  tilt: -0.38,
  overlay: constellationOverlay,
};
