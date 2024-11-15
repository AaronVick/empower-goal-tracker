import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('OG Review Image Generator accessed');

  try {
    const { searchParams } = new URL(req.url);
    const goal = searchParams.get('goal');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!goal || !startDate || !endDate) {
      return new Response('Missing required parameters', { status: 400 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 32,
            color: 'white',
            background: 'linear-gradient(to bottom, #1E2E3D, #2D3E4D)',
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
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Goal Review</h1>
          <p style={{ fontSize: '36px', marginBottom: '10px' }}>{decodeURIComponent(goal)}</p>
          <p style={{ fontSize: '24px', marginBottom: '10px' }}>Start Date: {decodeURIComponent(startDate)}</p>
          <p style={{ fontSize: '24px', marginBottom: '20px' }}>End Date: {decodeURIComponent(endDate)}</p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('Error generating review image:', e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
