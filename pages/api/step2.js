export default function handler(req, res) {
  try {
    console.log('Step 2 API accessed');
    console.log('Full Request Body:', JSON.stringify(req.body, null, 2));
    console.log('Full Query Params:', JSON.stringify(req.query, null, 2));

    const buttonIndex = req.body.untrustedData?.buttonIndex;
    const inputText = req.body.untrustedData?.inputText || '';
    const goal = req.query.goal || req.body.untrustedData?.inputText || 'No goal specified';

    console.log('Captured Button Index (raw):', buttonIndex);
    console.log('Captured Button Index (type):', typeof buttonIndex);
    console.log('Input Text:', inputText);
    console.log('Goal:', goal);

    const baseUrl = 'https://empower-goal-tracker.vercel.app';

    let nextStep = `${baseUrl}/api/step2?goal=${encodeURIComponent(goal)}&debug=true`;

    if (buttonIndex === 1 || buttonIndex === '1') {
      console.log('Previous button detected');
      nextStep = `${baseUrl}/api/start?goal=${encodeURIComponent(goal)}`;
    } else if (buttonIndex === 2 || buttonIndex === '2') {
      console.log('Next button detected');
      if (!inputText) {
        nextStep = `${baseUrl}/api/step2?error=Please enter a valid date&goal=${encodeURIComponent(goal)}`;
      } else {
        nextStep = `${baseUrl}/api/step3?goal=${encodeURIComponent(goal)}&startDate=${encodeURIComponent(inputText)}`;
      }
    } else {
      console.log('Unexpected button index:', buttonIndex);
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step2&debug=${Date.now()}" />
          <meta property="fc:frame:input:text" content="Enter start date (dd/mm/yyyy)" />
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url" content="${nextStep}" />
        </head>
        <body>
          <h1>Debug: Step 2 - Enter Start Date for: ${goal}</h1>
          <p>Button Index: ${buttonIndex}</p>
          <p>Input Text: ${inputText}</p>
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