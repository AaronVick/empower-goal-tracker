import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Review Goals accessed');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  let fid, currentIndex, buttonIndex;
  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    fid = untrustedData.fid;
    currentIndex = parseInt(untrustedData.state || '0');
    buttonIndex = parseInt(untrustedData.buttonIndex || '0');
    console.log('POST request received. FID:', fid, 'Current Index:', currentIndex, 'Button Index:', buttonIndex);
  } else if (req.method === 'GET') {
    fid = req.query.fid;
    currentIndex = 0;  // Always start with the first goal
    console.log('GET request received. FID:', fid);
  } else {
    console.log('Invalid request method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!fid) {
    console.log('No FID provided');
    return res.status(400).json({ error: "FID is required" });
  }

  try {
    console.log('Attempting to fetch goals for FID:', fid);

    const goalsSnapshot = await db.collection("goals").where("user_id", "==", fid).get();

    if (goalsSnapshot.empty) {
      console.log('No goals found for FID:', fid);
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${baseUrl}/api/og?message=No goals found" />
            <meta property="fc:frame:button:1" content="Home" />
            <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
          </head>
        </html>
      `;
      return res.setHeader('Content-Type', 'text/html').status(200).send(html);
    }

    const goals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalGoals = goals.length;

    // Handle navigation buttons (back and next)
    if (buttonIndex === 1) {
      currentIndex = (currentIndex - 1 + totalGoals) % totalGoals;
    } else if (buttonIndex === 2) {
      currentIndex = (currentIndex + 1) % totalGoals;
    } else if (buttonIndex === 3) {
      // Home button
      return res.redirect(307, `${baseUrl}/api/start`);
    } else if (buttonIndex === 4) {
      // Complete Goal button
      const goalToComplete = goals[currentIndex];
      await db.collection("goals").doc(goalToComplete.id).update({ completed: true });
      console.log(`Goal ${goalToComplete.id} marked as completed`);
      
      // Redirect to the completion page
      return res.redirect(307, `${baseUrl}/api/completeGoal?id=${goalToComplete.id}&fid=${fid}`);
    }

    const goalData = goals[currentIndex];
    const imageUrl = `${baseUrl}/api/ogReviewImage?` + new URLSearchParams({
      goal: goalData.goal,
      startDate: goalData.startDate.toDate().toLocaleDateString(),
      endDate: goalData.endDate.toDate().toLocaleDateString(),
      index: currentIndex + 1,
      total: totalGoals
    }).toString();

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
          <meta property="fc:frame:button:4" content="${goalData.completed ? 'Completed' : 'Complete'}" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/reviewing" />
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