export default function handler(req, res) {
  const baseUrl = 'https://empower-goal-tracker.vercel.app';
  const startDate = req.body.inputText || 'No date specified';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step3" />
        <meta property="fc:frame:input:text" content="Enter end date (dd/mm/yyyy)" />
        <meta property="fc:frame:button:1" content="Previous" />
        <meta property="fc:frame:post_url:1" content="${baseUrl}/api/step2" />
        <meta property="fc:frame:button:2" content="Next" />
        <meta property="fc:frame:post_url:2" content="${baseUrl}/api/review" />
      </head>
      <body>
        <h1>Enter End Date</h1>
        <p>Start date: ${startDate}</p>
      </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}