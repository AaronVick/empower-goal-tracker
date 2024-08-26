export default function handler(req, res) {
  console.log('Goal Tracker API accessed');
  console.log('Request Method:', req.method);
  console.log('Full Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Query Parameters:', JSON.stringify(req.query, null, 2));

  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  console.log('Base URL:', baseUrl);

  // Retrieve the current step from the environment variable, default to 'start' if null
  let currentStep = process.env.stepGoal || 'start';
  console.log('Current Step (from env):', currentStep);

  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const buttonIndex = parseInt(untrustedData.buttonIndex);
    const inputText = untrustedData.inputText || '';

    console.log('Untrusted Data:', JSON.stringify(untrustedData, null, 2));
    console.log('Button Index:', buttonIndex);
    console.log('Input Text:', inputText);

    // Handle step transitions
    if (currentStep === 'start') {
      console.log('Processing START step');
      if (buttonIndex === 1) {
        console.log('Home button clicked, returning to Index');
        return res.redirect(baseUrl);
      } else if (buttonIndex === 2) {
        if (inputText.trim()) {
          console.log('Valid goal entered:', inputText);
          process.env.userSetGoal = inputText;
          process.env.stepGoal = '2';
          currentStep = '2';
          console.log('Moving to Step 2');
        } else {
          console.log('No valid goal entered, staying on START step');
          process.env.stepGoal = 'start';
        }
      }
    } else if (currentStep === '2') {
      console.log('Processing Step 2');
      if (buttonIndex === 1) {
        console.log('Previous button clicked, returning to START');
        process.env.stepGoal = 'start';
        currentStep = 'start';
      } else if (buttonIndex === 2) {
        if (isValidDateFormat(inputText)) {
          console.log('Valid start date entered:', inputText);
          process.env.userStartDate = inputText;
          process.env.stepGoal = '3';
          currentStep = '3';
          console.log('Moving to Step 3');
        } else {
          console.log('Invalid date format, staying on Step 2');
        }
      }
    } else if (currentStep === '3') {
      console.log('Processing Step 3');
      if (buttonIndex === 1) {
        console.log('Previous button clicked, returning to Step 2');
        process.env.stepGoal = '2';
        currentStep = '2';
      } else if (buttonIndex === 2) {
        if (isValidDateFormat(inputText)) {
          console.log('Valid end date entered:', inputText);
          process.env.userEndDate = inputText;
          console.log('Redirecting to results page');
          return res.redirect(`${baseUrl}/api/results`);
        } else {
          console.log('Invalid date format, staying on Step 3');
        }
      }
    }
  } else if (req.method !== 'GET') {
    console.log('Invalid HTTP method:', req.method);
    return res.status(405).send('Method Not Allowed');
  }

  console.log('Generating HTML for step:', currentStep);
  const html = generateHtml(currentStep, baseUrl);
  
  console.log('Sending HTML response');
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}

function generateHtml(step, baseUrl) {
  console.log('Generating HTML for step:', step);
  
  let imageUrl, inputTextContent, button1Content, button2Content;

  if (step === 'start') {
    imageUrl = `${baseUrl}/api/image?step=start`;
    inputTextContent = "Enter your goal";
    button1Content = "Home";
    button2Content = "Next";
  } else if (step === '2') {
    imageUrl = `${baseUrl}/api/image?step=step2`;
    inputTextContent = "Enter start date (dd/mm/yyyy)";
    button1Content = "Previous";
    button2Content = "Next";
  } else if (step === '3') {
    imageUrl = `${baseUrl}/api/image?step=step3`;
    inputTextContent = "Enter end date (dd/mm/yyyy)";
    button1Content = "Previous";
    button2Content = "Set Goal";
  }

  console.log('Image URL:', imageUrl);
  console.log('Input Text Content:', inputTextContent);
  console.log('Button 1 Content:', button1Content);
  console.log('Button 2 Content:', button2Content);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:input:text" content="${inputTextContent}" />
        <meta property="fc:frame:button:1" content="${button1Content}" />
        <meta property="fc:frame:button:2" content="${button2Content}" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
      </head>
    </html>
  `;

  console.log('Generated HTML:', html);
  return html;
}

function isValidDateFormat(dateString) {
  console.log('Validating date format:', dateString);
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(dateString)) {
    console.log('Date format validation failed');
    return false;
  }

  const [day, month, year] = dateString.split('/');
  const date = new Date(year, month - 1, day);
  const isValid = date.getDate() == day && date.getMonth() == month - 1 && date.getFullYear() == year;
  console.log('Date validity:', isValid);
  return isValid;
}