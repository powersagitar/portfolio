import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

const opacities = [0.35, 0.5, 0.65, 0.5, 1, 0.8, 0.65, 0.8, 0.45];

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#000',
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 6,
      }}
    >
      {opacities.map((o, i) => (
        <div
          key={i}
          style={{ width: 4, height: 4, background: '#f5f5f7', opacity: o }}
        />
      ))}
    </div>,
    size,
  );
}
