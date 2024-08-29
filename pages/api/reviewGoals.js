export default async function handler(req, res) {
  console.log('Review Goals accessed');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  const fid = req.query.fid || req.body?.untrustedData?.fid;

  if (!fid) {
    return res.status(400).json({ error: "FID is required" });
  }

  try {
    // Retrieve all goals from the environment variable ReviewGoals
    const reviewGoals = JSON.parse(process.env.ReviewGoals || '[]');

    if (reviewGoals.length === 0) {
      return res.status(404).json({ error: "No active goals found" });
    }

    // Filter goals based on dates
    const now = new Date();
    const activeGoals = reviewGoals.filter(goal => {
      const startDate = new Date(goal.startDate);
      const endDate = new Date(goal.endDate);
      return startDate <= now && endDate >= now;
    });

    if (activeGoals.length === 0) {
      return res.status(404).json({ error: "No active goals found within the date range" });
    }

    let currentIndex = req.query.index ? parseInt(req.query.index) : 0;
    currentIndex = (currentIndex + activeGoals.length) % activeGoals.length;

    const goalData = activeGoals[currentIndex];

    const imageUrl = `${baseUrl}/api/ogReview?goal=${encodeURIComponent(goalData.goal)}&startDate=${encodeURIComponent(goalData.startDate)}&endDate=${encodeURIComponent(goalData.endDate)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:button:3" content="Home" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/reviewGoals?fid=${fid}&index=${currentIndex - 1}" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/reviewGoals?fid=${fid}&index=${currentIndex + 1}" />
          <meta property="fc:frame:post_url:3" content="${baseUrl}/" />
        </head>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error processing goals:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
