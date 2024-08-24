const express = require('express');
const path = require('path');
const app = express();

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/';

// Serve static files from the public folder
app.use(`${basePath}/`, express.static(path.join(__dirname, 'public')));

app.get(`${basePath}/`, (req, res) => {
    console.log("Serving the home frame with meta tags");

    // Check if the image exists
    const imagePath = path.join(__dirname, 'public', 'empower.png');
    if (path.existsSync(imagePath)) {
        console.log("Image found at:", imagePath);
    } else {
        console.error("Image not found at:", imagePath);
    }

    // Log the base path and request URL
    console.log("Base Path:", basePath);
    console.log("Request URL:", req.url);

    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="https://empower-goal-tracker.vercel.app/empower.png" />
            <meta property="fc:frame:button:1" content="Start a Goal" />
            <meta property="fc:frame:post_url" content="${basePath}/start" />
            <meta property="fc:frame:button:2" content="Review Goals" />
            <meta property="fc:frame:post_url:2" content="${basePath}/reviewGoals" />
            <title>Empower Goal Tracker</title>
        </head>
        <body>
            <h1>Welcome to Empower Goal Tracker</h1>
            <form action="${basePath}/start" method="get">
                <button type="submit">Start a Goal</button>
            </form>
            <form action="${basePath}/reviewGoals" method="get">
                <button type="submit">Review Goals</button>
            </form>
        </body>
        </html>
    `);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
