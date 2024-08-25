import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { name = 'empower' } = req.query;
  const filePath = path.join(process.cwd(), 'public', `${name}.png`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (fs.existsSync(filePath)) {
    const imageBuffer = fs.readFileSync(filePath);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(imageBuffer);
  } else {
    res.status(404).send('Image not found');
  }
}