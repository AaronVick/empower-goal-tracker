export default function handler(req, res) {
    console.log('API handler accessed');
    console.log('Request method:', req.method);
  
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  
    if (req.method === 'POST') {
      console.log('POST request received');
      console.log('Request body:', req.body);
  
      const buttonIndex = req.body?.untrustedData?.buttonIndex;
      const fid = req.body?.untrustedData?.fid;
  
      console.log('Button index:', buttonIndex);
      console.log('FID:', fid);
  
      if (buttonIndex === 1) {
        console.log('Redirecting to start goal');
        res.redirect(303, `${baseUrl}/api/start`);
      } else if (buttonIndex === 2) {
        console.log('Redirecting to review goals');
        res.redirect(303, `${baseUrl}/api/reviewGoals?fid=${fid}`);
      } else {
        console.log('Invalid button index');
        res.status(400).json({ error: 'Invalid button index' });
      }
    } else {
      console.log('Method not allowed');
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }