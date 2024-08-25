export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fullBasePath = `https://empower-goal-tracker.vercel.app${basePath}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${fullBasePath}/empower.png" />
      <meta property="fc:frame:button:1" content="Start a Goal" />
      <meta property="fc:frame:post_url" content="${fullBasePath}/api/step2" />
      <meta property="fc:frame:button:2" content="Review Goals" />
      <meta property="fc:frame:post_url:2" content="${fullBasePath}/api/reviewGoals" />
    </head>
    <body>
      <h1>Welcome to Empower Goal Tracker</h1>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}