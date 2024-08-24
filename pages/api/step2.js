import { Timestamp } from 'firebase-admin/firestore';

export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fullBasePath = `https://empower-goal-tracker.vercel.app${basePath}`;
  let goal = '';

  if (req.method === 'POST') {
    goal = req.body.inputText || '';
  } else if (req.method === 'GET') {
    goal = req.query.goal || '';
  }

  // Get current date as a Timestamp
  const currentDate = Timestamp.now();

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${fullBasePath}/addGoal.png" />
      <meta property="fc:frame:input:text" content="Enter start date (dd/mm/yyyy)" />
      <meta property="fc:frame:button:1" content="Previous" />
      <meta property="fc:frame:post_url:1" content="${fullBasePath}/api/start" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta property="fc:frame:post_url:2" content="${fullBasePath}/api/step3" />
      <meta property="fc:frame:state" content="${JSON.stringify({ goal, currentDate: currentDate.toDate().toISOString() })}" />
    </head>
    <body>
      <h1>Enter Start Date for: ${goal}</h1>
      <p>Please enter a date from today onwards.</p>
    </body>
    </html>
  `);

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
}