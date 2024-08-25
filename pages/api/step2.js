export default function handler(req, res) {
  try {
    const baseUrl = 'https://empower-goal-tracker.vercel.app';
    const goal = req.body.inputText || 'No goal specified';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step2" />
          <meta property="fc:frame:input:text" content="Enter start date (dd/mm/yyyy)" />
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/step3" />
        </head>
        <body>
          <h1>Enter Start Date for: ${goal}</h1>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in Step 2 API:', error);  // Logging error if something goes wrong
    res.status(500).send('Internal Server Error');
  }
}
