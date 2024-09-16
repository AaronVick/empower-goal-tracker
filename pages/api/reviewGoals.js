import { db } from '../../lib/firebase';

export default async function handler(req, res) {
    console.log('Goal Tracker API accessed - Review Goals Step');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
    const fid = req.query.fid || req.body.untrustedData.fid;
    const currentIndex = parseInt(req.body.untrustedData.buttonIndex) - 1 || 0;

    console.log('Received FID:', fid);
    console.log('Current Index:', currentIndex);

    if (!fid) {
        console.error('FID not provided');
        return res.status(400).json({ error: 'FID is required' });
    }

    try {
        const goalsSnapshot = await db.collection('goals').where("user_id", "==", fid).get();
        if (goalsSnapshot.empty) {
            console.log('No goals found for user');
            const noGoalImageUrl = `${baseUrl}/api/ogReview?message=No goals set yet`;
            return res.status(200).send(renderHTML(noGoalImageUrl, baseUrl, 'No goals found'));
        }

        const goals = goalsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        const totalGoals = goals.length;
        let newIndex = currentIndex;

        if (req.body.untrustedData.buttonIndex === '1') {
            newIndex = (currentIndex - 1 + totalGoals) % totalGoals;
        } else if (req.body.untrustedData.buttonIndex === '2') {
            newIndex = (currentIndex + 1) % totalGoals;
        } else if (req.body.untrustedData.buttonIndex === '3') {
            // Handle goal completion
            const goalToComplete = goals[currentIndex];
            await db.collection('goals').doc(goalToComplete.id).update({ completed: true });
            console.log(`Goal ${goalToComplete.id} marked as completed`);
        }

        const currentGoal = goals[newIndex];
        const imageUrl = `${baseUrl}/api/ogReview?goal=${encodeURIComponent(currentGoal.goal)}&startDate=${encodeURIComponent(currentGoal.startDate.toDate().toLocaleDateString('en-GB'))}&endDate=${encodeURIComponent(currentGoal.endDate.toDate().toLocaleDateString('en-GB'))}&completed=${currentGoal.completed}&index=${newIndex + 1}&total=${totalGoals}`;

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
        <body>
            <p>Reviewing goal: ${goalText}</p>
        </body>
        </html>
    `;
}