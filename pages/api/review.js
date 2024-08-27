import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const goal = searchParams.get('goal');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isImageRequest = searchParams.get('image') === 'true';

    console.log('Received goal:', goal);
    console.log('Received start date:', startDate);
    console.log('Received end date:', endDate);

    if (!goal || !startDate || !endDate) {
      return new Response('Missing required parameters', { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

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

    if (isImageRequest) {
      return imageResponse;
    } else {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${baseUrl}/api/review?image=true&goal=${encodeURIComponent(goal)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}" />
            <meta property="fc:frame:button:1" content="Return Home" />
            <meta property="fc:frame:button:2" content="Set Goal" />
            <meta property="fc:frame:post_url:1" content="${baseUrl}/api" />
            <meta property="fc:frame:post_url:2" content="${baseUrl}/api/setGoal" />
          </head>
        </html>
      `;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } catch (error) {
    console.error('Error processing review request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}