export default function handler(req, res) {
  console.log('Goal Tracker API accessed');
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  let currentStep = req.query.step || 'start'; // Determine the current step
  let nextUrl = `${baseUrl}/api/goalTracker?step=${currentStep}`;
  let imageUrl = `${baseUrl}/api/image?step=${currentStep}`;
  let inputTextContent = '';
  let inputText = '';

  if (req.method === 'POST') {
    console.log('Handling POST request');
    const trustedData = req.body.trustedData || {};
    const untrustedData = req.body.untrustedData || {};
    
    const buttonIndex = parseInt(trustedData.buttonIndex || untrustedData.buttonIndex);
    inputText = untrustedData.inputText || '';
  
    console.log('Received Button Index:', buttonIndex);
    console.log('Input Text:', inputText);

    if (currentStep === 'start') {
      if (buttonIndex === 1 && inputText) {
        console.log('Proceeding to Step 2');
        process.env.userSetGoal = inputText;  // Store the goal in the environment variable
        currentStep = 'step2';
        nextUrl = `${baseUrl}/api/goalTracker?step=${currentStep}`;
      } else {
        inputTextContent = 'Please enter your goal';
      }
    } else if (currentStep === 'step2') {
      if (buttonIndex === 1) {
        console.log('Returning to Start');
        currentStep = 'start';
        nextUrl = `${baseUrl}/api/goalTracker?step=${currentStep}`;
      } else if (buttonIndex === 2 && isValidDateFormat(inputText)) {
        console.log('Proceeding to Step 3');
        process.env.userStartDate = inputText;  // Store the start date in the environment variable
        currentStep = 'step3';
        nextUrl = `${baseUrl}/api/goalTracker?step=${currentStep}`;
      } else {
        inputTextContent = 'Please enter a valid start date (dd/mm/yyyy)';
      }
    } else if (currentStep === 'step3') {
      if (buttonIndex === 1) {
        console.log('Returning to Step 2');
        currentStep = 'step2';
        nextUrl = `${baseUrl}/api/goalTracker?step=${currentStep}`;
      } else if (buttonIndex === 2 && isValidDateFormat(inputText)) {
        console.log('Proceeding to Results');
        process.env.userEndDate = inputText;  // Store the end date in the environment variable
        nextUrl = `${baseUrl}/api/results`;
      } else {
        inputTextContent = 'Please enter a valid end date (dd/mm/yyyy)';
      }
    }
  } else if (req.method === 'GET') {
    console.log('Handling GET request');
    // Here we can manage initial frame loading without input
    if (currentStep === 'start') {
      inputTextContent = 'Enter your goal';
    } else if (currentStep === 'step2') {
      inputTextContent = 'Enter start date (dd/mm/yyyy)';
    } else if (currentStep === 'step3') {
      inputTextContent = 'Enter end date (dd/mm/yyyy)';
    }
  } else {
    return res.status(405).send('Method Not Allowed');
  }

  // Determine the appropriate meta tags based on the current step
  let metaTags = '';
  if (currentStep === 'start') {
    metaTags = `
      <meta property="fc:frame:image" content="${baseUrl}/api/image?step=start" />
      <meta property="fc:frame:input:text" content="Enter your goal" />
      <meta property="fc:frame:button:1" content="Next" />
      <meta property="fc:frame:post_url" content="${nextUrl}" />
    `;
  } else if (currentStep === 'step2') {
    metaTags = `
      <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step2" />
      <meta property="fc:frame:input:text" content="Enter start date (dd/mm/yyyy)" />
      <meta property="fc:frame:button:1" content="Previous" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta property="fc:frame:post_url:1" content="${baseUrl}/api/goalTracker?step=start" />
      <meta property="fc:frame:post_url:2" content="${nextUrl}" />
    `;
  } else if (currentStep === 'step3') {
    metaTags = `
      <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step3" />
      <meta property="fc:frame:input:text" content="Enter end date (dd/mm/yyyy)" />
      <meta property="fc:frame:button:1" content="Previous" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta property="fc:frame:post_url:1" content="${baseUrl}/api/goalTracker?step=step2" />
      <meta property="fc:frame:post_url:2" content="${nextUrl}" />
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        ${metaTags}
      </head>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}

function isValidDateFormat(dateString) {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/');
  const date = new Date(year, month - 1, day);
  return date.getDate() == day && date.getMonth() == month - 1 && date.getFullYear() == year;
}
