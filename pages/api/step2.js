export default function handler(req, res) {
  try {
    console.log('Step 2 API accessed');
    console.log('Request Body:', req.body);

    const buttonIndex = req.body.untrustedData?.buttonIndex;
    const goal = req.body.untrustedData?.inputText || 'No goal specified';

    console.log('Button Clicked:', buttonIndex);
    console.log('Goal:', goal);

    const baseUrl = 'https://empower-goal-tracker.vercel.app';

    // Check which button was clicked and direct accordingly
    let postUrl;
    if (buttonIndex === 1) {
      postUrl = `${baseUrl}/api/start?goal=${encodeURIComponent(goal)}`;
    } else if (buttonIndex === 2) {
      postUrl = `${baseUrl}/api/step3?goal=${encodeURIComponent(goal)}`;
    } else {
      // Handle unexpected cases
      postUrl = `${baseUrl}/api/error?message=Unexpected button index: ${buttonIndex}`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step2" />
          <meta property="fc:frame:input:text" content="Enter start date (dd/mm/yyyy)" />
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/start?goal=${encodeURIComponent(goal)}" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/step3?goal=${encodeURIComponent(goal)}" />
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
