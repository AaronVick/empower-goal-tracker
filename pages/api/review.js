import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const goal = searchParams.get('goal');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
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
        <h1 style={{ fontSize: '48px', marginBottom: '30px', color: '#FFD700' }}>Goal Review</h1>
        <div style={{ fontSize: '32px', marginBottom: '20px', maxWidth: '80%', wordWrap: 'break-word' }}>
          <strong>Goal:</strong> {goal}
        </div>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>
          <strong>Start:</strong> {startDate}
        </div>
        <div style={{ fontSize: '24px' }}>
          <strong>End:</strong> {endDate}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}