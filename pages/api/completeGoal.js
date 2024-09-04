import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  
  console.log('Complete Goal accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request query:', JSON.stringify(req.query, null, 2));

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
        <meta property="fc:frame:button:2" content="Share Achievement" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/completeGoal" />
        <meta property="fc:frame:state" content="${goalId},${fid}" />
      </head>
      </html>
    `);
  } catch (error) {
    console.error("Error completing goal:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}