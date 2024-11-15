import { db } from '../../lib/firebase';
import { isValidDateFormat } from './utils';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed - End Date Step');
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
      let sessionData = sessionSnapshot.exists ? sessionSnapshot.data() : { fid, currentStep: 'endDate' };

      if (buttonIndex === 2) {
        if (isValidDateFormat(inputText)) {
          sessionData.endDate = inputText;
          sessionData.currentStep = 'review';  // Move to review step
          sessionData.error = null;
          await sessionRef.set(sessionData);

          // Redirect to the review page
          return res.redirect(307, `${baseUrl}/api/reviewGoals?fid=${fid}`);
        } else {
          console.log('Error: Invalid end date format');
          sessionData.error = 'invalid_end_date';
        }
      } else if (buttonIndex === 1) {
        sessionData.currentStep = 'startDate';
        await sessionRef.set(sessionData);
        return res.redirect(307, `${baseUrl}/api/startDate`);
      }

      // Show empty input for end date if it's not set
      await sessionRef.set(sessionData);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/og?step=endDate" />
          <meta property="fc:frame:input:text" content="${sessionData.endDate || 'Enter End Date dd/mm/yyyy'}" />
          <meta property="fc:frame:button:1" content="Back" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/endDate" />
        </head>
        <body>
          <p>Goal Tracker - End Date</p>
        </body>
        </html>
      `;
      return res.status(200).send(html);
    } catch (error) {
      console.error('Error in endDate step:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
