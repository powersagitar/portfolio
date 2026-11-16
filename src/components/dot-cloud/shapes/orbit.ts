import { TAU } from '../math';

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
