export default function handler(req, res) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const { goal, startDate } = req.body;
  
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${basePath}/addGoal.png" />
        <meta property="fc:frame:button:1" content="Previous" />
        <meta property="fc:frame:post_url" content="${basePath}/api/step2" />
        <meta property="fc:frame:button:2" content="Next" />
        <meta property="fc:frame:post_url:2" content="${basePath}/api/review" />
      </head>
      <body>
        <h1>Enter End Date</h1>
        <form action="${basePath}/api/review" method="post">
          <input type="hidden" name="goal" value="${goal}" />
          <input type="hidden" name="startDate" value="${startDate}" />
          <input type="text" name="endDate" placeholder="Enter End Date dd/mm/yyyy" required /><br>
          <button type="submit">Next</button>
        </form>
      </body>
      </html>
    `);
  }