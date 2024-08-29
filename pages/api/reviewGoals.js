export default async function handler(req, res) {
  console.log('Review Goals accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request query:', JSON.stringify(req.query, null, 2));

  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  
  let fid, currentIndex = 0, buttonIndex;

  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    fid = untrustedData.fid;
    currentIndex = parseInt(untrustedData.state || '0');
    buttonIndex = parseInt(untrustedData.buttonIndex || '0');
  } else if (req.method === 'GET') {
    fid = req.query.fid;
    buttonIndex = parseInt(req.query.buttonIndex || '0');
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('FID:', fid);
  console.log('Current Index:', currentIndex);
  console.log('Button Index:', buttonIndex);

  if (!fid) {
    return res.status(400).json({ error: "FID is required" });
  }

  if (buttonIndex === 3) {
    console.log('Home button clicked');
    return res.redirect(302, baseUrl);
  }

  try {
    const goalsSnapshot = await db.collection("goals").where("user_id", "==", fid).get();

    if (goalsSnapshot.empty) {
      console.log('No goals found for FID:', fid);
      return res.status(404).json({ error: "No goals found" });
    }

    const goals = goalsSnapshot.docs.map(doc => doc.data());
    const totalGoals = goals.length;

    if (buttonIndex === 1) {
      currentIndex = (currentIndex - 1 + totalGoals) % totalGoals;
    } else if (buttonIndex === 2) {
      currentIndex = (currentIndex + 1) % totalGoals;
    }

    const goalData = goals[currentIndex];
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
          <meta property="fc:frame:post_url" content="${baseUrl}/api/reviewGoals" />
          <meta property="fc:frame:state" content="${currentIndex}" />
        </head>
      </html>
    `;
    return res.setHeader('Content-Type', 'text/html').status(200).send(html);

  } catch (error) {
    console.error('Error fetching user goals:', error);
    return res.status(500).json({ error: "Error fetching user goals" });
  }
}
