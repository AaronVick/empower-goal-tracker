export default async function handler(req, res) {
  console.log('Review Goals accessed');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  const fid = req.query.fid || req.body?.untrustedData?.fid;
  let currentIndex = req.query.index ? parseInt(req.query.index) : 0;

  console.log('Base URL:', baseUrl);
  console.log('FID:', fid);
  console.log('Current Index:', currentIndex);

  if (!fid) {
    console.error('Error: FID is required');
    return res.status(400).json({ error: "FID is required" });
  }

  try {
    console.log('Parsing ReviewGoals environment variable');
    let reviewGoals = [];

    // Safely parse the environment variable to avoid breaking if it fails
    try {
      reviewGoals = JSON.parse(process.env.ReviewGoals || '[]');
    } catch (parseError) {
      console.error('Error parsing ReviewGoals environment variable:', parseError);
      return res.status(500).json({ error: "Failed to parse ReviewGoals environment variable" });
    }

    console.log('Parsed Review Goals:', reviewGoals);

    if (reviewGoals.length === 0) {
      console.error('Error: No goals found in ReviewGoals');
      return res.status(404).json({ error: "No active goals found" });
    }

    // Filter active goals based on current date
    const now = new Date();
    console.log('Current Date:', now);
    const activeGoals = reviewGoals.filter(goal => {
      const startDate = new Date(goal.startDate);
      const endDate = new Date(goal.endDate);
      const isActive = startDate <= now && endDate >= now;
      console.log(`Goal: ${goal.goal}, Start Date: ${startDate}, End Date: ${endDate}, Active: ${isActive}`);
      return isActive;
    });

    if (activeGoals.length === 0) {
      console.error('Error: No active goals within the date range');
      return res.status(404).json({ error: "No active goals found within the date range" });
    }

    console.log('Active Goals:', activeGoals);
    currentIndex = (currentIndex + activeGoals.length) % activeGoals.length;
    const goalData = activeGoals[currentIndex];

    console.log('Selected Goal Data:', goalData);

    const imageUrl = `${baseUrl}/api/ogReview?goal=${encodeURIComponent(goalData.goal)}&startDate=${encodeURIComponent(goalData.startDate)}&endDate=${encodeURIComponent(goalData.endDate)}`;
    console.log('Generated Image URL:', imageUrl);

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

    console.log('Generated HTML:', html);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error processing goals:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
