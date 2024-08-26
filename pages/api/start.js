export default function handler(req, res) {
  console.log('Goal Tracker API accessed');
  console.log('Request Method:', req.method);
  console.log('Full Request Body:', JSON.stringify(req.body, null, 2));
  console.log('Query Parameters:', JSON.stringify(req.query, null, 2));

  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  console.log('Base URL:', baseUrl);

  let currentStep = process.env.stepGoal || null;
  let error = null;
  console.log('Initial Current Step:', currentStep);

  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const buttonIndex = parseInt(untrustedData.buttonIndex);
    const inputText = untrustedData.inputText || '';

    console.log('Untrusted Data:', JSON.stringify(untrustedData, null, 2));
    console.log('Button Index:', buttonIndex);
    console.log('Input Text:', inputText);

    if (currentStep === null || currentStep === 'start') {
      console.log('Processing START step');
      if (buttonIndex === 2) {
        if (inputText.trim()) {
          console.log('Valid goal entered:', inputText);
          process.env.userSetGoal = inputText;
          process.env.stepGoal = '2';
          currentStep = '2';
        } else {
          console.log('No goal entered, showing error');
          error = 'no_goal';
          currentStep = 'start';
        }
      }
    } else if (currentStep === '2') {
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
        } else {
          console.log('Invalid start date, showing error');
          error = 'invalid_start_date';
          currentStep = '2';
        }
      }
    } else if (currentStep === '3') {
      if (buttonIndex === 1) {
        console.log('Previous button clicked, returning to Step 2');
        process.env.stepGoal = '2';
        currentStep = '2';
      } else if (buttonIndex === 2) {
        if (isValidDateFormat(inputText)) {
          console.log('Valid end date entered:', inputText);
          process.env.userEndDate = inputText;
          process.env.stepGoal = 'results';
          currentStep = 'results';
        } else {
          console.log('Invalid end date, showing error');
          error = 'invalid_end_date';
          currentStep = '3';
        }
      }
    } else if (currentStep === 'error') {
      // Handle "Try Again" button click
      currentStep = process.env.lastStep || 'start';
      process.env.stepGoal = currentStep;
      error = null;
    }
  }

  if (error) {
    process.env.lastStep = currentStep;
    currentStep = 'error';
  }

  console.log('Final Current Step:', currentStep);
  console.log('Error:', error);
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
    imageUrl = `${baseUrl}/api/og?error=${error}`;
    button1Content = "Try Again";
    button2Content = "";
    inputTextContent = "";
    inputValue = "";
  } else {
    // Use the same PNG for all non-error states
    imageUrl = `${baseUrl}/addGoal.png`;
    
    if (step === null || step === 'start') {
      inputTextContent = "Enter your goal";
      button1Content = "Home";
      button2Content = "Next";
      inputValue = process.env.userSetGoal || "";
    } else if (step === '2') {
      inputTextContent = "Enter start date (dd/mm/yyyy)";
      button1Content = "Previous";
      button2Content = "Next";
      inputValue = process.env.userStartDate || "";
    } else if (step === '3') {
      inputTextContent = "Enter end date (dd/mm/yyyy)";
      button1Content = "Previous";
      button2Content = "Set Goal";
      inputValue = process.env.userEndDate || "";
    } else if (step === 'results') {
      inputTextContent = "Goal set successfully!";
      button1Content = "New Goal";
      button2Content = "Share";
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