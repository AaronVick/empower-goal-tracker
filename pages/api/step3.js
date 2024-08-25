import { Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

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

  // Validate start date
  if (!isValidDate(startDate) || !isDateOnOrAfter(startDate, currentDate)) {
    return res.redirect(`${fullBasePath}/api/error?message=Invalid start date. Please enter a date from today onwards.`);
  }

  // Read the image file and convert it to a data URI
  const imagePath = path.join(process.cwd(), 'public', 'addGoal.png');
  const imageBuffer = fs.readFileSync(imagePath);
  const dataUri = `data:image/png;base64,${imageBuffer.toString('base64')}`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${dataUri}" />
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
      <p>Please enter a date after the start date.</p>
    </body>
    </html>
  `);
}

// ... (keep the isValidDate and isDateOnOrAfter functions as they are)