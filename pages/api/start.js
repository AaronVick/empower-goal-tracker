import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  let error = null;

  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const buttonIndex = parseInt(untrustedData.buttonIndex);
    const inputText = untrustedData.inputText || '';
    const fid = untrustedData.fid;

    console.log('Received FID:', fid);
    console.log('Received button index:', buttonIndex);
    console.log('Received input text:', inputText);

    if (!fid) {
      console.error('FID not provided');
      return res.status(400).json({ error: 'FID is required' });
    }

    try {
      console.log('Attempting to fetch/initialize session for FID:', fid);
      const sessionRef = db.collection('sessions').doc(fid.toString());
      const sessionSnapshot = await sessionRef.get();
      let sessionData = sessionSnapshot.exists ? sessionSnapshot.data() : { fid, currentStep: 'start' };

      console.log('Current session data:', sessionData);

      // Handle navigation and inputs
      if (sessionData.currentStep === 'start') {
        if (buttonIndex === 2 && inputText.trim()) {
          sessionData.goal = inputText.trim();
          sessionData.currentStep = 'startDate';
          console.log('Moving to startDate step');
        } else if (buttonIndex === 2) {
          error = 'no_goal';
          console.log('Error: No goal provided');
        }
      } else if (sessionData.currentStep === 'startDate') {
        if (buttonIndex === 2 && isValidDateFormat(inputText)) {
          sessionData.startDate = inputText;
          sessionData.currentStep = 'endDate';
          console.log('Moving to endDate step');
        } else if (buttonIndex === 2) {
          error = 'invalid_start_date';
          console.log('Error: Invalid start date format');
        } else if (buttonIndex === 1) {
          sessionData.currentStep = 'start';
          console.log('Moving back to start step');
        }
      } else if (sessionData.currentStep === 'endDate') {
        if (buttonIndex === 2 && isValidDateFormat(inputText)) {
          sessionData.endDate = inputText;
          sessionData.currentStep = 'review';
          console.log('Moving to review step');
        } else if (buttonIndex === 2) {
          error = 'invalid_end_date';
          console.log('Error: Invalid end date format');
        } else if (buttonIndex === 1) {
          sessionData.currentStep = 'startDate';
          console.log('Moving back to startDate step');
        }
      } else if (sessionData.currentStep === 'review') {
        if (buttonIndex === 2) {
          sessionData.currentStep = 'success';
          console.log('Moving to success step');
        } else if (buttonIndex === 1) {
          sessionData.currentStep = 'endDate';
          console.log('Moving back to endDate step');
        }
      }

      if (error) {
        sessionData.currentStep = 'error';
        console.log('Setting error state:', error);
      }

      console.log('Updated session data:', sessionData);

      // Update session data in Firebase
      await sessionRef.set(sessionData);
      console.log('Session data updated in Firebase');

      const html = generateHtml(sessionData, baseUrl, error);
      console.log('Generated HTML:', html);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (firebaseError) {
      console.error('Error updating session in Firebase:', firebaseError);
      return res.status(500).json({ error: 'Failed to update session', details: firebaseError.message });
    }
  } else if (req.method === 'GET') {
    const html = generateHtml({ currentStep: 'start' }, baseUrl);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function generateHtml(sessionData, baseUrl, error) {
  let imageUrl, inputTextContent, button1Content, button2Content;

  if (error) {
    imageUrl = `${baseUrl}/api/og?error=${encodeURIComponent(error)}&step=${encodeURIComponent(sessionData.currentStep)}`;
    inputTextContent = "Error occurred, please try again.";
    button1Content = "Home";
    button2Content = "Retry";
  } else {
    switch (sessionData.currentStep) {
      case 'start':
        imageUrl = `${baseUrl}/api/og?step=start`;
        inputTextContent = sessionData.goal || "Enter your goal";
        button1Content = "Cancel";
        button2Content = "Next";
        break;
      case 'startDate':
        imageUrl = `${baseUrl}/api/og?step=startDate`;
        inputTextContent = sessionData.startDate || "Enter the start date (dd/mm/yyyy)";
        button1Content = "Back";
        button2Content = "Next";
        break;
      case 'endDate':
        imageUrl = `${baseUrl}/api/og?step=endDate`;
        inputTextContent = sessionData.endDate || "Enter the end date (dd/mm/yyyy)";
        button1Content = "Back";
        button2Content = "Next";
        break;
      case 'review':
        const goal = encodeURIComponent(sessionData.goal);
        const startDate = encodeURIComponent(sessionData.startDate);
        const endDate = encodeURIComponent(sessionData.endDate);
        imageUrl = `${baseUrl}/api/ogReview?goal=${goal}&startDate=${startDate}&endDate=${endDate}`;
        inputTextContent = null; // No input needed for review step
        button1Content = "Back";
        button2Content = "Set Goal";
        break;
      case 'success':
        imageUrl = `${baseUrl}/api/successImage`;
        inputTextContent = null; // No input needed for success step
        button1Content = "Home";
        button2Content = "Share";
        break;
      default:
        imageUrl = `${baseUrl}/api/og?step=unknown`;
        inputTextContent = "Unknown step.";
        button1Content = "Cancel";
        button2Content = "Retry";
    }
  }

  return `
<!DOCTYPE html>
<html>
  <head>
    <title>Goal Tracker</title>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    ${inputTextContent !== null ? `<meta property="fc:frame:input:text" content="${inputTextContent}" />` : ''}
    <meta property="fc:frame:button:1" content="${button1Content}" />
    <meta property="fc:frame:button:2" content="${button2Content}" />
    <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
  </head>
  <body>
    <p>This is a Farcaster Frame for the Goal Tracker app.</p>
  </body>
</html>`;
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