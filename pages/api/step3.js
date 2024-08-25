import { getBase64Image, generateFrameHtml } from '../../lib/utils';

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

  const imageUrl = getBase64Image('addGoal.png');
  
  const html = generateFrameHtml({
    imageUrl,
    inputText: "Enter end date (dd/mm/yyyy)",
    button1Text: "Previous",
    button1Url: `${fullBasePath}/api/step2`,
    button2Text: "Next",
    button2Url: `${fullBasePath}/api/review`,
    state: { goal, startDate, currentDate: currentDate.toISOString() },
    bodyContent: `<h1>Enter End Date for: ${goal}</h1><p>Start date: ${startDate}</p>`
  });

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}