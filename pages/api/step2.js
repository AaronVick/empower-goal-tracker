export default function handler(req, res) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const goal = req.body.goal;
  
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${basePath}/addGoal.png" />
        <meta property="fc:frame:button:1" content="Previous" />
        <meta property="fc:frame:post_url" content="${basePath}/api/start" />
        <meta property="fc:frame:button:2" content="Next" />
        <meta property="fc:frame:post_url:2" content="${basePath}/api/step3" />
      </head>
      <body>
        <h1>Enter Start Date</h1>
        <form action="${basePath}/api/step3" method="post">
          <input type="hidden" name="goal" value="${goal}" />
          <input type="text" name="startDate" placeholder="Enter Start Date dd/mm/yyyy" required /><br>
          <button type="submit">Next</button>
        </form>
      </body>
      </html>
    `);
  }