export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const { inputText: startDate, state } = req.body;
  const { goal } = JSON.parse(state || '{}');

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${basePath}/addGoal.png" />
      <meta property="fc:frame:input:text" content="Enter end date (dd/mm/yyyy)" />
      <meta property="fc:frame:button:1" content="Previous" />
      <meta property="fc:frame:post_url:1" content="${basePath}/api/step2" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta property="fc:frame:post_url:2" content="${basePath}/api/review" />
      <meta property="fc:frame:state" content="${JSON.stringify({ goal, startDate })}" />
    </head>
    <body>
      <h1>Enter End Date for: ${goal}</h1>
    </body>
    </html>
  `);
}