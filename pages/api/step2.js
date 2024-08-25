export default function handler(req, res) {
  try {
    console.log('Step 2 API accessed');
    console.log('Request Body:', req.body);

    // Initialize buttonIndex to null and goal from inputText
    let buttonIndex = req.body.untrustedData?.buttonIndex || null;
    const goal = req.body.untrustedData?.inputText || 'No goal specified';
    const enteredDate = req.body.untrustedData?.inputText || '';

    // Log the received button index and input text for debugging
    console.log('Captured Button Index:', buttonIndex);
    console.log('Goal:', goal);
    console.log('Entered Date:', enteredDate);

    const baseUrl = 'https://empower-goal-tracker.vercel.app';

    // If buttonIndex is still null or incorrectly set, reset or reassign based on fallback logic
    if (buttonIndex !== 1 && buttonIndex !== 2) {
      // Assign based on expected navigation, defaulting to start if neither is set correctly
      if (req.query.error) {
        buttonIndex = 2; // Redirect to same step if there was an error
      } else {
        buttonIndex = 1; // Default to button 1 if it's misaligned
      }
    }

    // Determine where to send the user based on the button index
    let postUrl;
    if (!enteredDate && buttonIndex === 2) {
      // Redirect to step2 with an error if no date was entered and "Next" was clicked
      postUrl = `${baseUrl}/api/step2?error=Please enter a valid date&goal=${encodeURIComponent(goal)}`;
    } else if (buttonIndex === 1) {
      // "Previous" button clicked
      postUrl = `${baseUrl}/api/start?goal=${encodeURIComponent(goal)}`;
    } else if (buttonIndex === 2) {
      // "Next" button clicked
      postUrl = `${baseUrl}/api/step3?goal=${encodeURIComponent(goal)}`;
    }

    // Construct the response HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step2" />
          <meta property="fc:frame:input:text" content="Enter start date (dd/mm/yyyy)" placeholder="Enter a valid start date" />
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

    // Send the response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

    // Log the final state of the button index
    console.log('Final Button Index after response:', buttonIndex);

  } catch (error) {
    console.error('Error in Step 2 API:', error);
    res.status(500).send('Internal Server Error');
  }
}
