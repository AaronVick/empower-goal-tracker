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
      // ... (keep existing GET method code)
    } else if (req.method === 'POST') {
      console.log('Processing POST request');
      console.log('Request body:', req.body);
      const { untrustedData } = req.body;
      if (!untrustedData) {
        console.error('Missing untrustedData in request body');
        return res.status(400).json({ error: 'Missing untrustedData in request body' });
      }
      const buttonIndex = parseInt(untrustedData.buttonIndex);
      console.log('Button Index:', buttonIndex);

      if (buttonIndex === 1) {
        console.log('Start Your Goal button clicked');
        return res.redirect(302, `${baseUrl}/api/start`);
      } else if (buttonIndex === 2) {
        console.log('Support Me button clicked');
        const supporterId = untrustedData.fid;

        const goalRef = db.collection('goals').doc(goalId);
        const goalDoc = await goalRef.get();
        
        if (!goalDoc.exists) {
          console.error(`Goal ID ${goalId} not found.`);
          return res.status(404).json({ error: 'Goal not found' });
        }

        const goalData = goalDoc.data();
        console.log('Goal data:', goalData);

        // Retrieve the username from the goal data
        const username = goalData.username || await fetchUsernameFromFid(goalData.user_id);
        console.log('Username:', username);

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

        const imageUrl = `${baseUrl}/api/generateSupportImage?goal=${encodeURIComponent(goalData.goal)}&fid=${encodeURIComponent(goalData.user_id)}&username=${encodeURIComponent(username)}`;

        console.log('Generated support image URL:', imageUrl);

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`
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
      } else {
        console.log('Unknown button index received:', buttonIndex);
        return res.status(400).json({ error: 'Invalid button index' });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Error in goalShare handler:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

// Function to fetch username from FID if not stored with the goal
async function fetchUsernameFromFid(fid) {
  try {
    // Implement the logic to fetch the username from the FID
    // This could be a call to a Farcaster API or your own user database
    // For now, we'll return a placeholder
    return `User_${fid}`;
  } catch (error) {
    console.error("Error fetching username from FID:", error);
    return "Unknown User";
  }
}