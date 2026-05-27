import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            width: '60%',
            height: '60%',
            display: 'flex',
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '4px',
              height: '4px',
              background: '#10b981',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '8px',
              height: '4px',
              background: '#3b82f6',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
