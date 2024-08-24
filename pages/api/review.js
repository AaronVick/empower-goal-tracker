import { createReviewOGImage } from '../../lib/utils';

export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const { inputText: endDate, state } = req.body;
  const { goal, startDate, currentDate } = JSON.parse(state || '{}');

  // Validate end date
  if (!isValidDate(endDate) || !isDateOnOrAfter(endDate, startDate)) {
    return res.redirect(`${basePath}/api/error?message=Invalid end date. Please enter a date after the start date.`);
  }

  const ogImage = createReviewOGImage(goal, startDate, endDate);

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${ogImage}" />
      <meta property="fc:frame:button:1" content="Edit" />
      <meta property="fc:frame:post_url:1" content="${basePath}/api/start" />
      <meta property="fc:frame:button:2" content="Set Goal" />
      <meta property="fc:frame:post_url:2" content="${basePath}/api/setGoal" />
      <meta property="fc:frame:state" content="${JSON.stringify({ goal, startDate, endDate, currentDate })}" />
    </head>
    <body>
      <h1>Review Your Goal</h1>
      <p>Goal: ${goal}</p>
      <p>Start Date: ${startDate}</p>
      <p>End Date: ${endDate}</p>
    </body>
    </html>
  `);
}

function isValidDate(dateString) {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateString)) return false;
  const [day, month, year] = dateString.split('/');
  const date = new Date(year, month - 1, day);
  return date && date.getMonth() + 1 == month && date.getDate() == day;
}

function isDateOnOrAfter(dateA, dateB) {
  const [dayA, monthA, yearA] = dateA.split('/');
  const [dayB, monthB, yearB] = dateB.split('/');
  const a = new Date(yearA, monthA - 1, dayA);
  const b = new Date(yearB, monthB - 1, dayB);
  return a >= b;
}