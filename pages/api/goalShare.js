import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  const { id: goalId } = req.query;

  if (req.method === 'GET') {
    try {
      const response = await fetch(`${baseUrl}/api/ogGoalShare?id=${encodeURIComponent(goalId)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch goal data');
      }
      const goalData = await response.json();

      const imageUrl = `${baseUrl}/api/generateGoalImage?goal=${encodeURIComponent(goalData.goal)}&startDate=${encodeURIComponent(goalData.startDate)}&endDate=${encodeURIComponent(goalData.endDate)}`;

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
    // ... (keep the existing POST logic)
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}