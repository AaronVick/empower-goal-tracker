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
        // Validate end date and proceed
        if (isValidDateFormat(inputText)) {
          sessionData.endDate = inputText;
          sessionData.currentStep = 'review'; // Move to the review step
          sessionData.error = null;
          await sessionRef.set(sessionData);

          // Redirect to review step
          return res.redirect(307, `${baseUrl}/api/review`);
        } else {
          sessionData.error = 'invalid_end_date';
        }
      } else if (buttonIndex === 1) {
        // Back button - return to startDate
        sessionData.currentStep = 'startDate';
        await sessionRef.set(sessionData);
        return res.redirect(307, `${baseUrl}/api/startDate`);
      }

      // If there was an error or an initial load
      await sessionRef.set(sessionData);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/og?step=endDate" />
          <meta property="fc:frame:input:text" content="${sessionData.endDate || 'Enter the end date (dd/mm/yyyy)'}" />
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
    res.status(405).json({ error: 'Method not allowed' });
  }
}
