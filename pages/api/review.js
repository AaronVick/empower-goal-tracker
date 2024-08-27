export default async function handler(req, res) {
  try {
    // Access goal, startDate, and endDate from environment variables
    const goal = process.env.userSetGoal;
    const startDate = process.env.userStartDate;
    const endDate = process.env.userEndDate;

    // Check if the required environment variables are present
    if (!goal || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required environment variables" });
    }

    // Log the received environment variables
    console.log('Received goal from environment:', goal);
    console.log('Received start date from environment:', startDate);
    console.log('Received end date from environment:', endDate);

    // Additional logic to generate the review based on the provided environment variables
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

    const imageUrl = `${baseUrl}/api/ogReview?goal=${encodeURIComponent(goal)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

    console.log('Generated image URL:', imageUrl);

    // Return the frame with proper meta tags, including buttons for "Set Goal" and "Return Home"
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:button:1" content="Return Home" />
          <meta property="fc:frame:button:2" content="Set Goal" />
          <meta property="fc:frame:post_url:1" content="${baseUrl}/api" />
          <meta property="fc:frame:post_url:2" content="${baseUrl}/api/setGoal" />
        </head>
      </html>
    `;

    console.log('Sending HTML response for review frame');
    return res.setHeader('Content-Type', 'text/html').status(200).send(html);

  } catch (error) {
    console.error('Error processing review request:', error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
