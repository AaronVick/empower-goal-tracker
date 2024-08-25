export default function handler(req, res) {
  try {
    console.log('Step 2 API accessed');
    console.log('Full Request:', req);  // Log the entire request object
    console.log('Request Body:', req.body);  // Log the request body

    // Attempt to log the clicked button index
    const buttonIndex = req.body['fc:frame:button:index'];
    console.log('Button Clicked:', buttonIndex);

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
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/start" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/step3" />
        </head>
        <body>
          <h1>Enter Start Date for: ${goal}</h1>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error in Step 2 API:', error);
    res.status(500).send('Internal Server Error');
  }
}
