import type { Layout, Projector } from './types';

export const TAU = Math.PI * 2;

/** Frame-rate independent exponential ease: 1 - (1-k)^(dt*60). */
export function easeRate(k: number, dt: number): number {
  return 1 - Math.pow(1 - k, dt * 60);
}

export function isPhone(cssWidth: number): boolean {
  return cssWidth <= 700;
}

/** Main:412-415. W, H in device pixels; homeBlend 0 = shape layout, 1 = full-viewport dust. */
export function homeLayout(
  W: number,
  H: number,
  phone: boolean,
  homeBlend: number,
): Layout {
  const S = (phone ? Math.min(W, H * 0.72) : Math.min(W * 0.58, H)) * 0.34;
  const sox = phone ? W * 0.5 : W * 0.71;
  const soy = phone ? H * 0.36 : H * 0.5;
  const h = homeBlend;
  return {
    sx: S + ((W * 0.5) / 1.3 - S) * h,
    sy: S + ((H * 0.5) / 0.92 - S) * h,
    ox: sox + (W * 0.5 - sox) * h,
    oy: soy + (H * 0.5 - soy) * h,
  };
}

/** Post:169. */
export function postLayout(W: number, H: number): Layout {
  const S = Math.min(W, H) * 0.36;
  return { ox: W * 0.5, oy: H * 0.5, sx: S, sy: S };
}

/** Main:417. +y is down. */
export function makeProjector(ry: number, rx: number, l: Layout): Projector {
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  return (x, y, z) => {
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;
    const y1 = y * cx - z1 * sx;
    const z2 = y * sx + z1 * cx;
    const f = 3 / (3 + z2);
    return {
      x: l.ox + x1 * f * l.sx,
      y: l.oy + y1 * f * l.sy,
      f,
      z: z2,
      vx: x1,
      vy: y1,
    };
  };
}

export function dotSize(f: number, dpr: number): number {
  return (0.9 + f) * dpr;
}

export function dotAlpha(z: number, onHome: boolean): number {
  return Math.max(0.12, Math.min(1, (1.2 - z) / 2)) * (onHome ? 0.6 : 1);
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** Main:372. */
export function easeInOutQuad(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}
