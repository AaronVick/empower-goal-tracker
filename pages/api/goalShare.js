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
      console.log('Fetching goal data for ID:', goalId);
      const goalDoc = await db.collection('goals').doc(goalId).get();

      if (!goalDoc.exists) {
        console.error(`Goal ID ${goalId} not found.`);
        return res.status(404).json({ error: 'Goal not found' });
      }

      const goalData = goalDoc.data();
      console.log('Goal data fetched:', goalData);

      const imageUrl = `${baseUrl}/api/generateGoalImage?goal=${encodeURIComponent(goalData.goal)}&startDate=${encodeURIComponent(goalData.startDate.toDate().toLocaleDateString())}&endDate=${encodeURIComponent(goalData.endDate.toDate().toLocaleDateString())}&fid=${encodeURIComponent(goalData.user_id)}`;

      console.log('Generated image URL:', imageUrl);

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Start Your Goal" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/start" />
          <meta property="fc:frame:button:2" content="Support Me" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/goalShare?id=${encodeURIComponent(goalId)}&action=support" />
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
      const buttonIndex = parseInt(untrustedData.buttonIndex);
      console.log('Button Index:', buttonIndex);

      if (buttonIndex === 1) {
        console.log('Start Your Goal button clicked');
        res.redirect(302, `${baseUrl}/api/start`);
      } else if (buttonIndex === 2) {
        console.log('Support Me button clicked');
        const supporterId = untrustedData.fid;

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
            <meta property="fc:frame:button:1" content="Set a Goal" />
            <meta property="fc:frame:post_url:1" content="${baseUrl}/api/start" />
          </head>
          </html>
        `);
      } else {
        console.log('Unknown button index received:', buttonIndex);
        res.status(400).json({ error: 'Invalid button index' });
      }
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}