import { db } from '../../lib/firebase';
import { generateHtml, isValidDateFormat } from './utils';

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

      if (buttonIndex === 2 && isValidDateFormat(inputText)) {
        sessionData.endDate = inputText;
        sessionData.currentStep = 'review';
        await sessionRef.set(sessionData);
        console.log('Moving to review step');
        return res.redirect(307, `${baseUrl}/api/review`);
      } else if (buttonIndex === 2) {
        console.log('Error: Invalid end date format');
        sessionData.error = 'invalid_end_date';
      } else if (buttonIndex === 1) {
        sessionData.currentStep = 'startDate';
        await sessionRef.set(sessionData);
        console.log('Moving back to startDate step');
        return res.redirect(307, `${baseUrl}/api/startDate`);
      }

      console.log('Updated session data:', sessionData);
      await sessionRef.set(sessionData);

      const html = generateHtml('endDate', sessionData, baseUrl, sessionData.error);
      console.log('Generated HTML:', html);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      console.error('Error in endDate step:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}