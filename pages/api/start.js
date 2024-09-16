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

      console.log('Current session data:', sessionData);

      if (buttonIndex === 2 && inputText.trim()) {
        // User clicked Next, goal provided
        sessionData.goal = inputText.trim();
        sessionData.currentStep = 'startDate';  // Set the next step
        console.log('Moving to startDate step');
        await sessionRef.set(sessionData);  // Update session in Firebase

        // Redirect to the startDate frame
        return res.redirect(307, `${baseUrl}/api/startDate`);
      } else if (buttonIndex === 2) {
        // If the goal is not provided, show an error
        console.log('Error: No goal provided');
        sessionData.error = 'no_goal';
      }

      console.log('Updated session data:', sessionData);
      await sessionRef.set(sessionData);

      // Render the current frame with error if needed
      const html = generateHtml('start', sessionData, baseUrl, sessionData.error);
      console.log('Generated HTML:', html);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      console.error('Error in start step:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    const html = generateHtml('start', { currentStep: 'start' }, baseUrl);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
