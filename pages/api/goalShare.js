import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  const { id: goalId } = req.query;

  console.log('goalShare handler accessed');
  console.log('Request method:', req.method);
  console.log('Goal ID:', goalId);

  if (req.method === 'GET') {
    // ... (keep existing GET method code)
  } else if (req.method === 'POST') {
    try {
      console.log('Processing POST request');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      const { untrustedData } = req.body;
      if (!untrustedData) {
        throw new Error('Missing untrustedData in request body');
      }
      const buttonIndex = parseInt(untrustedData.buttonIndex);
      console.log('Button Index:', buttonIndex);

      if (buttonIndex === 1) {
        console.log('Start Your Goal button clicked');
        return res.redirect(302, `${baseUrl}/api/start`);
      } else if (buttonIndex === 2) {
        console.log('Support Me button clicked');
        const supporterId = untrustedData.fid;
        console.log('Supporter ID:', supporterId);

        if (!goalId) {
          throw new Error('Goal ID is missing or invalid');
        }

        const goalRef = db.collection('goals').doc(goalId);
        console.log('Goal Ref:', goalRef.path);

        if (!supporterId) {
          throw new Error('Supporter ID is missing or invalid');
        }

        const supporterRef = goalRef.collection('supporters').doc(supporterId.toString());
        console.log('Supporter Ref:', supporterRef.path);

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
        if (!goalDoc.exists) {
          throw new Error(`Goal with ID ${goalId} not found`);
        }
        const goalData = goalDoc.data();
        console.log('Goal Data:', JSON.stringify(goalData, null, 2));

        if (!goalData.user_id) {
          throw new Error('User ID is missing from goal data');
        }

        // Fetch the username from the user's document
        const userDoc = await db.collection('users').doc(goalData.user_id).get();
        const username = userDoc.exists ? userDoc.data().username : 'Unknown User';
        console.log('Username:', username);

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
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}