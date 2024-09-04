import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('OG Complete Image Generator accessed');

  try {
    const { searchParams } = new URL(req.url);
    const goal = searchParams.get('goal');

    console.log('Completed Goal:', goal);

    if (!goal) {
      return new Response('Missing required parameter', { status: 400 });
    }

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            fontSize: 32,
            color: 'white',
            background: 'linear-gradient(to bottom, #1E4E3D, #2D6E4D)',
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
          <h1 style={{ fontSize: '48px', marginBottom: '30px' }}>Goal Completed!</h1>
          <p style={{ fontSize: '36px', marginBottom: '20px' }}>You've achieved your goal:</p>
          <p style={{ fontSize: '40px', fontWeight: 'bold' }}>{decodeURIComponent(goal)}</p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

    console.log('Completion image generated successfully');
    return imageResponse;
  } catch (e) {
    console.error('Error generating completion image:', e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}