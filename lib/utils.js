import fs from 'fs';
import path from 'path';

export function createReviewOGImage(goal, startDate, endDate, goalCount = '') {
  const svgContent = `
    <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f8ea"/>
      <foreignObject x="50" y="50" width="1100" height="575">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          ${goalCount ? `<p style="font-size: 24px; color: #666; margin-bottom: 10px;">${goalCount}</p>` : ''}
          <p style="font-size: 36px; color: #333; max-width: 1000px; margin: 0;">${goal}</p>
          ${startDate && endDate ? `
            <p style="font-size: 28px; color: #666; margin-top: 20px;">Start Date: ${startDate}</p>
            <p style="font-size: 28px; color: #666; margin-top: 10px;">End Date: ${endDate}</p>
          ` : ''}
        </div>
      </foreignObject>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}


export function createSuccessOGImage() {
  const svgContent = `
    <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f8ea"/>
      <foreignObject x="50" y="50" width="1200" height="675">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <p style="font-size: 46px; color: #333; max-width: 1000px; margin: 0;">Your goal has been set successfully!</p>
        </div>
      </foreignObject>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}

export function getBase64Image(imageName) {
  const imagePath = path.join(process.cwd(), 'public', imageName);
  const imageBuffer = fs.readFileSync(imagePath);
  return `data:image/png;base64,${imageBuffer.toString('base64')}`;
}

export function generateFrameHtml({ imageUrl, inputText, button1Text, button1Url, button2Text, button2Url, state, bodyContent }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${imageUrl}" />
      <meta property="fc:frame:input:text" content="${inputText}" />
      <meta property="fc:frame:button:1" content="${button1Text}" />
      <meta property="fc:frame:post_url:1" content="${button1Url}" />
      <meta property="fc:frame:button:2" content="${button2Text}" />
      <meta property="fc:frame:post_url:2" content="${button2Url}" />
      <meta property="fc:frame:state" content="${JSON.stringify(state)}" />
    </head>
    <body>
      ${bodyContent}
    </body>
    </html>
  `;
}