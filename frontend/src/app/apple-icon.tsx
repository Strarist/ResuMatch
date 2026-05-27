import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            width: '50%',
            height: '50%',
            display: 'flex',
            border: '8px solid #3b82f6',
            borderRadius: '16px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              width: '16px',
              height: '16px',
              background: '#10b981',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              width: '32px',
              height: '16px',
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
