import { clamp, easeInOutQuad } from '../math';
import type { ShapeDef } from '../types';
import { make } from './make';
import { buildPen, penAt, penInto } from './pen';

const scratch = new Float64Array(2);

/**
 * Main:302-313. A quill (shaft, tapered vanes) with its nib at the end of a
 * curved ink line. i % 20: < 2 shaft, < 9 vanes, rest ink.
 */
export const writing: ShapeDef = {
  id: 'writing',
  build: (n, r) => {
    const inkU = new Float32Array(n).fill(-1);
    const nib = [0.55, 0.5];
    const top = [1.2, -0.7];
    const dx = top[0] - nib[0];
    const dy = top[1] - nib[1];
    const len = Math.hypot(dx, dy);
    const tx = dx / len;
    const ty = dy / len;
    const nx = -ty;
    const ny = tx;
    const at = (s: number): [number, number] => {
      const b = 0.1 * Math.sin(Math.PI * s);
      return [nib[0] + dx * s + nx * b, nib[1] + dy * s + ny * b];
    };
    const { lift } = buildPen();
    const points = make(n, (i) => {
      const m = i % 20;
      if (m < 2) {
        const p = at(r());
        return [p[0], p[1], 0];
      }
      if (m < 9) {
        const s = 0.2 + r() * 0.8;
        const w = 0.26 * Math.pow(Math.sin((Math.PI * (s - 0.2)) / 0.8), 0.8);
        const side = m % 2 ? 1 : -1;
        const v = r();
        const p = at(s);
        return [
          p[0] + nx * side * w * v + tx * 0.1 * v,
          p[1] + ny * side * w * v + ty * 0.1 * v,
          side * v * w * 0.35,
        ];
      }
      let u = r();
      while (u > lift[0] && u < lift[1]) u = r();
      inkU[i] = u;
      const pp = penAt(u);
      return [pp[0], pp[1], (r() - 0.5) * 0.02];
    });
    return { points, inkU };
  },
  view: { kind: 'settle' },
  tilt: -0.2,
  /** Main:369-382. Write once, then stay finished. */
  animate: (b, out, t, reduce) => {
    const base = b.points;
    const U = b.inkU as Float32Array;
    const p = reduce ? 1 : easeInOutQuad(clamp(t / 5.5, 0, 1));
    const pen = buildPen();
    penInto(pen, p, scratch, 0);
    const ox = scratch[0] - pen.end[0];
    const oy = scratch[1] - pen.end[1];
    for (let i = 0; i < U.length; i++) {
      const j = i * 3;
      if (U[i] < 0) {
        out[j] = base[j] + ox;
        out[j + 1] = base[j + 1] + oy;
        out[j + 2] = base[j + 2];
      } else {
        penInto(pen, Math.min(U[i], p), out, j);
        out[j + 2] = base[j + 2];
      }
    }
    return out;
  },
};
