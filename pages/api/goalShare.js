import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  const { id: goalId } = req.query;

  if (req.method === 'GET') {
    try {
      const goalDoc = await db.collection('goals').doc(goalId).get();
      if (!goalDoc.exists) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/ogGoalShare?id=${goalId}" />
          <meta property="fc:frame:button:1" content="Start Your Goal" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}" />
          <meta property="fc:frame:button:2" content="Support Me" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/goalShare?id=${goalId}" />
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