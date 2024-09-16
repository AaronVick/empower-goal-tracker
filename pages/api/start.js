import { db } from '../../lib/firebase';
import { generateHtml } from './utils';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed - Start Step');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const buttonIndex = parseInt(untrustedData.buttonIndex);
    const fid = untrustedData.fid;

    console.log('Received FID:', fid);
    console.log('Received button index:', buttonIndex);

    if (!fid) {
      console.error('FID not provided');
      return res.status(400).json({ error: 'FID is required' });
    }

    try {
      const sessionRef = db.collection('sessions').doc(fid.toString());
      const sessionSnapshot = await sessionRef.get();

      let sessionData;

      // If there's an existing session but we're starting a new instance, reset the session
      if (sessionSnapshot.exists) {
        console.log('Resetting existing session for FID:', fid);
        sessionData = { fid, currentStep: 'start', goal: '', error: null };  // Reset session data
      } else {
        console.log('Starting new session for FID:', fid);
        sessionData = { fid, currentStep: 'start', goal: '', error: null };  // New session data
      }

      console.log('Starting new session or resetting session:', sessionData);
      await sessionRef.set(sessionData);  // Save new session data

      // Handle the "Start a Goal" step
      if (buttonIndex === 2) {
        console.log('Moving to goal entry step');
        return res.redirect(307, `${baseUrl}/api/start`);
      }

      // Render the start frame (asking for a goal)
      const html = generateHtml('start', sessionData, baseUrl);
      console.log('Generated HTML:', html);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      console.error('Error in start step:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    const html = generateHtml('start', { currentStep: 'start', goal: '' }, baseUrl);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
