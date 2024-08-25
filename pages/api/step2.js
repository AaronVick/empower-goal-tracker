export default function handler(req, res) {
  console.log('Step 2 API accessed');  // Logging to confirm access to Step 2
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fullBaseUrl = `https://empower-goal-tracker.vercel.app${baseUrl}`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="https://empower-goal-tracker.vercel.app/addGoal.png"/>
      <meta property="fc:frame:input:text" content="Enter your goal end date (dd/mm/yyyy)" />
      <meta property="fc:frame:button:1" content="Next" />
      <meta property="fc:frame:post_url:2" content="${fullBaseUrl}/api/step3" />
    </head>
    <body>
      <h1>Enter Your Goal End Date</h1>
    </body>
    </html>
  `);
}
