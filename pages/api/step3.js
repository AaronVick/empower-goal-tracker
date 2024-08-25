export default function handler(req, res) {
  try {
    console.log('Step 3 API accessed');
    console.log('Request Body:', req.body);

    // Correctly accessing the button index and input text from untrustedData
    const buttonIndex = req.body.untrustedData.buttonIndex;
    console.log('Button Clicked:', buttonIndex);

    const baseUrl = 'https://empower-goal-tracker.vercel.app';
    const startDate = req.body.untrustedData.inputText || 'No date specified';

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
  } catch (error) {
    console.error('Error in Step 3 API:', error);
    res.status(500).send('Internal Server Error');
  }
}
