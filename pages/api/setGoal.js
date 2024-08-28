import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  if (req.method === 'POST') {
    console.log('Set Goal API accessed');
    console.log('Request Body:', req.body);

    const { untrustedData } = req.body;
    const goal = process.env.userSetGoal;
    const startDate = process.env.userStartDate;
    const endDate = process.env.userEndDate;

    try {
      const userFID = untrustedData.fid;

      if (!userFID) {
        throw new Error('User FID not found in request data');
      }

      const startTimestamp = convertToTimestamp(startDate, true);
      const endTimestamp = convertToTimestamp(endDate, false);

      console.log('Attempting to add goal to Firebase with the following details:');
      console.log(`Goal: ${goal}`);
      console.log(`Start Date: ${startDate} (${startTimestamp.toDate()})`);
      console.log(`End Date: ${endDate} (${endTimestamp.toDate()})`);
      console.log(`User FID: ${userFID}`);

      const goalRef = await db.collection('goals').add({
        user_id: userFID,
        goal,
        startDate: startTimestamp,
        endDate: endTimestamp,
        createdAt: Timestamp.now(),
      });

      const goalId = goalRef.id;
      console.log(`Goal successfully added with ID: ${goalId}`);

      const shareText = encodeURIComponent(`I set a new goal: "${goal}"! Support me on my journey!\n\nFrame by @aaronv\n\n`);
      const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(`${baseUrl}/api/goalShare?id=${goalId}`)}`;

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
      res.redirect(302, `${baseUrl}/api/error`);
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
