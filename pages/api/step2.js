export default function handler(req, res) {
  console.log('Step 2 API accessed');
  console.log('Full request body:', JSON.stringify(req.body, null, 2));

  // Access both trusted and untrusted data
  const trustedData = req.body.trustedData || {};
  const untrustedData = req.body.untrustedData || {};

  console.log('Trusted Data:', JSON.stringify(trustedData, null, 2));
  console.log('Untrusted Data:', JSON.stringify(untrustedData, null, 2));

  // Try to get button index from both trusted and untrusted data
  const buttonIndex = trustedData.buttonIndex || untrustedData.buttonIndex;
  const inputText = untrustedData.inputText || '';

  console.log('Button Index:', buttonIndex);
  console.log('Input Text:', inputText);

  // Get goal from state or query parameter
  const state = JSON.parse(untrustedData.state || '{}');
  const goal = state.goal || req.query.goal || 'No goal specified';

  console.log('Goal:', goal);

  const baseUrl = 'https://empower-goal-tracker.vercel.app';

  let nextUrl = `${baseUrl}/api/step2`;
  let imageUrl = `${baseUrl}/api/image?step=step2`;
  let inputTextContent = 'Enter start date (dd/mm/yyyy)';

  if (buttonIndex === 1) {
    console.log('Previous button detected');
    nextUrl = `${baseUrl}/api/start`;
    imageUrl = `${baseUrl}/api/image?step=start`;
  } else if (buttonIndex === 2) {
    console.log('Next button detected');
    if (inputText) {
      console.log('Input provided, moving to step 3');
      nextUrl = `${baseUrl}/api/step3`;
      imageUrl = `${baseUrl}/api/image?step=step3`;
      state.startDate = inputText;
    } else {
      console.log('No input provided, staying on step 2');
      inputTextContent = 'Please enter a valid date';
    }
  } else {
    console.log('No button detected or unexpected button index');
  }

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