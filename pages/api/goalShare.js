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
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { untrustedData } = req.body;
      if (!untrustedData) {
        console.error('Missing untrustedData in request body');
        return res.status(400).json({ error: 'Missing untrustedData in request body' });
      }

      const buttonIndex = parseInt(untrustedData.buttonIndex);
      console.log('Button Index:', buttonIndex);

      if (buttonIndex === 2) { // "Support Me" button
        const goalRef = db.collection('goals').doc(goalId);
        const goalDoc = await goalRef.get();
        
        if (!goalDoc.exists) {
          console.error(`Goal ID ${goalId} not found.`);
          return res.status(404).json({ error: 'Goal not found' });
        }

        const goalData = goalDoc.data();
        console.log('Goal data:', JSON.stringify(goalData, null, 2));

        // Log support action (you can expand this as needed)
        console.log('Support logged for goal:', goalId);

        const imageUrl = `${baseUrl}/api/generateSupportImage?goal=${encodeURIComponent(goalData.goal)}&fid=${encodeURIComponent(goalData.user_id)}`;

        console.log('Generated support image URL:', imageUrl);

        const htmlResponse = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${imageUrl}" />
            <meta property="fc:frame:button:1" content="Back to Goal" />
            <meta property="fc:frame:post_url:1" content="${baseUrl}/api/goalShare?id=${encodeURIComponent(goalId)}" />
          </head>
          <body>Support Confirmed!</body>
          </html>
        `;

        console.log('HTML Response:', htmlResponse);

        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(htmlResponse);
      } else {
        console.log('Unknown button index received:', buttonIndex);
        return res.status(400).json({ error: 'Invalid button index' });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error("Error in goalShare handler:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message, stack: error.stack });
  }
}