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

    console.log('Goal:', goal);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    if (!goal || !startDate || !endDate) {
      return new Response('Missing required parameters', { status: 400 });
    }

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
          <h1>Your Goal Review</h1>
          <p style={{ fontSize: '40px' }}>Goal: {goal}</p>
          <p style={{ fontSize: '40px' }}>Start Date: {startDate}</p>
          <p style={{ fontSize: '40px' }}>End Date: {endDate}</p>
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
