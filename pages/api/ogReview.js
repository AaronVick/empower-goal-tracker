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
    const index = searchParams.get('index');
    const total = searchParams.get('total');

    console.log('Goal:', goal);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('Index:', index);
    console.log('Total:', total);

    if (!goal || !startDate || !endDate) {
      return new Response('Missing required parameters', { status: 400 });
    }

    const imageResponse = new ImageResponse(
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
          <h1 style={{ fontSize: '48px', marginBottom: '30px' }}>Your Goal Review</h1>
          <p style={{ fontSize: '24px', marginBottom: '20px' }}>Goal {index} of {total}</p>
          <p style={{ fontSize: '36px', marginBottom: '20px' }}>Goal: {decodeURIComponent(goal)}</p>
          <p style={{ fontSize: '24px', marginBottom: '10px' }}>Start Date: {decodeURIComponent(startDate)}</p>
          <p style={{ fontSize: '24px' }}>End Date: {decodeURIComponent(endDate)}</p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    console.log('Image generated successfully');
    return imageResponse;
  } catch (e) {
    console.error('Error generating image:', e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}