import { db } from '../../lib/firebase';

export default async function handler(req, res) {
    console.log('Goal Tracker API accessed - Review Goals Step');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
    const fid = req.query.fid || req.body.untrustedData.fid;

    if (!fid) {
        console.error('FID not provided');
        return res.status(400).json({ error: 'FID is required' });
    }

    try {
        const sessionRef = db.collection('sessions').doc(fid.toString());
        const sessionSnapshot = await sessionRef.get();
        if (!sessionSnapshot.exists) {
            return res.status(400).json({ error: 'No session found' });
        }
        const sessionData = sessionSnapshot.data();
        const { goal, startDate, endDate } = sessionData;

        // Generate the OG image with goal details
        const imageUrl = `${baseUrl}/api/ogReview?goal=${encodeURIComponent(goal)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta property="fc:frame" content="vNext" />
                <meta property="fc:frame:image" content="${imageUrl}" />
                <meta property="fc:frame:button:1" content="Back" />
                <meta property="fc:frame:button:2" content="Set Goal" />
                <meta property="fc:frame:post_url" content="${baseUrl}/api/setGoal" />
            </head>
            <body>
                <p>Review your goal</p>
            </body>
            </html>
        `;
        return res.status(200).send(html);
    } catch (error) {
        console.error('Error fetching goals:', error);
        return res.status(500).json({ error: 'Error fetching goals' });
    }
}
