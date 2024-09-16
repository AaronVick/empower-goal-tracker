import { db } from '../../lib/firebase';
import { createReviewOGImage } from '../../lib/utils';

export default async function handler(req, res) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
    const fid = req.query.fid || req.body.untrustedData.fid;
    const currentIndex = req.body.untrustedData.state || 0;

    try {
        const goalsSnapshot = await db.collection('goals').where("user_id", "==", fid).get();
        if (goalsSnapshot.empty) {
            const noGoalImageUrl = createReviewOGImage("No goals set yet", "", "");
            return res.status(200).send(renderHTML(noGoalImageUrl, baseUrl, 'No goals found'));
        }

        const goals = goalsSnapshot.docs.map(doc => doc.data());
        const currentGoal = goals[currentIndex];
        const imageUrl = `${baseUrl}/api/ogReview?goal=${encodeURIComponent(currentGoal.goal)}&startDate=${encodeURIComponent(currentGoal.startDate)}&endDate=${encodeURIComponent(currentGoal.endDate)}`;

        return res.status(200).send(renderHTML(imageUrl, baseUrl, currentGoal.goal));
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Error fetching goals' });
    }
}

function renderHTML(imageUrl, baseUrl, goalText) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${imageUrl}" />
            <meta property="fc:frame:button:1" content="Previous" />
            <meta property="fc:frame:button:2" content="Next" />
            <meta property="fc:frame:button:3" content="Complete" />
            <meta property="fc:frame:post_url" content="${baseUrl}/api/reviewGoals" />
        </head>
        </html>
    `;
}
