import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
    console.log('Goal Tracker API accessed - Set Goal Step');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

    if (req.method === 'POST') {
        const { untrustedData } = req.body;
        const fid = untrustedData?.fid;

        console.log('Received FID:', fid);

        if (!fid) {
            console.error('FID not provided');
            return res.status(400).json({ error: 'FID is required' });
        }

        try {
            // Retrieve session data from Firebase
            const sessionRef = await db.collection('sessions').doc(fid.toString()).get();
            if (!sessionRef.exists) {
                console.error('No session found');
                return res.status(400).json({ error: 'No session found' });
            }

            const sessionData = sessionRef.data();
            const { goal, startDate, endDate } = sessionData;

            // Ensure startDate and endDate are present
            if (!goal || !startDate || !endDate) {
                console.error('Goal, startDate, or endDate is missing in session');
                return res.status(400).json({ error: 'Missing goal, startDate, or endDate' });
            }

            // Convert the start and end dates to Firebase Timestamps
            const startTimestamp = convertToTimestamp(startDate, true);
            const endTimestamp = convertToTimestamp(endDate, false);

            // Add the goal to the 'goals' collection in Firebase
            const goalRef = await db.collection('goals').add({
                user_id: fid,
                goal,
                startDate: startTimestamp,
                endDate: endTimestamp,
                createdAt: Timestamp.now(),
                completed: false, // Initially set the goal as incomplete
            });

            const goalId = goalRef.id;
            console.log(`Goal successfully added with ID: ${goalId}`);

            // Generate the share link for Warpcast
            const shareText = encodeURIComponent(`I set a new goal: "${goal}"! Support me on my journey!\n\nFrame by @aaronv\n\n`);
            const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(`${baseUrl}/api/goalShare?id=${goalId}`)}`;

            // Generate the success response with options to share on Warpcast
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta property="fc:frame" content="vNext" />
                    <meta property="fc:frame:image" content="${baseUrl}/api/successImage" />
                    <meta property="fc:frame:button:1" content="Home" />
                    <meta property="fc:frame:button:1:action" />
                    <meta property="fc:frame:button:1:target" content="${baseUrl}" />
                    <meta property="fc:frame:button:2" content="Share on Warpcast" />
                    <meta property="fc:frame:button:2:action" content="link" />
                    <meta property="fc:frame:button:2:target" content="${shareLink}" />
                </head>
                <body>
                    <p>Your goal has been successfully set! You can share it with your network.</p>
                </body>
                </html>
            `;

            console.log('Generated HTML:', html);
            res.setHeader('Content-Type', 'text/html');
            res.status(200).send(html);
        } catch (error) {
            console.error('Error setting goal:', error);
            return res.redirect(302, `${baseUrl}/api/error?message=${encodeURIComponent(error.message)}`);
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

// Helper function to convert the date string to a Firebase Timestamp
function convertToTimestamp(dateString, isStart) {
    if (!dateString) {
        throw new Error('Date string is invalid');
    }

    const [day, month, year] = dateString.split('/');
    const date = new Date(`${year}-${month}-${day}`);

    if (isNaN(date)) {
        throw new Error(`Invalid date format: ${dateString}`);
    }

    // Set hours to start or end of the day depending on isStart
    if (isStart) {
        date.setHours(0, 0, 0, 0);
    } else {
        date.setHours(23, 59, 59, 999);
    }

    return Timestamp.fromDate(date);
}
