import { Timestamp } from 'firebase-admin/firestore';

export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fullBasePath = `https://empower-goal-tracker.vercel.app${basePath}`;
  let startDate, goal, currentDate;

  if (req.method === 'POST') {
    startDate = req.body.inputText || '';
    const state = JSON.parse(req.body.state || '{}');
    goal = state.goal || '';
    currentDate = state.currentDate ? new Date(state.currentDate) : new Date();
  } else if (req.method === 'GET') {
    startDate = req.query.startDate || '';
    goal = req.query.goal || '';
    currentDate = new Date();
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${fullBasePath}/addGoal.png" />
      <meta property="fc:frame:input:text" content="Enter end date (dd/mm/yyyy)" />
      <meta property="fc:frame:button:1" content="Previous" />
      <meta property="fc:frame:post_url:1" content="${fullBasePath}/api/step2" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta property="fc:frame:post_url:2" content="${fullBasePath}/api/review" />
      <meta property="fc:frame:state" content="${JSON.stringify({ goal, startDate, currentDate: currentDate.toISOString() })}" />
    </head>
    <body>
      <h1>Enter End Date for: ${goal}</h1>
      <p>Start date: ${startDate}</p>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}