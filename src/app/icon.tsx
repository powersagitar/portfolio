import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

type Dot = { x: number; y: number; d: number; o: number; z: number };

/**
 * A small dot sphere, echoing the home dot cloud: Fibonacci points on a unit
 * sphere, tilted, projected flat, sized and faded by depth and lit from the
 * upper left. Back dots are drawn first.
 */
function sphere(n: number, px: number): Dot[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const tilt = 0.45;
  const [lx, ly, lz] = [-0.5, -0.6, 0.62];
  const c = px / 2;
  const radius = px * 0.38;
  const dots: Dot[] = [];
  for (let i = 0; i < n; i++) {
    const y0 = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y0 * y0);
    const a = golden * i;
    const x = Math.cos(a) * r;
    const z0 = Math.sin(a) * r;
    const y = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
    const z = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
    const depth = (z + 1) / 2;
    const light = Math.max(0, x * lx + y * ly + z * lz);
    dots.push({
      x: c + x * radius,
      y: c + y * radius,
      d: px * (0.05 + 0.055 * depth),
      o: 0.18 + 0.82 * Math.min(1, depth * 0.55 + light * 0.6),
      z,
    });
  }
  return dots.sort((p, q) => p.z - q.z);
}

const dots = sphere(30, size.width);

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        position: 'relative',
      }}
    >
      {dots.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x - p.d / 2,
            top: p.y - p.d / 2,
            width: p.d,
            height: p.d,
            borderRadius: '50%',
            background: '#f5f5f7',
            opacity: p.o,
          }}
        />
      ))}
    </div>,
    size,
  );
}
