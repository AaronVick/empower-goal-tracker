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
      const goal = encodeURIComponent(sessionData.goal || '');
      const startDate = encodeURIComponent(sessionData.startDate || '');
      const endDate = encodeURIComponent(sessionData.endDate || '');
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
    inputTextContent = getErrorMessage(error);
    button1Content = "Home";
    button2Content = "Retry";
  }

  const html = `
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

export function isValidDateFormat(dateString) {
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const [day, month, year] = dateString.split('/');
  const date = new Date(`${year}-${month}-${day}`);
  return date.getDate() == day && date.getMonth() == month - 1 && date.getFullYear() == year;
}

function getErrorMessage(error) {
  switch (error) {
    case 'no_goal':
      return "Please enter a goal";
    case 'invalid_start_date':
      return "Invalid start date. Please use dd/mm/yyyy format.";
    case 'invalid_end_date':
      return "Invalid end date. Please use dd/mm/yyyy format.";
    default:
      return "An error occurred. Please try again.";
  }
}
