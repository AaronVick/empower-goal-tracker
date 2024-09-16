import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  let currentStep = 'start';
  let error = null;
  let sessionData = null;

  if (req.method === 'POST' || req.method === 'GET') {
    const fid = req.query.fid || req.body?.untrustedData?.fid;

    // Fetch session for current user (if any)
    const sessionRef = await db.collection('sessions').doc(fid.toString()).get();
    sessionData = sessionRef.exists ? sessionRef.data() : { fid, currentStep: 'start' };

    // If currentStep exists in sessionData, use it, otherwise assume 'start'
    currentStep = sessionData.currentStep || 'start';

    if (req.method === 'POST') {
      const { untrustedData } = req.body;
      const buttonIndex = parseInt(untrustedData.buttonIndex || '0');
      const inputText = untrustedData.inputText || '';

      // Handle Cancel button (buttonIndex === 1 for Cancel)
      if (currentStep === 'start' && buttonIndex === 1) {
        console.log('Cancel button clicked, redirecting to home');
        return res.redirect(302, `${baseUrl}/api`); // Redirect to home
      }

      // Update steps based on button index and input
      if (currentStep === 'start' && buttonIndex === 2 && inputText.trim()) {
        sessionData.goal = inputText;
        sessionData.currentStep = 'date';
      } else if (currentStep === 'date' && buttonIndex === 2 && isValidDateFormat(inputText)) {
        sessionData.startDate = inputText;
        sessionData.currentStep = 'endDate';
      } else if (currentStep === 'endDate' && buttonIndex === 2 && isValidDateFormat(inputText)) {
        sessionData.endDate = inputText;
        sessionData.currentStep = 'review';
      } else {
        error = currentStep === 'start' ? 'no_goal' : 'invalid_date';
      }
    }

    console.log('Session data:', sessionData);

    // Save session back to Firebase
    await db.collection('sessions').doc(fid.toString()).set(sessionData);

    // Generate the HTML response
    const html = generateHtml(sessionData, baseUrl, error, sessionData.currentStep);
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
    inputTextContent = sessionData.goal || '';
    button1Content = 'Cancel'; // Cancel button content
    button2Content = 'Next';
  } else if (currentStep === 'date') {
    inputTextContent = sessionData.startDate || '';
    button1Content = 'Back';
    button2Content = 'Next';
  } else if (currentStep === 'endDate') {
    inputTextContent = sessionData.endDate || '';
    button1Content = 'Back';
    button2Content = 'Next';
  } else if (currentStep === 'review') {
    button1Content = 'Edit';
    button2Content = 'Set Goal';
  }
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        ${currentStep !== 'review' ? `<meta property="fc:frame:input:text" content="${inputTextContent}" />` : ''}
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
