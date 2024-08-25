export default function handler(req, res) {
  console.log('Step 2 API accessed');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const { buttonIndex, inputText } = req.body.untrustedData || {};
  const state = JSON.parse(req.body.untrustedData?.state || '{}');
  const goal = state.goal || 'No goal specified';

  console.log('Button Index:', buttonIndex);
  console.log('Input Text:', inputText);
  console.log('Goal:', goal);

  const baseUrl = 'https://empower-goal-tracker.vercel.app';

  let nextUrl;
  let imageUrl;
  let buttonText1 = 'Previous';
  let buttonText2 = 'Next';
  let inputTextContent = 'Enter start date (dd/mm/yyyy)';

  if (buttonIndex === 1) {
    // Go back to start
    nextUrl = `${baseUrl}/api/start`;
    imageUrl = `${baseUrl}/api/image?step=start`;
  } else if (buttonIndex === 2 && inputText) {
    // Proceed to step 3
    nextUrl = `${baseUrl}/api/step3`;
    imageUrl = `${baseUrl}/api/image?step=step3`;
    state.startDate = inputText;
  } else {
    // Stay on step 2
    nextUrl = `${baseUrl}/api/step2`;
    imageUrl = `${baseUrl}/api/image?step=step2`;
    if (buttonIndex === 2) {
      inputTextContent = 'Please enter a valid date';
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:input:text" content="${inputTextContent}" />
        <meta property="fc:frame:button:1" content="${buttonText1}" />
        <meta property="fc:frame:button:2" content="${buttonText2}" />
        <meta property="fc:frame:post_url" content="${nextUrl}" />
        <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify(state))}" />
      </head>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}