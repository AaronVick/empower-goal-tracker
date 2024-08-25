export default function handler(req, res) {
  console.log('Start API accessed');
  console.log('Full request body:', JSON.stringify(req.body, null, 2));
  console.log('Query parameters:', JSON.stringify(req.query, null, 2));

  const baseUrl = 'https://empower-goal-tracker.vercel.app';
  const previousGoal = req.query.goal || '';

  console.log('Previous goal:', previousGoal);

  const trustedData = req.body.trustedData || {};
  const untrustedData = req.body.untrustedData || {};

  console.log('Trusted Data:', JSON.stringify(trustedData, null, 2));
  console.log('Untrusted Data:', JSON.stringify(untrustedData, null, 2));

  // Log raw button indices
  console.log('Raw Trusted Button Index:', trustedData.buttonIndex);
  console.log('Raw Untrusted Button Index:', untrustedData.buttonIndex);

  // Attempt to get button index
  const buttonIndex = parseInt(trustedData.buttonIndex || untrustedData.buttonIndex);
  console.log('Parsed Button Index:', buttonIndex);

  const inputText = untrustedData.inputText || '';
  console.log('Input Text:', inputText);

  let nextUrl = `${baseUrl}/api/step2`;
  let imageUrl = `${baseUrl}/api/image?step=start`;
  
  if (buttonIndex === 2) {
    console.log('Home button clicked, going back to index');
    nextUrl = baseUrl;  // This will lead to the index.js in the pages directory
  } else if (buttonIndex === 1 || inputText) {
    console.log('Next button clicked or goal entered, proceeding to step2');
    nextUrl = `${baseUrl}/api/step2`;
    if (inputText) {
      nextUrl += `?goal=${encodeURIComponent(inputText)}`;
    }
  }

  console.log('Next URL:', nextUrl);
  console.log('Image URL:', imageUrl);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:input:text" content="Enter your goal" value="${previousGoal}" />
        <meta property="fc:frame:button:1" content="Next" />
        <meta property="fc:frame:button:2" content="Home" />
        <meta property="fc:frame:post_url" content="${nextUrl}" />
      </head>
    </html>
  `;

  console.log('Sending HTML:', html);

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}