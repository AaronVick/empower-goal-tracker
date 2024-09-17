import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  console.log('Complete Goal accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request query:', JSON.stringify(req.query, null, 2));

  let goalId, fid;

  if (req.method === 'GET') {
    ({ id: goalId, fid } = req.query);
  } else if (req.method === 'POST') {
    const { untrustedData } = req.body;
    goalId = untrustedData.state;
    fid = untrustedData.fid;
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!goalId) {
    console.log('Missing Goal ID');
    return res.status(400).json({ error: "Goal ID is required" });
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

    // Check FID authorization
    if (fid && goalData.user_id !== fid.toString()) {
      console.log('Unauthorized access attempt');
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Mark goal as completed if it's not already marked
    if (!goalData.completed) {
      await db.collection('goals').doc(goalId).update({ completed: true });
      console.log('Goal marked as completed');
    }

    const timestamp = Date.now();
    const imageUrl = `${baseUrl}/api/ogComplete?goal=${encodeURIComponent(goalData.goal)}&t=${timestamp}`;

    console.log('Generated image URL:', imageUrl);

    if (req.method === 'POST' && req.body.untrustedData) {
      const buttonIndex = parseInt(req.body.untrustedData.buttonIndex);
      if (buttonIndex === 1) {
        // Back to Home
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${baseUrl}/empower.png" />
            <meta property="fc:frame:button:1" content="Start a Goal" />
            <meta property="fc:frame:button:2" content="Review Goals" />
            <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
          </head>
          </html>
        `);
      } else if (buttonIndex === 2) {
        // Share Achievement
        const shareText = encodeURIComponent(`I've completed my goal: "${goalData.goal}"! 🎉\n\nSet and track your goals with Empower!\n\n`);
        const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(`${baseUrl}/api/completeGoal?id=${goalId}`)}`;
        
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${imageUrl}" />
            <meta property="fc:frame:button:1" content="Share on Warpcast" />
            <meta property="fc:frame:button:1:action" content="link" />
            <meta property="fc:frame:button:1:target" content="${shareLink}" />
          </head>
          </html>
        `);
      }
    }

    // Handle GET or POST response if no button interaction
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:button:1" content="Back to Home" />
        <meta property="fc:frame:button:2" content="Share Achievement" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/completeGoal" />
        <meta property="fc:frame:state" content="${goalId}" />
      </head>
      </html>
    `);
  } catch (error) {
    console.error("Error completing goal:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}