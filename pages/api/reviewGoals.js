import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Review Goals accessed');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  const fid = req.query.fid || req.body?.untrustedData?.fid;

  if (!fid) {
    return res.status(400).json({ error: "FID is required" });
  }

  try {
    const now = new Date();

    const goalsSnapshot = await db.collection("goals")
      .where("user_id", "==", fid)
      .where("startDate", "<=", now)
      .where("endDate", ">=", now)
      .get();

    if (goalsSnapshot.empty) {
      return res.status(404).json({ error: "No active goals found" });
    }

    const goals = goalsSnapshot.docs.map(doc => doc.data());
    const goalData = goals[0]; // Start with the first goal

    const imageUrl = `${baseUrl}/api/ogReview?goal=${encodeURIComponent(goalData.goal)}&startDate=${encodeURIComponent(goalData.startDate.toDate().toLocaleDateString())}&endDate=${encodeURIComponent(goalData.endDate.toDate().toLocaleDateString())}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:button:3" content="Home" />
          <meta property="fc:frame:post_url:3" content="${baseUrl}/" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/reviewGoals" />
        </head>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error fetching user goals:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
