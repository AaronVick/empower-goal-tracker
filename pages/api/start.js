function generateHtml(sessionData, baseUrl, error, currentStep) {
  let imageUrl, inputTextContent, inputPlaceholder, button1Content, button2Content;

  if (error) {
    imageUrl = `${baseUrl}/api/og?error=${error}&step=${currentStep}`;
  } else if (currentStep === 'review') {
    const goal = encodeURIComponent(sessionData.goal);
    const startDate = encodeURIComponent(sessionData.startDate);
    const endDate = encodeURIComponent(sessionData.endDate);
    imageUrl = `${baseUrl}/api/ogReview?goal=${goal}&startDate=${startDate}&endDate=${endDate}`;
  } else {
    imageUrl = `${baseUrl}/api/og?step=${currentStep}`;
  }

  if (currentStep === 'start') {
    inputTextContent = sessionData.goal || '';
    inputPlaceholder = 'Enter your goal';
    button1Content = 'Cancel';
    button2Content = 'Next';
  } else if (currentStep === '2') {
    inputTextContent = sessionData.startDate || '';
    inputPlaceholder = 'Enter start date (DD/MM/YYYY)';
    button1Content = 'Back';
    button2Content = 'Next';
  } else if (currentStep === '3') {
    inputTextContent = sessionData.endDate || '';
    inputPlaceholder = 'Enter end date (DD/MM/YYYY)';
    button1Content = 'Back';
    button2Content = 'Next';
  } else if (currentStep === 'review') {
    button1Content = 'Edit';
    button2Content = 'Set Goal';
  }
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${imageUrl}" />
        ${inputPlaceholder ? `<meta property="fc:frame:input:text" content="${inputTextContent}" />` : ''}
        ${inputPlaceholder ? `<meta property="fc:frame:input:placeholder" content="${inputPlaceholder}" />` : ''}
        <meta property="fc:frame:button:1" content="${button1Content}" />
        <meta property="fc:frame:button:2" content="${button2Content}" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />
      </head>
    </html>
  `;
}