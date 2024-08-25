export default function handler(req, res) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const { message } = req.query;
  
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${basePath}/error.png" />
        <meta property="fc:frame:button:1" content="Try Again" />
        <meta property="fc:frame:post_url:1" content="${basePath}/api/start" />
      </head>
      <body>
        <h1>Error</h1>
        <p>${message || 'An error occurred. Please try again.'}</p>
      </body>
      </html>
    `);
  }