import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed - Start Step');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const buttonIndex = parseInt(untrustedData.buttonIndex);
    const inputText = untrustedData.inputText || '';
    const fid = untrustedData.fid;

    console.log('Received FID:', fid);
    console.log('Received button index:', buttonIndex);
    console.log('Received input text:', inputText);

    if (!fid) {
      console.error('FID not provided');
      return res.status(400).json({ error: 'FID is required' });
    }

    try {
      const sessionRef = db.collection('sessions').doc(fid.toString());
      const sessionSnapshot = await sessionRef.get();
      let sessionData = sessionSnapshot.exists ? sessionSnapshot.data() : { fid, currentStep: 'start' };

      // Reset error state
      sessionData.error = null;

      if (buttonIndex === 2) {
        if (inputText.trim()) {
          sessionData.goal = inputText.trim();
          sessionData.currentStep = 'startDate';
          await sessionRef.set(sessionData);
          console.log('Moving to startDate step');

          // Return metatags for the startDate frame
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${baseUrl}/api/og?step=startDate" />
              <meta property="fc:frame:input:text" content="Enter Start Date dd/mm/yyyy" />
              <meta property="fc:frame:button:1" content="Back" />
              <meta property="fc:frame:button:2" content="Next" />
              <meta property="fc:frame:post_url" content="${baseUrl}/api/startDate" />
            </head>
            <body>
              <p>Goal Tracker - Start Date</p>
            </body>
            </html>
          `;
          return res.status(200).send(html);
        } else {
          console.log('Error: No goal provided');
          sessionData.error = 'no_goal';
        }
      }

      // If an error occurs or it's the initial load
      await sessionRef.set(sessionData);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/og?step=start" />
          <meta property="fc:frame:input:text" content="${sessionData.goal || 'Enter your goal'}" />
          <meta property="fc:frame:button:1" content="Cancel" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
        </head>
        <body>
          <p>Goal Tracker - Set your goal</p>
        </body>
        </html>
      `;
      return res.status(200).send(html);
    } catch (error) {
      console.error('Error in start step:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else if (req.method === 'GET') {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/og?step=start" />
        <meta property="fc:frame:input:text" content="Enter your goal" />
        <meta property="fc:frame:button:1" content="Cancel" />
        <meta property="fc:frame:button:2" content="Next" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
      </head>
      <body>
        <p>Goal Tracker - Set your goal</p>
      </body>
      </html>
    `;
    return res.status(200).send(html);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
