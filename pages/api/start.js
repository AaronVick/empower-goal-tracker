import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  let currentStep = 'start';
  let error = null;

  if (req.method === 'POST') {
    const { untrustedData } = req.body;
    const buttonIndex = parseInt(untrustedData.buttonIndex);
    const inputText = untrustedData.inputText || '';
    const fid = untrustedData.fid || req.query.fid;

    console.log('Received FID:', fid);

    if (!fid) {
      console.error('FID not provided');
      return res.status(400).json({ error: 'FID is required' });
    }

    try {
      console.log('Attempting to fetch/initialize session for FID:', fid);
      const sessionRef = db.collection('sessions').doc(fid.toString());
      const sessionSnapshot = await sessionRef.get();
      let sessionData = sessionSnapshot.exists ? sessionSnapshot.data() : { fid, currentStep, stepGoal: 'start' };

      console.log('Current session data:', sessionData);

      // Handle navigation and inputs
      if (sessionData.stepGoal === 'start') {
        if (buttonIndex === 2 && inputText.trim()) {
          sessionData.goal = inputText;
          sessionData.stepGoal = '2';
        } else if (buttonIndex === 2) {
          error = 'no_goal';
        }
      } else if (sessionData.stepGoal === '2') {
        if (buttonIndex === 2 && isValidDateFormat(inputText)) {
          sessionData.startDate = inputText;
          sessionData.stepGoal = '3';
        } else if (buttonIndex === 2) {
          error = 'invalid_start_date';
        } else if (buttonIndex === 1) {
          sessionData.stepGoal = 'start';
        }
      } else if (sessionData.stepGoal === '3') {
        if (buttonIndex === 2 && isValidDateFormat(inputText)) {
          sessionData.endDate = inputText;
          sessionData.stepGoal = 'review';
        } else if (buttonIndex === 2) {
          error = 'invalid_end_date';
        } else if (buttonIndex === 1) {
          sessionData.stepGoal = '2';
        }
      } else if (sessionData.stepGoal === 'review') {
        if (buttonIndex === 2) {
          // Here you would typically save the goal to Firebase
          sessionData.stepGoal = 'success';
        } else if (buttonIndex === 1) {
          sessionData.stepGoal = '3';
        }
      }

      if (error) {
        sessionData.stepGoal = 'error';
      }

      console.log('Updated session data:', sessionData);

      // Update session data in Firebase
      await sessionRef.set(sessionData);

      const html = generateHtml(sessionData, baseUrl, error);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (firebaseError) {
      console.error('Error updating session in Firebase:', firebaseError);
      return res.status(500).json({ error: 'Failed to update session', details: firebaseError.message });
    }
  } else if (req.method === 'GET') {
    // Handle GET request for initial frame
    const html = generateHtml({ stepGoal: 'start' }, baseUrl);
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function generateHtml(sessionData, baseUrl, error) {
  let imageUrl, inputTextContent, button1Content, button2Content, postUrl;

  postUrl = `${baseUrl}/api/start`;

  if (error) {
    imageUrl = `${baseUrl}/api/og?error=${error}&step=${sessionData.stepGoal}`;
    inputTextContent = "Error occurred, please try again.";
    button1Content = "Home";
    button2Content = "Retry";
  } else if (sessionData.stepGoal === 'start') {
    imageUrl = `${baseUrl}/api/og?step=start`;
    inputTextContent = "Enter your goal";
    button1Content = "Cancel";
    button2Content = "Next";
  } else if (sessionData.stepGoal === '2') {
    imageUrl = `${baseUrl}/api/og?step=2`;
    inputTextContent = "Enter the start date (dd/mm/yyyy)";
    button1Content = "Back";
    button2Content = "Next";
  } else if (sessionData.stepGoal === '3') {
    imageUrl = `${baseUrl}/api/og?step=3`;
    inputTextContent = "Enter the end date (dd/mm/yyyy)";
    button1Content = "Back";
    button2Content = "Next";
  } else if (sessionData.stepGoal === 'review') {
    const goal = encodeURIComponent(sessionData.goal);
    const startDate = encodeURIComponent(sessionData.startDate);
    const endDate = encodeURIComponent(sessionData.endDate);
    imageUrl = `${baseUrl}/api/ogReview?goal=${goal}&startDate=${startDate}&endDate=${endDate}`;
    button1Content = "Back";
    button2Content = "Set Goal";
  } else if (sessionData.stepGoal === 'success') {
    imageUrl = `${baseUrl}/api/successImage`;
    button1Content = "Home";
    button2Content = "Share";
    postUrl = `${baseUrl}/api/share`;
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
      <meta property="fc:frame:post_url" content="${postUrl}" />
    </head>
    <body>
      <p>This is a Farcaster Frame for the Goal Tracker app.</p>
    </body>
  </html>
`;
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