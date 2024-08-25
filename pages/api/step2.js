import { Timestamp } from 'firebase-admin/firestore';
import { getBase64Image, generateFrameHtml } from '../../lib/utils';

export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fullBasePath = `https://empower-goal-tracker.vercel.app${basePath}`;
  let goal = '';

  if (req.method === 'POST') {
    goal = req.body.inputText || '';
  } else if (req.method === 'GET') {
    goal = req.query.goal || '';
  }

  const currentDate = Timestamp.now();
  const imageUrl = getBase64Image('addGoal.png');
  
  const html = generateFrameHtml({
    imageUrl,
    inputText: "Enter start date (dd/mm/yyyy)",
    button1Text: "Previous",
    button1Url: `${fullBasePath}/api/start`,
    button2Text: "Next",
    button2Url: `${fullBasePath}/api/step3`,
    state: { goal, currentDate: currentDate.toDate().toISOString() },
    bodyContent: `<h1>Enter Start Date for: ${goal}</h1>`
  });

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}