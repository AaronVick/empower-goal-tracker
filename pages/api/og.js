import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('OG Image Generator accessed');
  
  try {
    const { searchParams } = new URL(req.url);
    const error = searchParams.get('error');

    console.log('Error parameter:', error);

    if (!error) {
      return new Response('Missing error parameter', { status: 400 });
    }

    let message;
    switch (error) {
      case 'no_goal':
        message = 'Please enter a goal';
        break;
      case 'invalid_start_date':
        message = 'Please enter a valid start date (dd/mm/yyyy)';
        break;
      case 'invalid_end_date':
        message = 'Please enter a valid end date (dd/mm/yyyy)';
        break;
      default:
        message = 'An error occurred';
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
          <h1 style={{ marginBottom: '20px' }}>Error</h1>
          <p style={{ fontSize: '40px' }}>{message}</p>
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