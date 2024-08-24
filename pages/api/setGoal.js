import { db } from '../../lib/firebase';
import { Message } from '@farcaster/core';
import { Timestamp } from 'firebase-admin/firestore';
import { createSuccessOGImage } from '../../lib/utils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const { trustedData, goal, startDate, endDate } = req.body;

  try {
    // Decode the Farcaster message
    const frameMessage = Message.decode(Buffer.from(trustedData.messageBytes, 'hex'));
    const userFID = frameMessage.data.fid;

    // Convert dates to timestamps
    const startTimestamp = convertToTimestamp(startDate, true);
    const endTimestamp = convertToTimestamp(endDate, false);

    // Add goal to Firebase
    await db.collection('goals').add({
      user_id: userFID,
      goal,
      startDate: startTimestamp,
      endDate: endTimestamp,
      createdAt: Timestamp.now(),
    });

    // Generate success image and share link
    const ogImage = createSuccessOGImage();
    const shareText = encodeURIComponent(`I just set a new goal: "${goal}"! Join me on Empower Goal Tracker.\n\nStart Date: ${startDate}\nEnd Date: ${endDate}`);
    const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(basePath)}`;

    // Send response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${ogImage}" />
        <meta property="fc:frame:button:1" content="Home" />
        <meta property="fc:frame:post_url" content="${basePath}/" />
        <meta property="fc:frame:button:2" content="Share" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="${shareLink}" />
      </head>
      <body>
        <h1>Goal Set Successfully!</h1>
        <p>Your goal has been saved.</p>
        <form action="${basePath}/" method="get">
          <button type="submit">Home</button>
        </form>
        <a href="${shareLink}">
          <button>Share</button>
        </a>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error setting goal:", error);
    res.redirect(`${basePath}/api/error`);
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