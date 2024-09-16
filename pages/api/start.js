import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  
  if (req.method === 'GET' || req.method === 'POST') {
    let currentStep = process.env.stepGoal || 'start';
    let error = null;
    let untrustedData, buttonIndex, inputText, fid;

    if (req.method === 'POST') {
      ({ untrustedData } = req.body);
      buttonIndex = parseInt(untrustedData.buttonIndex);
      inputText = untrustedData.inputText || '';
      fid = untrustedData.fid;
    } else {
      ({ buttonIndex, inputText, fid } = req.query);
      buttonIndex = parseInt(buttonIndex || '0');
    }

    // Fetch session for current user
    const sessionRef = await db.collection('sessions').doc(fid).get();
    let sessionData = sessionRef.exists ? sessionRef.data() : { fid, currentStep, stepGoal: 'start' };

    if (currentStep === 'error') {
      currentStep = sessionData.stepGoal;
      error = null;
    } else if (currentStep === 'start') {
      if (buttonIndex === 2 && inputText.trim()) {
        sessionData.goal = inputText;
        sessionData.stepGoal = '2';
      } else {
        error = 'no_goal';
        sessionData.stepGoal = 'start';
      }
    } else if (currentStep === '2' && buttonIndex === 2) {
      if (isValidDateFormat(inputText)) {
        sessionData.startDate = inputText;
        sessionData.stepGoal = '3';
      } else {
        error = 'invalid_start_date';
        sessionData.stepGoal = '2';
      }
    } else if (currentStep === '3' && buttonIndex === 2) {
      if (isValidDateFormat(inputText)) {
        sessionData.endDate = inputText;
        sessionData.stepGoal = 'review';
      } else {
        error = 'invalid_end_date';
        sessionData.stepGoal = '3';
      }
    }

    // Update session data in Firebase
    await db.collection('sessions').doc(fid).set(sessionData);

    if (error) {
      currentStep = 'error';
    }

    const html = generateHtml(sessionData, baseUrl, error);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function generateHtml(sessionData, baseUrl, error) {
  let imageUrl, inputTextContent, button1Content, button2Content;

  if (error) {
    imageUrl = `${baseUrl}/api/og?error=${error}&step=${sessionData.stepGoal}`;
  } else if (sessionData.stepGoal === 'review') {
    const goal = encodeURIComponent(sessionData.goal);
    const startDate = encodeURIComponent(sessionData.startDate);
    const endDate = encodeURIComponent(sessionData.endDate);
    imageUrl = `${baseUrl}/api/ogReview?goal=${goal}&startDate=${startDate}&endDate=${endDate}`;
  } else {
    imageUrl = `${baseUrl}/api/og?step=${sessionData.stepGoal}`;
  }

  if (sessionData.stepGoal === 'start') {
    inputTextContent = 'Enter your goal';
    button1Content = 'Cancel';
    button2Content = 'Next';
  } else if (sessionData.stepGoal === '2') {
    inputTextContent = 'Enter start date (DD/MM/YYYY)';
    button1Content = 'Back';
    button2Content = 'Next';
  } else if (sessionData.stepGoal === '3') {
    inputTextContent = 'Enter end date (DD/MM/YYYY)';
    button1Content = 'Back';
    button2Content = 'Next';
  } else if (sessionData.stepGoal === 'review') {
    button1Content = 'Edit';
    button2Content = 'Set Goal';
  }
  
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