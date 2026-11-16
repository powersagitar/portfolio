import { clamp } from '../math';
import type { Overlay, Projected, ShapeBuild } from '../types';

/** Main:430-446. Edges plus forward-pass pulses of the 4-7-7-3 network. */
export function networkOverlay(b: ShapeBuild): Overlay {
  const { nodes, edges, depth } = b.net!;
  const segments = new Float32Array(edges.length * 4);
  const dots = {
    xy: new Float32Array(edges.length * 2),
    size: new Float32Array(edges.length),
    alpha: new Float32Array(edges.length),
    count: 0,
  };
  const lines = [{ segments, count: 0, alpha: 0, width: 0 }];
  const frame = { lines, dots };
  const pr: Projected[] = new Array(nodes.length);

  return {
    frame: ({ project, t, alpha, reduce, dpr }) => {
      for (let i = 0; i < nodes.length; i++) {
        pr[i] = project(nodes[i][0], nodes[i][1], nodes[i][2]);
      }
      for (let n = 0; n < edges.length; n++) {
        const A = pr[edges[n][0]];
        const B = pr[edges[n][1]];
        segments[n * 4] = A.x;
        segments[n * 4 + 1] = A.y;
        segments[n * 4 + 2] = B.x;
        segments[n * 4 + 3] = B.y;
      }
      lines[0].count = edges.length;
      lines[0].alpha = 0.14 * alpha;
      lines[0].width = 0.6 * dpr;

      let c = 0;
      if (!reduce) {
        // forward pass: a signal sweeps layer by layer; each cycle lights a different subset of edges
        const period = depth + 1.5;
        const g = (t * 0.7) % period;
        const cyc = Math.floor((t * 0.7) / period);
        for (let n = 0; n < edges.length; n++) {
          const e = edges[n];
          const s = g - e[2];
          if (s < 0 || s > 1) continue;
          const hsh =
            Math.abs(Math.sin(n * 12.9898 + cyc * 78.233) * 43758.5453) % 1;
          if (hsh < 0.45) continue;
          const A = pr[e[0]];
          const B = pr[e[1]];
          dots.xy[c * 2] = A.x + (B.x - A.x) * s;
          dots.xy[c * 2 + 1] = A.y + (B.y - A.y) * s;
          dots.size[c] = 2.6 * dpr;
          dots.alpha[c] = clamp(alpha * Math.sin(Math.PI * s), 0, 1);
          c++;
        }
      }
      dots.count = c;
      return frame;
    },
  };
}
