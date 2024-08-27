export default function handler(req, res) {
  console.log('Goal Tracker API accessed');
  console.log('Request Method:', req.method);
  console.log('Full Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Query Parameters:', JSON.stringify(req.query, null, 2));

  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  console.log('Base URL:', baseUrl);

  let currentStep = process.env.stepGoal || 'start';
  let error = null;
  console.log('Initial Current Step:', currentStep);

  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const buttonIndex = parseInt(untrustedData.buttonIndex);
    const inputText = untrustedData.inputText || '';

    console.log('Untrusted Data:', JSON.stringify(untrustedData, null, 2));
    console.log('Button Index:', buttonIndex);
    console.log('Input Text:', inputText);

    if (currentStep === 'error') {
      currentStep = process.env.stepGoal;
      error = null;
    } else if (currentStep === 'start') {
      if (buttonIndex === 2) {
        if (inputText.trim()) {
          console.log('Valid goal entered:', inputText);
          process.env.userSetGoal = inputText;
          process.env.stepGoal = '2';
          currentStep = '2';
        } else {
          console.log('No goal entered, showing error');
          error = 'no_goal';
          process.env.stepGoal = 'start';
        }
      }
    } else if (currentStep === '2') {
      if (buttonIndex === 1) {
        process.env.stepGoal = 'start';
        currentStep = 'start';
      } else if (buttonIndex === 2) {
        if (isValidDateFormat(inputText)) {
          console.log('Valid start date entered:', inputText);
          process.env.userStartDate = inputText;
          process.env.stepGoal = '3';
          currentStep = '3';
        } else {
          console.log('Invalid start date, showing error');
          error = 'invalid_start_date';
          process.env.stepGoal = '2';
        }
      }
    } else if (currentStep === '3') {
      if (buttonIndex === 1) {
        process.env.stepGoal = '2';
        currentStep = '2';
      } else if (buttonIndex === 2) {
        if (isValidDateFormat(inputText)) {
          console.log('Valid end date entered:', inputText);
          process.env.userEndDate = inputText;
          process.env.stepGoal = 'review';
          currentStep = 'review';
        } else {
          console.log('Invalid end date, showing error');
          error = 'invalid_end_date';
          process.env.stepGoal = '3';
        }
      }
    } else if (currentStep === 'review') {
      if (buttonIndex === 1) {
        process.env.stepGoal = '3';
        currentStep = '3';
      } else if (buttonIndex === 2) {
        // Redirect to setGoal endpoint
        res.writeHead(302, {
          Location: `${baseUrl}/api/setGoal`,
        });
        res.end();
        return;
      }
    }
  }

  if (error) {
    currentStep = 'error';
  }

  console.log('Final Current Step:', currentStep);
  console.log('Error:', error);
  console.log('stepGoal:', process.env.stepGoal);
  const html = generateHtml(currentStep, baseUrl, error);

  console.log('Sending HTML response');
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}

function generateHtml(step, baseUrl, error) {
  console.log('Generating HTML for step:', step);
  console.log('Error:', error);

  let imageUrl, inputTextContent, button1Content, button2Content, inputValue;

  if (error) {
    imageUrl = `${baseUrl}/api/og?error=${error}&step=${process.env.stepGoal}`;
    button1Content = "Try Again";
    button2Content = "";
    inputTextContent = "";
    inputValue = "";
  } else {
    if (step === 'start') {
      imageUrl = `${baseUrl}/empower.png`;
      inputTextContent = "Enter your goal";
      button1Content = "Home";
      button2Content = "Next";
      inputValue = process.env.userSetGoal || "";
    } else if (step === '2') {
      imageUrl = `${baseUrl}/empower.png`;
      inputTextContent = "Enter start date (dd/mm/yyyy)";
      button1Content = "Previous";
      button2Content = "Next";
      inputValue = process.env.userStartDate || "";
    } else if (step === '3') {
      imageUrl = `${baseUrl}/empower.png`;
      inputTextContent = "Enter end date (dd/mm/yyyy)";
      button1Content = "Previous";
      button2Content = "Next";
      inputValue = process.env.userEndDate || "";
    } else if (step === 'review') {
      const goal = encodeURIComponent(process.env.userSetGoal || '');
      const startDate = encodeURIComponent(process.env.userStartDate || '');
      const endDate = encodeURIComponent(process.env.userEndDate || '');
      const timestamp = Date.now(); // Add this line
      imageUrl = `${baseUrl}/api/review?image=true&goal=${goal}&startDate=${startDate}&endDate=${endDate}&t=${timestamp}`; // Add &t=${timestamp} here
      button1Content = "Back";
      button2Content = "Set Goal";
      inputTextContent = "";
      inputValue = "";
    }
  }

  console.log('Image URL:', imageUrl);
  console.log('Input Text Content:', inputTextContent);
  console.log('Button 1 Content:', button1Content);
  console.log('Button 2 Content:', button2Content);
  console.log('Input Value:', inputValue);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        <meta property="fc:frame:input:text" content="${inputTextContent}" />
        <meta property="fc:frame:input:text:value" content="${inputValue}" />
        <meta property="fc:frame:button:1" content="${button1Content}" />
        ${button2Content ? `<meta property="fc:frame:button:2" content="${button2Content}" />` : ''}
        <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
        ${step === 'review' ? `<meta property="fc:frame:post_url:2" content="${baseUrl}/api/setGoal" />` : ''}
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