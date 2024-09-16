import { db } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req, res) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

    if (req.method === 'POST') {
        const { untrustedData } = req.body;
        const fid = untrustedData.fid;

        // Retrieve session data
        const sessionRef = await db.collection('sessions').doc(fid).get();
        if (!sessionRef.exists) {
            return res.status(400).json({ error: 'No session found' });
        }
        const sessionData = sessionRef.data();
        const { goal, startDate, endDate } = sessionData;

        try {
            const startTimestamp = convertToTimestamp(startDate, true);
            const endTimestamp = convertToTimestamp(endDate, false);

            // Add the goal to the goals collection
            const goalRef = await db.collection('goals').add({
                user_id: fid,
                goal,
                startDate: startTimestamp,
                endDate: endTimestamp,
                createdAt: Timestamp.now(),
                completed: false,
            });

            const goalId = goalRef.id;

            console.log(`Goal successfully added with ID: ${goalId}`);

            const shareText = encodeURIComponent(`I set a new goal: "${goal}"! Support me on my journey!\n\nFrame by @aaronv\n\n`);
            const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(`${baseUrl}/api/goalShare?id=${goalId}`)}`;

            res.setHeader('Content-Type', 'text/html');
            res.status(200).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta property="fc:frame" content="vNext" />
                    <meta property="fc:frame:image" content="${baseUrl}/api/successImage" />
                    <meta property="fc:frame:button:1" content="Home" />
                    <meta property="fc:frame:button:1:action" content="link" />
                    <meta property="fc:frame:button:1:target" content="${baseUrl}" />
                    <meta property="fc:frame:button:2" content="Share on Warpcast" />
                    <meta property="fc:frame:button:2:action" content="link" />
                    <meta property="fc:frame:button:2:target" content="${shareLink}" />
                </head>
                </html>
            `);
        } catch (error) {
            console.error('Error setting goal:', error);
            res.redirect(302, `${baseUrl}/api/error`);
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

function convertToTimestamp(dateString, isStart) {
    if (!dateString) {
        throw new Error('Date string is invalid');
    }

    const [day, month, year] = dateString.split('/');
    const date = new Date(`${year}-${month}-${day}`);

    if (isNaN(date)) {
        throw new Error(`Invalid date format: ${dateString}`);
    }

    if (date.toDateString() === new Date().toDateString()) {
        return Timestamp.fromDate(new Date());
    } else {
        if (isStart) {
            date.setHours(0, 0, 0, 0);
        } else {
            date.setHours(23, 59, 59, 999);
        }
        return Timestamp.fromDate(date);
    }
}
