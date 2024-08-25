export default function handler(req, res) {
  try {
    console.log('Step 2 API accessed');
    console.log('Request Body:', req.body);

    // Reset the buttonIndex at the start of this frame
    let buttonIndex = req.body.untrustedData?.buttonIndex || null;
    console.log('Initial Button Index:', buttonIndex);

    const goal = req.body.untrustedData?.inputText || 'No goal specified';
    const enteredDate = req.body.untrustedData?.inputText || '';

    // Placeholder text for the date input field
    const placeholderText = 'Enter a valid start date (dd/mm/yyyy)';

    console.log('Goal:', goal);
    console.log('Entered Date:', enteredDate);

    const baseUrl = 'https://empower-goal-tracker.vercel.app';

    // Check if the user tried to proceed without entering a date
    let postUrl;
    if (!enteredDate && buttonIndex === 2) {
      // Redirect to this same step with an error placeholder
      postUrl = `${baseUrl}/api/step2?error=Please enter a valid date&goal=${encodeURIComponent(goal)}`;
    } else if (buttonIndex === 1) {
      postUrl = `${baseUrl}/api/start?goal=${encodeURIComponent(goal)}`;
    } else if (buttonIndex === 2) {
      postUrl = `${baseUrl}/api/step3?goal=${encodeURIComponent(goal)}`;
    } else {
      // Handle unexpected cases
      postUrl = `${baseUrl}/api/error?message=Unexpected button index: ${buttonIndex}`;
    }

    // Construct the response HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step2" />
          <meta property="fc:frame:input:text" content="Enter start date (dd/mm/yyyy)" placeholder="${placeholderText}" />
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api/start?goal=${encodeURIComponent(goal)}" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:post_url:2" content="${postUrl}" />
        </head>
        <body>
          <h1>Enter Start Date for: ${goal}</h1>
        </body>
      </html>
    `;

    // Reset the button index before sending the response
    buttonIndex = null;
    console.log('Button Index Reset:', buttonIndex);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    console.error('Error in Step 2 API:', error);
    res.status(500).send('Internal Server Error');
  }
}
