import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fullBasePath = `https://empower-goal-tracker.vercel.app${basePath}`;
  
  let startDate = '';
  if (req.method === 'POST') {
    startDate = req.body.inputText || '';
  }

  // Read and encode the image
  const imagePath = path.join(process.cwd(), 'public', 'addGoal.png');
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="data:image/png;base64,${base64Image}" />
      <meta property="fc:frame:input:text" content="Enter end date (dd/mm/yyyy)" />
      <meta property="fc:frame:button:1" content="Previous" />
      <meta property="fc:frame:post_url:1" content="${fullBasePath}/api/step2" />
      <meta property="fc:frame:button:2" content="Next" />
      <meta property="fc:frame:post_url:2" content="${fullBasePath}/api/review" />
    </head>
    <body>
      <h1>Enter End Date</h1>
      <p>Start date: ${startDate}</p>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}