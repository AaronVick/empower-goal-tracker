import { createReviewOGImage } from '../../lib/utils';

export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const { goal, startDate, endDate, trustedData } = req.body;

  if (!validateDate(startDate) || !validateDate(endDate)) {
    return res.redirect(`${basePath}/api/error`);
  }

  const ogImage = createReviewOGImage(goal, startDate, endDate);

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${ogImage}" />
      <meta property="fc:frame:button:1" content="Previous" />
      <meta property="fc:frame:post_url" content="${basePath}/api/step3" />
      <meta property="fc:frame:button:2" content="Set Goal" />
      <meta property="fc:frame:post_url:2" content="${basePath}/api/setGoal" />
    </head>
    <body>
      <h1>Review Your Goal</h1>
      <p>Goal: ${goal}</p>
      <p>Start Date: ${startDate}</p>
      <p>End Date: ${endDate}</p>
      <form action="${basePath}/api/setGoal" method="post">
        <input type="hidden" name="goal" value="${goal}" />
        <input type="hidden" name="startDate" value="${startDate}" />
        <input type="hidden" name="endDate" value="${endDate}" />
        <input type="hidden" name="trustedData" value='${trustedData}' />
        <button type="submit">Set Goal</button>
      </form>
    </body>
    </html>
  `);
}

function validateDate(dateString) {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  return regex.test(dateString);
}