export function createReviewOGImage(goal, startDate, endDate) {
    const svgContent = `
      <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f8ea"/>
        <foreignObject x="50" y="50" width="1200" height="675">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
            <p style="font-size: 36px; color: #333; max-width: 1000px; margin: 0;">Goal: ${goal}</p>
            <p style="font-size: 28px; color: #666; margin-top: 20px;">Start Date: ${startDate}</p>
            <p style="font-size: 28px; color: #666; margin-top: 10px;">End Date: ${endDate}</p>
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