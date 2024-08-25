export default function handler(req, res) {
  console.log('Step 2 API accessed');
  console.log('Raw request body:', req.body);

  const trustedData = req.body.trustedData || {};
  const untrustedData = req.body.untrustedData || {};

  console.log('Trusted Data:', trustedData);
  console.log('Untrusted Data:', untrustedData);

  // Log raw button indices before parsing
  console.log('Raw Trusted Button Index:', trustedData.buttonIndex);
  console.log('Raw Untrusted Button Index:', untrustedData.buttonIndex);

  // Attempt to get button index from multiple sources
  const trustedButtonIndex = parseInt(trustedData.buttonIndex);
  const untrustedButtonIndex = parseInt(untrustedData.buttonIndex);
  const inputText = untrustedData.inputText || '';

  console.log('Parsed Trusted Button Index:', trustedButtonIndex);
  console.log('Parsed Untrusted Button Index:', untrustedButtonIndex);
  console.log('Input Text:', inputText);

  // Determine the action based on available data
  const action = determineAction(trustedButtonIndex, untrustedButtonIndex, inputText);
  console.log('Determined Action:', action);

  // Get goal from state or query parameter
  const state = JSON.parse(untrustedData.state || '{}');
  const goal = state.goal || req.query.goal || 'No goal specified';

  console.log('Goal:', goal);
  console.log('Current State:', state);

  const baseUrl = 'https://empower-goal-tracker.vercel.app';

  let nextUrl = `${baseUrl}/api/step2`;
  let imageUrl = `${baseUrl}/api/image?step=step2`;
  let inputTextContent = 'Enter start date (dd/mm/yyyy)';

  if (action === 'previous') {
    console.log('Action: Going back to start');
    nextUrl = `${baseUrl}/api/start`;
    imageUrl = `${baseUrl}/api/image?step=start`;
  } else if (action === 'next') {
    if (isValidDateFormat(inputText)) {
      console.log('Action: Moving to step 3 with valid date');
      nextUrl = `${baseUrl}/api/step3`;
      imageUrl = `${baseUrl}/api/image?step=step3&date=${encodeURIComponent(inputText)}`;
      state.startDate = inputText;
    } else {
      console.log('Action: Staying on step 2 due to invalid date');
      inputTextContent = 'Please enter a valid date (dd/mm/yyyy)';
      imageUrl = `${baseUrl}/api/image?step=step2&error=invalid_date`;
    }
  } else {
    console.log('Action: No action taken, staying on step 2');
    if (inputText && !isValidDateFormat(inputText)) {
      imageUrl = `${baseUrl}/api/image?step=step2&error=invalid_date`;
    }
  }

  console.log('Next URL:', nextUrl);
  console.log('Image URL:', imageUrl);
  console.log('Input Text Content:', inputTextContent);

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

function determineAction(trustedButtonIndex, untrustedButtonIndex, inputText) {
  console.log('Determining action:');
  console.log('- Trusted Button Index:', trustedButtonIndex);
  console.log('- Untrusted Button Index:', untrustedButtonIndex);
  console.log('- Input Text:', inputText);

  if (trustedButtonIndex === 1 || untrustedButtonIndex === 1) {
    console.log('Action determined: previous');
    return 'previous';
  } else if (trustedButtonIndex === 2 || untrustedButtonIndex === 2) {
    console.log('Action determined: next');
    return 'next';
  } else if (inputText) {
    console.log('Action determined: next (based on input presence)');
    return 'next';
  }
  console.log('Action determined: none');
  return 'none';
}

function isValidDateFormat(dateString) {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  const isValidFormat = regex.test(dateString);
  console.log(`Date validation for "${dateString}": ${isValidFormat}`);
  
  if (!isValidFormat) return false;

  const [day, month, year] = dateString.split('/');
  const date = new Date(year, month - 1, day);
  const isValidDate = date.getDate() == day && date.getMonth() == month - 1 && date.getFullYear() == year;
  console.log(`Date validity check for "${dateString}": ${isValidDate}`);
  
  return isValidDate;
}