import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 32,
          color: 'white',
          background: 'linear-gradient(to bottom right, #1E2E3D, #2D3E4D)',
          width: '100%',
          height: '100%',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '48px', marginBottom: '30px', color: '#4CAF50' }}>Goal Set Successfully!</h1>
        <p style={{ fontSize: '36px', maxWidth: '80%', wordWrap: 'break-word' }}>
          Your goal has been recorded and tracked.
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}