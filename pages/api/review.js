import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const goal = process.env.userSetGoal;
    const startDate = process.env.userStartDate;
    const endDate = process.env.userEndDate;

    if (!goal || !startDate || !endDate) {
      return new Response('Missing required environment variables', { status: 400 });
    }

    console.log('Received goal from environment:', goal);
    console.log('Received start date from environment:', startDate);
    console.log('Received end date from environment:', endDate);

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

    // Generate the HTML for the frame
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/review" />
          <meta property="fc:frame:button:1" content="Return Home" />
          <meta property="fc:frame:button:2" content="Set Goal" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/setGoal" />
        </head>
      </html>
    `;

    // Check if the request is for the image or the frame HTML
    const { searchParams } = new URL(req.url);
    const isImageRequest = searchParams.get('image') === 'true';

    if (isImageRequest) {
      return imageResponse;
    } else {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } catch (error) {
    console.error('Error processing review request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}