export default function handler(req, res) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${basePath}/addGoal.png" />
      <meta property="fc:frame:button:1" content="Next" />
      <meta property="fc:frame:post_url" content="${basePath}/api/step2" />
    </head>
    <body>
      <h1>Enter Your Goal</h1>
      <form action="${basePath}/api/step2" method="post">
        <input type="text" name="goal" placeholder="Enter your goal" required /><br>
        <button type="submit">Next</button>
      </form>
    </body>
    </html>
  `);
}