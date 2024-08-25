export default function handler(req, res) {
  try {
    console.log('Step 2 API accessed');
    console.log('Request Body:', req.body);

    const buttonIndex = parseInt(req.body.untrustedData?.buttonIndex) || null;
    const inputText = req.body.untrustedData?.inputText || '';
    const goal = req.query.goal || inputText || 'No goal specified';

    console.log('Captured Button Index:', buttonIndex);
    console.log('Input Text:', inputText);
    console.log('Goal:', goal);

    const baseUrl = 'https://empower-goal-tracker.vercel.app';

    let nextStep;
    if (buttonIndex === 1) {
      // "Previous" button clicked
      nextStep = `${baseUrl}/api/start?goal=${encodeURIComponent(goal)}`;
    } else if (buttonIndex === 2) {
      // "Next" button clicked
      if (!inputText) {
        // No date entered, stay on step2 with an error
        nextStep = `${baseUrl}/api/step2?error=Please enter a valid date&goal=${encodeURIComponent(goal)}`;
      } else {
        // Proceed to step3
        nextStep = `${baseUrl}/api/step3?goal=${encodeURIComponent(goal)}&startDate=${encodeURIComponent(inputText)}`;
      }
    } else {
      // Default case: stay on step2
      nextStep = `${baseUrl}/api/step2?goal=${encodeURIComponent(goal)}`;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step2" />
          <meta property="fc:frame:input:text" content="Enter start date (dd/mm/yyyy)" />
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url" content="${nextStep}" />
        </head>
        <body>
          <h1>Enter Start Date for: ${goal}</h1>
          ${req.query.error ? `<p style="color: red;">${req.query.error}</p>` : ''}
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

    console.log('Next step URL:', nextStep);

  } catch (error) {
    console.error('Error in Step 2 API:', error);
    res.status(500).send('Internal Server Error');
  }
}