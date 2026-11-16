import { TAU } from '../math';
import { type NetBuild, networkOverlay } from '../overlays/network';
import type { ShapeDef } from '../types';
import { make } from './make';

const NP = 22;

/** Main:268-285. A small feed-forward neural network (4-7-7-3). */
export const about: ShapeDef<NetBuild> = {
  id: 'about',
  build: (n, r) => {
    const layers = [4, 7, 7, 3];
    const nodes: [number, number, number][] = [];
    const starts: number[] = [];
    const edges: [number, number, number][] = [];
    layers.forEach((count, L) => {
      starts.push(nodes.length);
      const span = Math.min(0.85, count * 0.13);
      for (let k = 0; k < count; k++) {
        nodes.push([
          -1.1 + L * (2.2 / (layers.length - 1)),
          count === 1 ? 0 : ((k / (count - 1)) * 2 - 1) * span,
          (r() * 2 - 1) * 0.12,
        ]);
      }
    });
    for (let L = 0; L < layers.length - 1; L++)
      for (let a = 0; a < layers[L]; a++)
        for (let b = 0; b < layers[L + 1]; b++)
          edges.push([starts[L] + a, starts[L + 1] + b, L]);
    const points = make(n, (i) => {
      if (i < nodes.length * NP) {
        const c = nodes[Math.floor(i / NP)];
        const u = r() * 2 - 1;
        const th = r() * TAU;
        const q = Math.sqrt(1 - u * u);
        const rad = 0.055 * Math.cbrt(r());
        return [
          c[0] + q * Math.cos(th) * rad,
          c[1] + u * rad,
          c[2] + q * Math.sin(th) * rad,
        ];
      }
      const e = edges[(i - nodes.length * NP) % edges.length];
      const s = r();
      const A = nodes[e[0]];
      const B = nodes[e[1]];
      return [
        A[0] + (B[0] - A[0]) * s,
        A[1] + (B[1] - A[1]) * s,
        A[2] + (B[2] - A[2]) * s,
      ];
    });
    return { points, net: { nodes, edges, depth: layers.length - 1 } };
  },
  view: { kind: 'settle' },
  tilt: -0.08,
  overlay: networkOverlay,
};
