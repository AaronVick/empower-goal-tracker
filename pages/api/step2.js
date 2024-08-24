export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const { inputText: goal, trustedData } = req.body;

  // Get current date in dd/mm/yyyy format
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
  const yyyy = today.getFullYear();
  const currentDate = `${dd}/${mm}/${yyyy}`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${basePath}/addGoal.png" />
      <meta property="fc:frame:input:text" content="Enter start date (dd/mm/yyyy)" />
      <meta property="fc:frame:button:1" content="Previous" />
      <meta property="fc:frame:post_url:1" content="${basePath}/api/start" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta property="fc:frame:post_url:2" content="${basePath}/api/step3" />
      <meta property="fc:frame:state" content="${JSON.stringify({ goal, currentDate })}" />
    </head>
    <body>
      <h1>Enter Start Date for: ${goal}</h1>
      <p>Current date: ${currentDate}</p>
      <p>Please enter a date from today onwards.</p>
    </body>
    </html>
  `);
}