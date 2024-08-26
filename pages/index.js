export default function handler(req, res) {
  console.log('Home Frame Accessed');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  // Define the meta tags for the home frame
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://empower-goal-tracker.vercel.app/empower.png" />
        
        <!-- Start a Goal Button -->
        <meta property="fc:frame:button:1" content="Start a Goal" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/start" />

        <!-- Review Goals Button -->
        <meta property="fc:frame:button:2" content="Review Goals" />
        <meta property="fc:frame:post_url" content="${baseUrl}/api/reviewGoals" />
      </head>
      <body>
        <h1>Welcome to Empower Goal Tracker</h1>
      </body>
    </html>
  `;

  console.log('Sending HTML response for Home frame');
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}

export async function getServerSideProps() {
  return { props: {} };
}
