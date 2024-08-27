import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          color: 'white',
          background: 'linear-gradient(to bottom, #1E2E3D, #2D3E4D)',
          width: '100%',
          height: '100%',
          padding: '50px 200px',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1>Goal has been set!</h1>
        <p style={{ fontSize: '40px' }}>Your goal is now tracked.</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}