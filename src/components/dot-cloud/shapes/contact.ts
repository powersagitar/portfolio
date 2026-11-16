import { TAU } from '../math';
import { constellationOverlay } from '../overlays/constellation';
import type { ShapeDef } from '../types';
import { make } from './make';

/**
 * Main:315. Starlink-style shells around a dotted Earth. INC is stored in
 * radians, as the design does (53 * Math.PI / 180).
 */
export const ORBIT = {
  PL: 6,
  KS: 10,
  INC: (53 * Math.PI) / 180,
  RO: 0.9,
  RE: 0.55,
};

/** Main:316-319. */
export function orbit(plane: number, u: number): [number, number, number] {
  const { PL, INC, RO } = ORBIT;
  const x0 = RO * Math.cos(u);
  const z0 = RO * Math.sin(u);
  const y = -z0 * Math.sin(INC);
  const z = z0 * Math.cos(INC);
  const O = (plane * TAU) / PL;
  return [
    x0 * Math.cos(O) + z * Math.sin(O),
    y,
    -x0 * Math.sin(O) + z * Math.cos(O),
  ];
}

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
