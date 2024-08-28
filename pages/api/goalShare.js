import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  const { id: goalId } = req.query;

  console.log('goalShare handler accessed');
  console.log('Request method:', req.method);
  console.log('Goal ID:', goalId);

  if (req.method === 'GET') {
    try {
      console.log('Fetching goal data');
      const response = await fetch(`${baseUrl}/api/ogGoalShare?id=${encodeURIComponent(goalId)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch goal data');
      }
      const goalData = await response.json();
      console.log('Goal data:', goalData);

      const imageUrl = `${baseUrl}/api/generateGoalImage?goal=${encodeURIComponent(goalData.goal)}&startDate=${encodeURIComponent(goalData.startDate)}&endDate=${encodeURIComponent(goalData.endDate)}&fid=${encodeURIComponent(goalData.fid)}`;

      console.log('Generated image URL:', imageUrl);

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Start Your Goal" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}" />
          <meta property="fc:frame:button:2" content="Support Me" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/goalShare?id=${encodeURIComponent(goalId)}" />
        </head>
        </html>
      `);
    } catch (error) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    try {
      console.log('Processing POST request');
      console.log('Request body:', req.body);
      const { untrustedData } = req.body;
      const supporterId = untrustedData.fid;

      console.log('Supporter FID:', supporterId);

      const goalRef = db.collection('goals').doc(goalId);
      const supporterRef = goalRef.collection('supporters').doc(supporterId.toString());

      const supporterDoc = await supporterRef.get();
      if (supporterDoc.exists) {
        const lastSupported = supporterDoc.data().supported_at.toDate();
        const now = new Date();
        if (lastSupported.toDateString() === now.toDateString()) {
          console.log('User already supported today');
          return res.status(400).json({ message: 'You have already supported this goal today' });
        }
      }

      const currentTimestamp = Timestamp.now();
      console.log('Current timestamp:', currentTimestamp.toDate());

      await supporterRef.set({
        supporter_id: supporterId,
        supported_at: currentTimestamp,
      });

      console.log('Support logged successfully');

      const goalDoc = await goalRef.get();
      const goalData = goalDoc.data();

      const imageUrl = `${baseUrl}/api/generateSupportImage?goal=${encodeURIComponent(goalData.goal)}&fid=${encodeURIComponent(goalData.user_id)}`;

      console.log('Generated support image URL:', imageUrl);

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Back to Goal" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/goalShare?id=${encodeURIComponent(goalId)}" />
        </head>
        </html>
      `);
    } catch (error) {
      console.error("Error supporting goal:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    console.log('Method not allowed');
    res.status(405).json({ error: 'Method not allowed' });
  }
}
