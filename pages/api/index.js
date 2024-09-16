import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  console.log('API route accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const buttonIndex = parseInt(untrustedData.buttonIndex);
    const fid = untrustedData.fid;

    if (buttonIndex === 1) {
      // "Start a Goal" was clicked
      console.log('Start a Goal button clicked');

      // Initialize a session for the user
      await db.collection('sessions').doc(fid.toString()).set({
        stepGoal: 'start',
        fid: fid
      });

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/og?step=start" />
          <meta property="fc:frame:input:text" content="" />
          <meta property="fc:frame:button:1" content="Cancel" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
        </head>
        </html>
      `);
    } else if (buttonIndex === 2) {
      // "Review Goals" was clicked
      console.log('Review Goals button clicked');
      return res.redirect(302, `${baseUrl}/api/reviewGoals?fid=${fid}`);
    }
  }

  // If it's not a POST request or an unhandled button, return the default frame
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${baseUrl}/empower.png" />
      <meta property="fc:frame:button:1" content="Start a Goal" />
      <meta property="fc:frame:button:2" content="Review Goals" />
      <meta property="fc:frame:post_url" content="${baseUrl}/api" />
    </head>
    </html>
  `);
}