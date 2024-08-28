import { db } from '../../lib/firebase';
import { createReviewOGImage } from '../../utils';

export default async function handler(req, res) {
  console.log('Review Goals accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request query:', JSON.stringify(req.query, null, 2));

  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  let fid, currentIndex;
  if (req.method === 'POST') {
    fid = req.body?.untrustedData?.fid;
    currentIndex = parseInt(req.body?.untrustedData?.inputText || '0');
  } else {
    fid = req.query.fid;
    currentIndex = parseInt(req.query.index || '0');
  }

  console.log('FID:', fid);
  console.log('Current Index:', currentIndex);

  if (!fid) {
    console.log('No FID provided');
    return res.status(400).json({ error: "FID is required" });
  }

  try {
    console.log('Attempting to fetch goals for FID:', fid);
    const goalsSnapshot = await db.collection("goals").where("user_id", "==", fid).get();

    if (goalsSnapshot.empty) {
      console.log('No goals found for FID:', fid);
      const noGoalImageUrl = createReviewOGImage("No goals set yet", "", "");

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${noGoalImageUrl}" />
            <meta property="fc:frame:button:1" content="Set a Goal" />
            <meta property="fc:frame:post_url:1" content="${baseUrl}/api/start" />
          </head>
        </html>
      `;
      console.log('Sending HTML response for no goals');
      return res.setHeader('Content-Type', 'text/html').status(200).send(html);
    }

    const goals = goalsSnapshot.docs.map(doc => doc.data());
    const totalGoals = goals.length;
    currentIndex = (currentIndex + totalGoals) % totalGoals; // Ensure index is within bounds

    const goalData = goals[currentIndex];
    console.log('Current goal data:', goalData);

    const imageUrl = createReviewOGImage(
      goalData.goal,
      goalData.startDate.toDate().toLocaleDateString(),
      goalData.endDate.toDate().toLocaleDateString(),
      `Goal ${currentIndex + 1} of ${totalGoals}`
    );

    console.log('Generated image URL:', imageUrl);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:button:3" content="Set New Goal" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/reviewGoals" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/reviewGoals" />
          <meta property="fc:frame:post_url:3" content="${baseUrl}/api/start" />
          <meta property="fc:frame:input:text" content="${currentIndex}" />
        </head>
      </html>
    `;
    console.log('Sending HTML response for existing goals');
    return res.setHeader('Content-Type', 'text/html').status(200).send(html);

  } catch (error) {
    console.error('Error fetching user goals:', error);
    return res.status(500).json({ error: "Error fetching user goals" });
  }
}