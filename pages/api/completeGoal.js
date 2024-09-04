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
    // Check if goalId and fid are in query params (for the initial completion)
    if (req.query.id && req.query.fid) {
      ({ id: goalId, fid } = req.query);
    } else {
      // For subsequent actions (like sharing), get from state
      const { untrustedData } = req.body;
      [goalId, fid] = (untrustedData.state || '').split(',');
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    if (req.method === 'POST' && req.body.untrustedData) {
      const buttonIndex = parseInt(req.body.untrustedData.buttonIndex);
      if (buttonIndex === 1) {
        // Back to Review
        return res.redirect(302, `${baseUrl}/api/reviewGoals?fid=${fid}`);
      } else if (buttonIndex === 2) {
        // Share Achievement
        const shareText = encodeURIComponent(`I've completed my goal: "${goalData.goal}"! 🎉\n\nSet and track your goals with Empower!\n\n`);
        const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(`${baseUrl}/api/goalShare?id=${goalId}`)}`;
        
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