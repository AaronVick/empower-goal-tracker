export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fullBasePath = `https://empower-goal-tracker.vercel.app${basePath}`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${fullBasePath}/addGoal.png"/>
      <meta property="fc:frame:input:text" content="Enter your goal" />
      <meta property="fc:frame:button:1" content="Next" />
      <meta property="fc:frame:post_url" content="${fullBasePath}/api/step2" />
    </head>
    <body>
      <h1>Enter Your Goal</h1>
    </body>
    </html>
  `);
}