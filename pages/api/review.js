import { db } from '../../lib/firebase';
import { generateHtml } from './utils';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed - Review Step');
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
      let sessionData = sessionSnapshot.exists ? sessionSnapshot.data() : { fid, currentStep: 'review' };

      if (buttonIndex === 2) {
        // User clicked Next to set the goal
        sessionData.currentStep = 'setGoal';  // Move to setGoal step
        await sessionRef.set(sessionData);
        console.log('Moving to setGoal step');
        return res.redirect(307, `${baseUrl}/api/setGoal`);
      } else if (buttonIndex === 1) {
        // User clicked Back to edit the endDate step
        sessionData.currentStep = 'endDate';
        await sessionRef.set(sessionData);
        console.log('Moving back to endDate step');
        return res.redirect(307, `${baseUrl}/api/endDate`);
      }

      console.log('Updated session data:', sessionData);
      await sessionRef.set(sessionData);

      const html = generateHtml('review', sessionData, baseUrl);
      console.log('Generated HTML:', html);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      console.error('Error in review step:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
