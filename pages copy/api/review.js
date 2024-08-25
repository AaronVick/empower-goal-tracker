import { createReviewOGImage } from '../../lib/utils';

export default function handler(req, res) {
  try {
    console.log('Review API accessed');
    console.log('Request Body:', req.body);

    // Correctly accessing the inputText and state from untrustedData
    const { inputText: endDate, state } = req.body.untrustedData;
    console.log('End Date:', endDate);

    const { goal, startDate } = JSON.parse(state || '{}');
    console.log('Goal:', goal);
    console.log('Start Date:', startDate);

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const fullBasePath = `https://empower-goal-tracker.vercel.app${basePath}`;

    const ogImage = createReviewOGImage(goal, startDate, endDate);

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${ogImage}" />
        <meta property="fc:frame:button:1" content="Edit" />
        <meta property="fc:frame:post_url:1" content="${fullBasePath}/api/start" />
        <meta property="fc:frame:button:2" content="Set Goal" />
        <meta property="fc:frame:post_url:2" content="${fullBasePath}/api/setGoal" />
        <meta property="fc:frame:state" content="${JSON.stringify({ goal, startDate, endDate })}" />
      </head>
      <body>
        <h1>Review Your Goal</h1>
        <p>Goal: ${goal}</p>
        <p>Start Date: ${startDate}</p>
        <p>End Date: ${endDate}</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in Review API:', error);
    res.status(500).send('Internal Server Error');
  }
}
