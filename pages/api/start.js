import { db } from '../../lib/firebase';
import { generateHtml } from './utils';

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

      if (buttonIndex === 2 && inputText.trim()) {
        sessionData.goal = inputText.trim();
        sessionData.currentStep = 'startDate';
        sessionData.error = null;
        await sessionRef.set(sessionData);
        console.log('Moving to startDate step');
        const html = generateHtml('startDate', sessionData, baseUrl);
        console.log('Generated HTML:', html);
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
      } else if (buttonIndex === 2) {
        console.log('Error: No goal provided');
        sessionData.error = 'no_goal';
      }

      await sessionRef.set(sessionData);

      const html = generateHtml('start', sessionData, baseUrl, sessionData.error);
      console.log('Generated HTML:', html);
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    } catch (error) {
      console.error('Error in start step:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  } else if (req.method === 'GET') {
    const html = generateHtml('start', { currentStep: 'start' }, baseUrl);
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}