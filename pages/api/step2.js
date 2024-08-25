import { Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

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
}