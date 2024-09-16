import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  
  if (req.method === 'GET' || req.method === 'POST') {
    let currentStep = 'start';
    let error = null;
    let untrustedData, buttonIndex, inputText, fid;

    // Added logging for debugging
    console.log('Request Method:', req.method);

    if (req.method === 'POST') {
      ({ untrustedData } = req.body);
      buttonIndex = parseInt(untrustedData.buttonIndex);
      inputText = untrustedData.inputText || '';
      fid = untrustedData.fid;
      console.log('POST Request - Button Index:', buttonIndex, 'Input Text:', inputText);
    } else {
      ({ buttonIndex, inputText, fid } = req.query);
      buttonIndex = parseInt(buttonIndex || '0');
      console.log('GET Request - Button Index:', buttonIndex, 'Input Text:', inputText);
    }

    // Fetch session for current user
    const sessionRef = await db.collection('sessions').doc(fid).get();
    let sessionData = sessionRef.exists ? sessionRef.data() : { fid, currentStep, stepGoal: 'start' };

    currentStep = sessionData.stepGoal || 'start';
    console.log('Current Step:', currentStep);

    if (currentStep === 'error') {
      currentStep = sessionData.stepGoal;
      error = null;
    } else if (currentStep === 'start') {
      if (buttonIndex === 2 && inputText.trim()) {
        sessionData.goal = inputText;
        sessionData.stepGoal = '2';
        currentStep = '2';
        console.log('Goal Set - Moving to Step 2');
      } else if (buttonIndex === 2) {
        error = 'no_goal';
        console.log('Error: No goal entered');
      }
    } else if (currentStep === '2') {
      if (buttonIndex === 2 && isValidDateFormat(inputText)) {
        sessionData.startDate = inputText;
        sessionData.stepGoal = '3';
        currentStep = '3';
        console.log('Start Date Set - Moving to Step 3');
      } else if (buttonIndex === 2) {
        error = 'invalid_start_date';
        console.log('Error: Invalid start date');
      } else if (buttonIndex === 1) {
        sessionData.stepGoal = 'start';
        currentStep = 'start';
      }
    } else if (currentStep === '3') {
      if (buttonIndex === 2 && isValidDateFormat(inputText)) {
        sessionData.endDate = inputText;
        sessionData.stepGoal = 'review';
        currentStep = 'review';
        console.log('End Date Set - Moving to Review');
      } else if (buttonIndex === 2) {
        error = 'invalid_end_date';
        console.log('Error: Invalid end date');
      } else if (buttonIndex === 1) {
        sessionData.stepGoal = '2';
        currentStep = '2';
      }
    }

    // Update session data in Firebase
    await db.collection('sessions').doc(fid).set(sessionData);

    if (error) {
      currentStep = 'error';
    }

    const html = generateHtml(sessionData, baseUrl, error, currentStep);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function generateHtml(sessionData, baseUrl, error, currentStep) {
  let imageUrl, inputTextContent, button1Content, button2Content;

  if (error) {
    imageUrl = `${baseUrl}/api/og?error=${error}&step=${currentStep}`;
  } else if (currentStep === 'review') {
    const goal = encodeURIComponent(sessionData.goal);
    const startDate = encodeURIComponent(sessionData.startDate);
    const endDate = encodeURIComponent(sessionData.endDate);
    imageUrl = `${baseUrl}/api/ogReview?goal=${goal}&startDate=${startDate}&endDate=${endDate}`;
  } else {
    imageUrl = `${baseUrl}/api/og?step=${currentStep}`;
  }

  if (currentStep === 'start') {
    inputTextContent = 'Enter your goal';
    button1Content = 'Cancel';
    button2Content = 'Next';
  } else if (currentStep === '2') {
    inputTextContent = 'Enter start date (DD/MM/YYYY)';
    button1Content = 'Back';
    button2Content = 'Next';
  } else if (currentStep === '3') {
    inputTextContent = 'Enter end date (DD/MM/YYYY)';
    button1Content = 'Back';
    button2Content = 'Next';
  } else if (currentStep === 'review') {
    button1Content = 'Edit';
    button2Content = 'Set Goal';
  }

  // Added debugging to see what HTML is generated
  console.log('Generated HTML for currentStep:', currentStep);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        ${inputTextContent ? `<meta property="fc:frame:input:text" content="${inputTextContent}" />` : ''}
        <meta property="fc:frame:button:1" content="${button1Content}" />
        <meta property="fc:frame:button:2" content="${button2Content}" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
      </head>
    </html>
  `;
}

function isValidDateFormat(dateString) {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  return regex.test(dateString);
}
