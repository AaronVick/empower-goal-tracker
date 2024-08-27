import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  console.log('SetGoal handler accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  if (req.method === 'GET') {
    console.log('Redirecting to generateSuccessImage');
    res.redirect(302, `${baseUrl}/api/generateSuccessImage`);
  } else if (req.method === 'POST') {
    console.log('Processing POST request');
    const { untrustedData } = req.body;
    const goal = process.env.userSetGoal;
    const startDate = process.env.userStartDate;
    const endDate = process.env.userEndDate;

    console.log('Goal:', goal);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    try {
      const userFID = untrustedData.fid;
      console.log('User FID:', userFID);

      if (!userFID) {
        throw new Error('User FID not found in request data');
      }

      const startTimestamp = convertToTimestamp(startDate, true);
      const endTimestamp = convertToTimestamp(endDate, false);

      await db.collection('goals').add({
        user_id: userFID,
        goal,
        startDate: startTimestamp,
        endDate: endTimestamp,
        createdAt: Timestamp.now(),
      });

      console.log('Goal added to database');

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/generateSuccessImage" />
          <meta property="fc:frame:button:1" content="Home" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}" />
        </head>
        </html>
      `);
    } catch (error) {
      console.error("Error setting goal:", error);
      res.redirect(302, `${baseUrl}/api/error`);
    }
  } else {
    console.log('Method not allowed');
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