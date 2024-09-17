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
    const completed = searchParams.get('completed') === 'true';

    console.log('Received parameters:', { goal, startDate, endDate, index, total, completed });

    if (!goal || !startDate || !endDate || !index || !total) {
      console.error('Missing required parameters');
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
          <p style={{ fontSize: '24px', marginBottom: '10px' }}>Goal {index} of {total}</p>
          <p style={{ fontSize: '36px', marginBottom: '20px', maxWidth: '80%', wordBreak: 'break-word' }}>
            {decodeURIComponent(goal)}
          </p>
          <p style={{ fontSize: '24px', marginBottom: '10px' }}>Start Date: {decodeURIComponent(startDate)}</p>
          <p style={{ fontSize: '24px', marginBottom: '20px' }}>End Date: {decodeURIComponent(endDate)}</p>
          <p style={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            color: completed ? '#4CAF50' : '#FFA500',
            padding: '10px 20px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.1)'
          }}>
            {completed ? 'Completed' : 'In Progress'}
          </p>
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