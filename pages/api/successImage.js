import { ImageResponse } from '@vercel/og';

export default function handler(req, res) {
  const imageResponse = new ImageResponse(
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
        <h1 style={{ marginBottom: '20px' }}>Goal Set Successfully!</h1>
        <p style={{ fontSize: '40px' }}>Your goal has been saved.</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  return imageResponse;
}

export const config = {
  runtime: 'edge',
};