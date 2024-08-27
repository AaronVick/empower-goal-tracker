import { db } from '../../lib/firebase';
import { Message } from '@farcaster/core';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('Set Goal API accessed');
    console.log('Request Body:', req.body);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

    const { trustedData } = req.body.untrustedData;
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

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/successImage" />
          <meta property="fc:frame:button:1" content="Home" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}" />
          <meta property="fc:frame:button:2" content="Share" />
          <meta property="fc:frame:button:2:action" content="link" />
          <meta property="fc:frame:button:2:target" content="${shareLink}" />
        </head>
        </html>
      `);
    } catch (error) {
      console.error("Error setting goal:", error);
      res.redirect(`${baseUrl}/api/error`);
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
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