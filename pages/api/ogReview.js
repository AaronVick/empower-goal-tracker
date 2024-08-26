import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('OG Review Image Generator accessed');

  try {
    const { searchParams } = new URL(req.url);
    const goal = searchParams.get('goal');
    const deadline = searchParams.get('deadline');
    const progress = searchParams.get('progress');
    const error = searchParams.get('error');

    console.log('Received parameters:', { goal, deadline, progress, error });

    let message;
    if (error === 'no_goal') {
      message = 'No goal found. Start by setting a goal!';
      console.log('No goal error detected');
    } else if (goal) {
      message = `Goal: ${goal}\nDeadline: ${deadline}\nProgress: ${progress}%`;
      console.log('Goal data received');
    } else {
      message = 'An error occurred';
      console.log('Unknown error occurred');
    }

    console.log('Generated message:', message);

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
          <h1 style={{ marginBottom: '20px' }}>{error ? 'Error' : 'Your Goal'}</h1>
          <p style={{ fontSize: '40px', whiteSpace: 'pre-wrap' }}>{message}</p>
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