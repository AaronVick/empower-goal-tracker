import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  
  console.log('Complete Goal accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request query:', JSON.stringify(req.query, null, 2));

  if (req.method === 'GET') {
    const { id: goalId, fid } = req.query;

    if (!goalId || !fid) {
      console.log('Missing Goal ID or FID');
      return res.status(400).json({ error: "Goal ID and FID are required" });
    }

    try {
      console.log('Fetching goal data for ID:', goalId);
      const goalDoc = await db.collection('goals').doc(goalId).get();

      if (!goalDoc.exists) {
        console.error(`Goal ID ${goalId} not found.`);
        return res.status(404).json({ error: 'Goal not found' });
      }

      const goalData = goalDoc.data();
      console.log('Goal data fetched:', goalData);

      if (goalData.user_id != fid) {
        console.log('Unauthorized access attempt');
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (!goalData.completed) {
        await db.collection('goals').doc(goalId).update({ completed: true });
        console.log('Goal marked as completed');
      }

      // Add a timestamp to force image regeneration
      const timestamp = Date.now();
      const imageUrl = `${baseUrl}/api/ogComplete?goal=${encodeURIComponent(goalData.goal)}&t=${timestamp}`;

      console.log('Generated image URL:', imageUrl);

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Back to Review" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/reviewGoals" />
          <meta property="fc:frame:button:2" content="Share Achievement" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/completeGoal?id=${encodeURIComponent(goalId)}&action=share" />
        </head>
        </html>
      `);
    } catch (error) {
      console.error("Error completing goal:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    try {
      console.log('Processing POST request');
      console.log('Request body:', req.body);
      const { untrustedData } = req.body;
      const buttonIndex = parseInt(untrustedData.buttonIndex);
      const goalId = untrustedData.state;
      console.log('Button Index:', buttonIndex, 'Goal ID:', goalId);

      if (buttonIndex === 1) {
        console.log('Back to Review button clicked');
        res.redirect(302, `${baseUrl}/api/reviewGoals?fid=${untrustedData.fid}`);
      } else if (buttonIndex === 2) {
        console.log('Share Achievement button clicked');
        const goalDoc = await db.collection('goals').doc(goalId).get();
        const goalData = goalDoc.data();

        const shareText = encodeURIComponent(`I've completed my goal: "${goalData.goal}"! 🎉\n\nSet and track your goals with Empower!\n\n`);
        const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(`${baseUrl}/api/goalShare?id=${goalId}`)}`;

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${baseUrl}/api/ogComplete?goal=${encodeURIComponent(goalData.goal)}" />
            <meta property="fc:frame:button:1" content="Share on Warpcast" />
            <meta property="fc:frame:button:1:action" content="link" />
            <meta property="fc:frame:button:1:target" content="${shareLink}" />
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