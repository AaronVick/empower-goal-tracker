import { db } from '../../lib/firebase';

export default async function handler(req, res) {
    console.log('Goal Tracker API accessed');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
    let currentStep = process.env.stepGoal || 'start';
    let error = null;

    if (req.method === 'POST') {
        const { untrustedData } = req.body;
        const buttonIndex = parseInt(untrustedData.buttonIndex);
        const inputText = untrustedData.inputText || '';
        const fid = untrustedData.fid || req.query.fid;

        if (!fid) {
            console.error('FID not provided');
            return res.status(400).json({ error: 'FID is required' });
        }

        // Fetch or initialize session for current user
        try {
            console.log('FID:', fid); // Log fid to verify it's present
            const sessionRef = await db.collection('sessions').doc(fid).get();
            let sessionData = sessionRef.exists ? sessionRef.data() : { fid, currentStep, stepGoal: 'start' };

            // Handle navigation and inputs
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
        } catch (firebaseError) {
            console.error('Error updating session in Firebase:', firebaseError);
            return res.status(500).json({ error: 'Failed to update session' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

function generateHtml(sessionData, baseUrl, error) {
    let imageUrl, inputTextContent, button1Content, button2Content;

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
