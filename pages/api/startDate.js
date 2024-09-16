import { db } from '../../lib/firebase';
import { isValidDateFormat } from './utils';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed - Start Date Step');
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
      let sessionData = sessionSnapshot.exists ? sessionSnapshot.data() : { fid, currentStep: 'startDate' };

      if (buttonIndex === 2) {
        if (isValidDateFormat(inputText)) {
          sessionData.startDate = inputText;
          sessionData.currentStep = 'endDate';
          sessionData.error = null;
          await sessionRef.set(sessionData);
          console.log('Moving to endDate step');

          // Return metatags for the endDate frame
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${baseUrl}/api/og?step=endDate" />
              <meta property="fc:frame:input:text" content="Enter the end date (dd/mm/yyyy)" />
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
        } else {
          console.log('Error: Invalid start date format');
          sessionData.error = 'invalid_start_date';
        }
      } else if (buttonIndex === 1) {
        sessionData.currentStep = 'start';
        await sessionRef.set(sessionData);
        console.log('Moving back to start step');
        return res.redirect(307, `${baseUrl}/api/start`);
      }

      await sessionRef.set(sessionData);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/og?step=startDate" />
          <meta property="fc:frame:input:text" content="${sessionData.startDate || 'Enter the start date (dd/mm/yyyy)'}" />
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
    } catch (error) {
      console.error('Error in startDate step:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
