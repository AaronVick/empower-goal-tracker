export default function handler(req, res) {
  console.log('Index handler accessed');
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
    console.log('GET request received, serving initial frame');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/image" />
          <meta property="fc:frame:button:1" content="Start a Goal" />
          <meta property="fc:frame:button:2" content="Review Goals" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api" />
        </head>
        <body>
          <h1>Welcome to Empower Goal Tracker</h1>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};