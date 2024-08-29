import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Review Goals accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request query:', JSON.stringify(req.query, null, 2));

  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  let fid, currentIndex, buttonIndex;
  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    fid = untrustedData.fid;
    currentIndex = parseInt(untrustedData.state || '0');
    buttonIndex = parseInt(untrustedData.buttonIndex || '0');
  } else if (req.method === 'GET') {
    fid = req.query.fid;
    currentIndex = parseInt(req.query.index || '0');
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('FID:', fid);
  console.log('Current Index:', currentIndex);
  console.log('Button Index:', buttonIndex);

  if (!fid) {
    console.log('No FID provided');
    return res.status(400).json({ error: "FID is required" });
  }

  // Handle "Home" button click
  if (buttonIndex === 3) {
    console.log('Home button clicked');
    return res.redirect(302, baseUrl);
  }

  try {
    console.log('Attempting to fetch goals from Firebase for FID:', fid);

    const goalsSnapshot = await db.collection("goals").where("user_id", "==", fid).get();

    console.log('Query completed. Empty?', goalsSnapshot.empty, 'Size:', goalsSnapshot.size);

    if (goalsSnapshot.empty) {
      console.log('No goals found for FID:', fid);
      const noGoalImageUrl = `${baseUrl}/api/ogReview?error=no_goals`;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${noGoalImageUrl}" />
            <meta property="fc:frame:button:1" content="Home" />
            <meta property="fc:frame:post_url:1" content="${baseUrl}" />
          </head>
        </html>
      `;
      console.log('Sending HTML response for no goals');
      return res.setHeader('Content-Type', 'text/html').status(200).send(html);
    }

    const goals = goalsSnapshot.docs.map(doc => doc.data());
    console.log(`Found ${goals.length} goals for FID:`, fid);

    const totalGoals = goals.length;

    if (buttonIndex === 1) {
      // Previous button
      currentIndex = (currentIndex - 1 + totalGoals) % totalGoals;
    } else if (buttonIndex === 2) {
      // Next button
      currentIndex = (currentIndex + 1) % totalGoals;
    }

    const goalData = goals[currentIndex];
    console.log('Current goal data:', JSON.stringify(goalData));

    const imageUrl = `${baseUrl}/api/ogReview?goal=${encodeURIComponent(goalData.goal)}&startDate=${encodeURIComponent(goalData.startDate.toDate().toLocaleDateString())}&endDate=${encodeURIComponent(goalData.endDate.toDate().toLocaleDateString())}&index=${currentIndex + 1}&total=${totalGoals}`;

    console.log('Generated image URL:', imageUrl);

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
    console.log('Sending HTML response for existing goals');
    return res.setHeader('Content-Type', 'text/html').status(200).send(html);

  } catch (error) {
    console.error('Error fetching user goals:', error);
    return res.status(500).json({ error: "Error fetching user goals" });
  }
}