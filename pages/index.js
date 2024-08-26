export default function Home() {
  const baseUrl = 'https://empower-goal-tracker.vercel.app';

  return (
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/api/image`} />
        <meta property="fc:frame:button:1" content="Start a Goal" />
        <meta property="fc:frame:post_url" content={`${baseUrl}/api/start`} />
        <meta property="fc:frame:button:2" content="Review Goals" />
        <meta property="fc:frame:post_url:2" content={`${baseUrl}/api/reviewGoals`} />
      </head>
      <body>
        <h1>Welcome to Empower Goal Tracker</h1>
      </body>
    </html>
  );
}

export async function handler(req, res) {
  console.log('Index handler accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const buttonIndex = untrustedData?.buttonIndex;

    console.log('Button clicked:', buttonIndex);

    if (buttonIndex === 1) {
      console.log('Redirecting to Start a Goal');
      return res.redirect(303, `${process.env.NEXT_PUBLIC_BASE_PATH}/api/start`);
    } else if (buttonIndex === 2) {
      console.log('Redirecting to Review Goals');
      // Assuming you need to pass the FID, you would get it from untrustedData
      const fid = untrustedData?.fid;
      return res.redirect(303, `${process.env.NEXT_PUBLIC_BASE_PATH}/api/reviewGoals?fid=${fid}`);
    }
  }

  // If it's not a POST request or no button was clicked, just render the frame
  const html = Home().props.children;
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}

export const config = {
  runtime: 'edge',
};