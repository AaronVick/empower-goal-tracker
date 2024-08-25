export default function handler(req, res) {
  console.log('Step 2 API accessed');
  console.log('Full request body:', JSON.stringify(req.body, null, 2));

  const trustedData = req.body.trustedData || {};
  const untrustedData = req.body.untrustedData || {};

  console.log('Trusted Data:', JSON.stringify(trustedData, null, 2));
  console.log('Untrusted Data:', JSON.stringify(untrustedData, null, 2));

  const buttonIndex = trustedData.buttonIndex || untrustedData.buttonIndex;
  const inputText = untrustedData.inputText || '';

  console.log('Received Button Index:', buttonIndex);
  console.log('Input Text:', inputText);

  // Get goal from state or query parameter
  const state = JSON.parse(untrustedData.state || '{}');
  const goal = state.goal || req.query.goal || 'No goal specified';

  console.log('Goal:', goal);

  const baseUrl = 'https://empower-goal-tracker.vercel.app';

  let nextUrl = `${baseUrl}/api/step2`;
  let imageUrl = `${baseUrl}/api/image?step=step2`;
  let inputTextContent = 'Enter start date (dd/mm/yyyy)';

  // Determine action based on input rather than buttonIndex
  if (inputText.toLowerCase() === 'prev') {
    console.log('Previous action detected via input');
    nextUrl = `${baseUrl}/api/start`;
    imageUrl = `${baseUrl}/api/image?step=start`;
  } else if (inputText && inputText.toLowerCase() !== 'next') {
    console.log('Date input detected, moving to step 3');
    nextUrl = `${baseUrl}/api/step3`;
    imageUrl = `${baseUrl}/api/image?step=step3`;
    state.startDate = inputText;
  } else {
    console.log('Staying on step 2');
    if (buttonIndex === 2) {
      inputTextContent = 'Please enter a valid date';
    }
  }

  console.log(`Action taken: ${nextUrl}`);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:input:text" content="${inputTextContent}" />
        <meta property="fc:frame:button:1" content="Previous" />
        <meta property="fc:frame:button:2" content="Next" />
        <meta property="fc:frame:post_url" content="${nextUrl}" />
        <meta property="fc:frame:state" content="${encodeURIComponent(JSON.stringify(state))}" />
      </head>
    </html>
  `;

  console.log('Sending HTML:', html);

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}