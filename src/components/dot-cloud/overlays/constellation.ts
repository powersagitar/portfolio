import { TAU, clamp } from '../math';
import { ORBIT, orbit } from '../shapes/contact';
import type { Overlay, Projected } from '../types';

/** Behind the globe's disc: far side and inside the Earth's silhouette. */
export function occluded(p: Projected, re: number): boolean {
  return p.z > 0 && Math.hypot(p.vx, p.vy) < re;
}

const HOPS = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [2, 3],
  [2, 4],
];

/** Main:447-461. Laser mesh, satellites and one routed message. */
export function constellationOverlay(): Overlay {
  const { PL, KS, RE } = ORBIT;
  const NS = PL * KS;
  const NP = HOPS.length + 2;
  const raw = new Float32Array(NS * 3);
  const sats: Projected[] = new Array(NS);
  const hidden = new Uint8Array(NS);
  const path: Projected[] = new Array(NP);
  const pathHidden = new Uint8Array(NP);

  const links = {
    segments: new Float32Array(NS * 2 * 4),
    count: 0,
    alpha: 0,
    width: 0,
  };
  const route = {
    segments: new Float32Array((NP - 1) * 4),
    count: 0,
    alpha: 0,
    width: 0,
  };
  const dots = {
    xy: new Float32Array((NS + 1) * 2),
    size: new Float32Array(NS + 1),
    alpha: new Float32Array(NS + 1),
    count: 0,
  };
  const frame = { lines: [links, route], dots };

  const addSeg = (
    out: { segments: Float32Array; count: number },
    a: Projected,
    b: Projected,
  ) => {
    const i = out.count * 4;
    out.segments[i] = a.x;
    out.segments[i + 1] = a.y;
    out.segments[i + 2] = b.x;
    out.segments[i + 3] = b.y;
    out.count++;
  };

  return {
    frame: ({ project, t, alpha, reduce, dpr }) => {
      const mv = reduce ? 0 : t * 0.12;
      for (let p = 0; p < PL; p++) {
        for (let k = 0; k < KS; k++) {
          const i = p * KS + k;
          const q = orbit(p, mv + (k * TAU) / KS + (p * Math.PI) / KS);
          raw[i * 3] = q[0];
          raw[i * 3 + 1] = q[1];
          raw[i * 3 + 2] = q[2];
          sats[i] = project(q[0], q[1], q[2]);
          hidden[i] = occluded(sats[i], RE) ? 1 : 0;
        }
      }

      // laser links: along each plane and across to the neighbouring plane
      links.count = 0;
      for (let p = 0; p < PL; p++) {
        for (let k = 0; k < KS; k++) {
          const a = p * KS + k;
          const b = p * KS + ((k + 1) % KS);
          if (!hidden[a] && !hidden[b]) addSeg(links, sats[a], sats[b]);
          if (p < PL - 1) {
            const c = (p + 1) * KS + k;
            if (!hidden[a] && !hidden[c]) addSeg(links, sats[a], sats[c]);
          }
        }
      }
      links.alpha = 0.16 * alpha;
      links.width = 0.6 * dpr;

      let c = 0;
      for (let i = 0; i < NS; i++) {
        if (hidden[i]) continue;
        const s = sats[i];
        dots.xy[c * 2] = s.x;
        dots.xy[c * 2 + 1] = s.y;
        dots.size[c] = 2.4 * s.f * dpr;
        dots.alpha[c] = alpha * clamp((1.2 - s.z) / 2, 0.3, 1);
        c++;
      }

      // one routed message: ground station -> hops through the mesh -> ground station
      const first = HOPS[0][0] * KS + HOPS[0][1];
      const last = HOPS[HOPS.length - 1][0] * KS + HOPS[HOPS.length - 1][1];
      const ground = (i: number): Projected => {
        const x = raw[i * 3];
        const y = raw[i * 3 + 1];
        const z = raw[i * 3 + 2];
        const m = Math.hypot(x, y, z) || 1;
        return project((x / m) * RE, (y / m) * RE, (z / m) * RE);
      };
      path[0] = ground(first);
      pathHidden[0] = occluded(path[0], RE * 0.98) ? 1 : 0;
      for (let h = 0; h < HOPS.length; h++) {
        const i = HOPS[h][0] * KS + HOPS[h][1];
        path[h + 1] = sats[i];
        pathHidden[h + 1] = hidden[i];
      }
      path[NP - 1] = ground(last);
      pathHidden[NP - 1] = occluded(path[NP - 1], RE * 0.98) ? 1 : 0;

      route.count = 0;
      for (let n = 0; n < NP - 1; n++) {
        if (!pathHidden[n] && !pathHidden[n + 1])
          addSeg(route, path[n], path[n + 1]);
      }
      route.alpha = 0.7 * alpha;
      route.width = 1.1 * dpr;

      if (!reduce) {
        const segs = NP - 1;
        const g = ((t * 0.45) % 1) * segs;
        const n = Math.floor(g);
        const s = g - n;
        if (!pathHidden[n] && !pathHidden[n + 1]) {
          const A = path[n];
          const B = path[n + 1];
          dots.xy[c * 2] = A.x + (B.x - A.x) * s;
          dots.xy[c * 2 + 1] = A.y + (B.y - A.y) * s;
          dots.size[c] = 4 * dpr;
          dots.alpha[c] = alpha;
          c++;
        }
      }
      dots.count = c;
      return frame;
    },
  };
}
