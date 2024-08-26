export default function handler(req, res) {
  console.log('Goal Tracker API accessed');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  // Retrieve the current step from the environment variable
  let currentStep = process.env.stepGoal || 'start';
  
  // Initialize variables
  let nextUrl = `${baseUrl}/api/start`; // Default to start
  let imageUrl = `${baseUrl}/api/image?step=${currentStep}`;
  let inputTextContent = '';
  let inputText = '';

  // Handle POST requests for transitions
  if (req.method === 'POST') {
    const untrustedData = req.body.untrustedData || {};
    inputText = untrustedData.inputText || '';
    const buttonIndex = parseInt(untrustedData.buttonIndex);

    console.log('Current Step:', currentStep);
    console.log('Button Index:', buttonIndex);
    console.log('Input Text:', inputText);

    if (currentStep === 'start' && buttonIndex === 2) {
      if (inputText) {
        process.env.userSetGoal = inputText;  // Store the goal in the environment variable
        process.env.stepGoal = '2';  // Move to step 2
        currentStep = 'step2';
      } else {
        inputTextContent = 'Please enter your goal';
      }
    } else if (currentStep === 'step2' && buttonIndex === 2) {
      if (isValidDateFormat(inputText)) {
        process.env.userStartDate = inputText;  // Store the start date in the environment variable
        process.env.stepGoal = '3';  // Move to step 3
        currentStep = 'step3';
      } else {
        inputTextContent = 'Please enter a valid start date (dd/mm/yyyy)';
      }
    } else if (currentStep === 'step3' && buttonIndex === 2) {
      if (isValidDateFormat(inputText)) {
        process.env.userEndDate = inputText;  // Store the end date in the environment variable
        nextUrl = `${baseUrl}/api/results`;  // Move to results
      } else {
        inputTextContent = 'Please enter a valid end date (dd/mm/yyyy)';
      }
    } else if (buttonIndex === 1) {
      console.log('Returning to Start');
      process.env.stepGoal = 'start';  // Reset to start
      currentStep = 'start';
    }
  } else if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // Set up meta tags for the current step
  let metaTags = '';
  if (currentStep === 'start') {
    metaTags = `
      <meta property="fc:frame:image" content="${baseUrl}/api/image?step=start" />
      <meta property="fc:frame:input:text" content="Enter your goal" />
      <meta property="fc:frame:button:1" content="Home" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta property="fc:frame:post_url:1" content="${baseUrl}" />
      <meta property="fc:frame:post_url:2" content="${baseUrl}/api/start" />
    `;
  } else if (currentStep === 'step2') {
    metaTags = `
      <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step2" />
      <meta property="fc:frame:input:text" content="Enter start date (dd/mm/yyyy)" />
      <meta property="fc:frame:button:1" content="Home" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta property="fc:frame:post_url:1" content="${baseUrl}/api/start" />
      <meta property="fc:frame:post_url:2" content="${baseUrl}/api/start" />
    `;
  } else if (currentStep === 'step3') {
    metaTags = `
      <meta property="fc:frame:image" content="${baseUrl}/api/image?step=step3" />
      <meta property="fc:frame:input:text" content="Enter end date (dd/mm/yyyy)" />
      <meta property="fc:frame:button:1" content="Home" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta property="fc:frame:post_url:1" content="${baseUrl}/api/start" />
      <meta property="fc:frame:post_url:2" content="${baseUrl}/api/start" />
    `;
  }

  // Return the HTML with meta tags
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

// Function to validate the date format
function isValidDateFormat(dateString) {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(dateString)) return false;

  const [day, month, year] = dateString.split('/');
  const date = new Date(year, month - 1, day);
  return date.getDate() == day && date.getMonth() == month - 1 && date.getFullYear() == year;
}
