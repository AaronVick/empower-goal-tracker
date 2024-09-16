import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  console.log('Set Goal API accessed');
  console.log('Request Method:', req.method);
  console.log('Request Body:', req.body);
  console.log('Request Query:', req.query);

  if (req.method === 'GET' || req.method === 'POST') {
    const untrustedData = req.method === 'POST' ? req.body.untrustedData : req.query;

    try {
      const userFID = untrustedData.fid;

      if (!userFID) {
        throw new Error('User FID not found in request data');
      }

      // Retrieve session data from Firebase (goal, startDate, endDate)
      const sessionSnapshot = await db.collection('sessions').doc(userFID.toString()).get();
      if (!sessionSnapshot.exists) {
        throw new Error('Session not found for user');
      }

      const sessionData = sessionSnapshot.data();
      const goal = sessionData.goal;
      const startDate = sessionData.startDate;
      const endDate = sessionData.endDate;

      // Logging the session data for troubleshooting
      console.log('Session Data:');
      console.log(`Goal: ${goal}`);
      console.log(`Start Date: ${startDate}`);
      console.log(`End Date: ${endDate}`);

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
        completed: false,
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

      // Clear the session data after successful goal creation
      await db.collection('sessions').doc(userFID.toString()).delete();
    } catch (error) {
      console.error("Error setting goal:", error);
      res.redirect(302, `${baseUrl}/api/error`);
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Utility function to convert date strings to Firebase Timestamp
function convertToTimestamp(dateString, isStart) {
  if (!dateString) {
    throw new Error('Date string is invalid');
  }

  const [day, month, year] = dateString.split('/');
  const date = new Date(`${year}-${month}-${day}`);

  if (isNaN(date)) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

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