import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  console.log('Goal Tracker API accessed');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request query:', JSON.stringify(req.query, null, 2));

  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  
  if (req.method === 'GET' || req.method === 'POST') {
    let currentStep = 'start';
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
    const sessionRef = await db.collection('sessions').doc(fid.toString()).get();
    let sessionData = sessionRef.exists ? sessionRef.data() : { fid, currentStep: 'start' };

    currentStep = sessionData.currentStep || 'start';

    console.log('Current step:', currentStep);
    console.log('Session data:', sessionData);

    if (currentStep === 'start') {
      if (buttonIndex === 2 && inputText.trim()) {
        sessionData.goal = inputText;
        sessionData.currentStep = 'date';
        currentStep = 'date';
      } else if (buttonIndex === 2) {
        error = 'no_goal';
      }
    } else if (currentStep === 'date') {
      if (buttonIndex === 2 && isValidDateFormat(inputText)) {
        sessionData.startDate = inputText;
        sessionData.currentStep = 'endDate';
        currentStep = 'endDate';
      } else if (buttonIndex === 2) {
        error = 'invalid_start_date';
      } else if (buttonIndex === 1) {
        sessionData.currentStep = 'start';
        currentStep = 'start';
      }
    } else if (currentStep === 'endDate') {
      if (buttonIndex === 2 && isValidDateFormat(inputText)) {
        sessionData.endDate = inputText;
        sessionData.currentStep = 'review';
        currentStep = 'review';
      } else if (buttonIndex === 2) {
        error = 'invalid_end_date';
      } else if (buttonIndex === 1) {
        sessionData.currentStep = 'date';
        currentStep = 'date';
      }
    } else if (currentStep === 'review') {
      if (buttonIndex === 1) {
        // Edit button clicked, go back to start but keep the data
        sessionData.currentStep = 'start';
        currentStep = 'start';
      } else if (buttonIndex === 2) {
        // Set Goal button clicked, save the goal
        try {
          const goalRef = await db.collection('goals').add({
            user_id: fid,
            goal: sessionData.goal,
            startDate: Timestamp.fromDate(new Date(sessionData.startDate.split('/').reverse().join('-'))),
            endDate: Timestamp.fromDate(new Date(sessionData.endDate.split('/').reverse().join('-'))),
            createdAt: Timestamp.now(),
            completed: false,
          });

          const goalId = goalRef.id;
          console.log(`Goal successfully added with ID: ${goalId}`);

          // Clear the session data after successful goal creation
          await db.collection('sessions').doc(fid.toString()).delete();

          // Generate share link and return the completion frame
          const shareText = encodeURIComponent(`I set a new goal: "${sessionData.goal}"! Support me on my journey!\n\nFrame by @aaronv\n\n`);
          const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(`${baseUrl}/api/goalShare?id=${goalId}`)}`;
          
          const imageUrl = `${baseUrl}/api/ogComplete?goal=${encodeURIComponent(sessionData.goal)}`;

          return res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${imageUrl}" />
              <meta property="fc:frame:button:1" content="Home" />
              <meta property="fc:frame:post_url:1" content="${baseUrl}/api" />
              <meta property="fc:frame:button:2" content="Share" />
              <meta property="fc:frame:button:2:action" content="link" />
              <meta property="fc:frame:button:2:target" content="${shareLink}" />
            </head>
            </html>
          `);
        } catch (error) {
          console.error("Error setting goal:", error);
          return res.redirect(302, `${baseUrl}/api/error`);
        }
      }
    }

    // Update session data in Firebase
    await db.collection('sessions').doc(fid.toString()).set(sessionData);

    console.log('Updated session data:', sessionData);

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
    inputTextContent = sessionData.goal || '';
    button1Content = 'Cancel';
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
    inputTextContent = '';
    button1Content = 'Edit';
    button2Content = 'Set Goal';
  }
  
  return `
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
}

function isValidDateFormat(dateString) {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  return regex.test(dateString);
}