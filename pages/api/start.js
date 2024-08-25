export default function handler(req, res) {
  const baseUrl = 'https://empower-goal-tracker.vercel.app';

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${baseUrl}/api/image?name=addGoal" />
      <meta property="fc:frame:input:text" content="Enter your goal" />
      <meta property="fc:frame:button:1" content="Next" />
      <meta property="fc:frame:post_url" content="${baseUrl}/api/step2" />
    </head>
    <body>
      <h1>Enter Your Goal</h1>
    </body>
    </html>
  `);
}