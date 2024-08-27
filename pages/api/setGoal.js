import { db } from '../../lib/firebase';
import { Message } from '@farcaster/core';
import { Timestamp } from 'firebase-admin/firestore';
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  if (req.method === 'GET') {
    // Handle GET request - display "Goal has been set!" image
    return new ImageResponse(
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
          <h1>Goal has been set!</h1>
          <p style={{ fontSize: '40px' }}>Your goal is now tracked.</p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } else if (req.method === 'POST') {
    // Handle POST request - set the goal in Firebase
    console.log('Set Goal API accessed');
    console.log('Request Body:', await req.json());

    const { untrustedData } = await req.json();
    const { trustedData } = untrustedData;
    const goal = process.env.userSetGoal;
    const startDate = process.env.userStartDate;
    const endDate = process.env.userEndDate;

    try {
      const frameMessage = Message.decode(Buffer.from(trustedData.messageBytes, 'hex'));
      const userFID = frameMessage.data.fid;

      const startTimestamp = convertToTimestamp(startDate, true);
      const endTimestamp = convertToTimestamp(endDate, false);

      await db.collection('goals').add({
        user_id: userFID,
        goal,
        startDate: startTimestamp,
        endDate: endTimestamp,
        createdAt: Timestamp.now(),
      });

      const shareText = encodeURIComponent(`I just set a new goal: "${goal}"! Join me on Empower Goal Tracker.`);
      const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(baseUrl)}`;

      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/setGoal" />
          <meta property="fc:frame:button:1" content="Home" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}" />
          <meta property="fc:frame:button:2" content="Share" />
          <meta property="fc:frame:button:2:action" content="link" />
          <meta property="fc:frame:button:2:target" content="${shareLink}" />
        </head>
        </html>
        `,
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    } catch (error) {
      console.error("Error setting goal:", error);
      return Response.redirect(`${baseUrl}/api/error`, 302);
    }
  } else {
    return new Response('Method not allowed', { status: 405 });
  }
}

function convertToTimestamp(dateString, isStart) {
  const [day, month, year] = dateString.split('/');
  const date = new Date(`${year}-${month}-${day}`);

  if (date.toDateString() === new Date().toDateString()) {
    return Timestamp.fromDate(new Date());
  } else {
    if (isStart) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return Timestamp.fromDate(date);
  }
}