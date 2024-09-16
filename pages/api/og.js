import { ImageResponse } from '@vercel/og';
import { NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('OG Image Generator accessed');

  try {
    const { searchParams } = new URL(req.url);
    const error = searchParams.get('error');
    const step = searchParams.get('step');

    console.log('Error parameter:', error);
    console.log('Step parameter:', step);

    // Use the static image for goal-setting steps
    if (!error && (step === 'start' || step === 'startDate' || step === 'endDate')) {
      console.log('Returning static image for step:', step);
      return NextResponse.redirect(new URL('/addGoal.png', req.url));
    }

    // Generate dynamic image for error cases
    if (error) {
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

      console.log('Generating error image with message:', message);

      return new ImageResponse(
        (
          <div
            style={{
              fontSize: 60,
              color: 'white',
              background: 'linear-gradient(to bottom, #1E2E3D, #2D3E4D)',
              width: '100%',
              height: '100%',
              padding: '50px',
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
    }

    // Fallback to static image if no specific step or error is provided
    console.log('Returning fallback static image');
    return NextResponse.redirect(new URL('/addGoal.png', req.url));
  } catch (e) {
    console.error('Error in OG Image Generator:', e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
