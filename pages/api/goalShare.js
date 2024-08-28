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
    try {
      const { untrustedData } = req.body;
      const supporterId = untrustedData.fid;

      const goalRef = db.collection('goals').doc(goalId);
      const supporterRef = goalRef.collection('supporters').doc(supporterId.toString());

      const supporterDoc = await supporterRef.get();
      if (supporterDoc.exists) {
        const lastSupported = supporterDoc.data().supported_at.toDate();
        const now = new Date();
        if (lastSupported.toDateString() === now.toDateString()) {
          return res.status(400).json({ message: 'You have already supported this goal today' });
        }
      }

      await supporterRef.set({
        supporter_id: supporterId,
        supported_at: Timestamp.now(),
      });

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/ogSupportConfirmation" />
          <meta property="fc:frame:button:1" content="Back to Goal" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/goalShare?id=${goalId}" />
        </head>
        </html>
      `);
    } catch (error) {
      console.error("Error supporting goal:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}