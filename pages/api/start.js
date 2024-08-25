import { getBase64Image, generateFrameHtml } from '../../lib/utils';

export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fullBasePath = `https://empower-goal-tracker.vercel.app${basePath}`;
  
  const imageUrl = getBase64Image('addGoal.png');
  
  const html = generateFrameHtml({
    imageUrl,
    inputText: "Enter your goal",
    button1Text: "Start a Goal",
    button1Url: `${fullBasePath}/api/step2`,
    button2Text: "Review Goals",
    button2Url: `${fullBasePath}/api/reviewGoals`,
    state: {},
    bodyContent: "<h1>Welcome to Empower Goal Tracker</h1>"
  });

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}