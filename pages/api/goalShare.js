import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  const { id: goalId } = req.query;

  console.log('goalShare handler accessed');
  console.log('Request method:', req.method);
  console.log('Goal ID:', goalId);

  try {
    if (req.method === 'GET') {
      console.log('Processing GET request');
      const goalDoc = await db.collection('goals').doc(goalId).get();
      console.log('Goal document fetched');

      if (!goalDoc.exists) {
        console.error(`Goal ID ${goalId} not found.`);
        return res.status(404).json({ error: 'Goal not found' });
      }

      const goalData = goalDoc.data();
      console.log('Goal data:', JSON.stringify(goalData, null, 2));

      const imageUrl = `${baseUrl}/api/generateGoalImage?goal=${encodeURIComponent(goalData.goal)}&startDate=${encodeURIComponent(goalData.startDate.toDate().toLocaleDateString())}&endDate=${encodeURIComponent(goalData.endDate.toDate().toLocaleDateString())}&fid=${encodeURIComponent(goalData.user_id)}`;

      console.log('Generated image URL:', imageUrl);

      const htmlResponse = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Start Your Goal" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/start" />
          <meta property="fc:frame:button:2" content="Support Me" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/goalShare?id=${encodeURIComponent(goalId)}" />
        </head>
        </html>
      `;

      console.log('HTML Response:', htmlResponse);

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(htmlResponse);
    } else if (req.method === 'POST') {
      console.log('Processing POST request');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      // Simplified POST handling for debugging
      return res.status(200).json({ message: 'POST request received' });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Error in goalShare handler:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message, stack: error.stack });
  }
}