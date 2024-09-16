export function generateHtml(step, sessionData, baseUrl, error = null) {
  let imageUrl, inputTextContent, button1Content, button2Content;

  switch (step) {
    case 'start':
      imageUrl = `${baseUrl}/api/og?step=start`;
      inputTextContent = sessionData.goal || "Enter your goal";
      button1Content = "Cancel";
      button2Content = "Next";
      break;
    case 'startDate':
      imageUrl = `${baseUrl}/api/og?step=startDate`;
      inputTextContent = sessionData.startDate || "Enter the start date (dd/mm/yyyy)";
      button1Content = "Back";
      button2Content = "Next";
      break;
    case 'endDate':
      imageUrl = `${baseUrl}/api/og?step=endDate`;
      inputTextContent = sessionData.endDate || "Enter the end date (dd/mm/yyyy)";
      button1Content = "Back";
      button2Content = "Next";
      break;
    case 'review':
      const goal = encodeURIComponent(sessionData.goal);
      const startDate = encodeURIComponent(sessionData.startDate);
      const endDate = encodeURIComponent(sessionData.endDate);
      imageUrl = `${baseUrl}/api/ogReview?goal=${goal}&startDate=${startDate}&endDate=${endDate}`;
      inputTextContent = null;
      button1Content = "Back";
      button2Content = "Set Goal";
      break;
    case 'success':
      imageUrl = `${baseUrl}/api/successImage`;
      inputTextContent = null;
      button1Content = "Home";
      button2Content = "Share";
      break;
    default:
      imageUrl = `${baseUrl}/api/og?step=unknown`;
      inputTextContent = "Unknown step.";
      button1Content = "Cancel";
      button2Content = "Retry";
  }

  if (error) {
    imageUrl = `${baseUrl}/api/og?error=${encodeURIComponent(error)}&step=${encodeURIComponent(step)}`;
    inputTextContent = "Error occurred, please try again.";
    button1Content = "Home";
    button2Content = "Retry";
  }

  let html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Goal Tracker</title>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    ${inputTextContent !== null ? `<meta property="fc:frame:input:text" content="${inputTextContent}" />` : ''}
    <meta property="fc:frame:button:1" content="${button1Content}" />
    <meta property="fc:frame:button:2" content="${button2Content}" />
    <meta property="fc:frame:post_url" content="${baseUrl}/api/${step}" />
  </head>
  <body>
    <p>This is a Farcaster Frame for the Goal Tracker app.</p>
  </body>
</html>`;

  return html;
}
