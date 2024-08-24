const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
let globalGoal = '';
let globalStartDate = '';
let globalEndDate = '';
let userFID = '';

// Serve static files from the public folder
app.use(`${basePath}/`, express.static(path.join(__dirname, 'public')));

// Middleware to parse incoming requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Opening Screen
app.get(`${basePath}/`, (req, res) => {
    res.send(`
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${basePath}/empower.png" />
            <meta property="fc:frame:button:1" content="Start a Goal" />
            <meta property="fc:frame:post_url" content="${basePath}/start" />
            <meta property="fc:frame:button:2" content="Review Goals" />
            <meta property="fc:frame:post_url:2" content="${basePath}/reviewGoals" />
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

// Step 1: Enter Goal
app.post(`${basePath}/start`, (req, res) => {
    const { trustedData } = req.body;

    if (!trustedData?.messageBytes) {
        return res.status(400).json({ error: 'Invalid request: missing trusted data' });
    }

    userFID = 'dummy-fid'; // Use your logic or move this to `goals.js` if needed

    res.send(`
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${basePath}/addGoal.png" />
            <meta property="fc:frame:button:1" content="Next" />
            <meta property="fc:frame:post_url" content="${basePath}/step2" />
        </head>
        <body>
            <h1>Enter Your Goal</h1>
            <form action="${basePath}/step2" method="post">
                <input type="text" name="goal" placeholder="Enter your goal" required /><br>
                <button type="submit">Next</button>
            </form>
        </body>
        </html>
    `);
});

// Step 2: Enter Start Date
app.post(`${basePath}/step2`, (req, res) => {
    globalGoal = req.body.goal;
    res.send(`
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${basePath}/addGoal.png" />
            <meta property="fc:frame:button:1" content="Previous" />
            <meta property="fc:frame:post_url" content="${basePath}/start" />
            <meta property="fc:frame:button:2" content="Next" />
            <meta property="fc:frame:post_url:2" content="${basePath}/step3" />
        </head>
        <body>
            <h1>Enter Start Date</h1>
            <form action="${basePath}/step3" method="post">
                <input type="text" name="startDate" placeholder="Enter Start Date dd/mm/yyyy" required /><br>
                <button type="submit">Next</button>
            </form>
        </body>
        </html>
    `);
});

// Step 3: Enter End Date
app.post(`${basePath}/step3`, (req, res) => {
    globalStartDate = req.body.startDate;
    res.send(`
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${basePath}/addGoal.png" />
            <meta property="fc:frame:button:1" content="Previous" />
            <meta property="fc:frame:post_url" content="${basePath}/step2" />
            <meta property="fc:frame:button:2" content="Next" />
            <meta property="fc:frame:post_url:2" content="${basePath}/review" />
        </head>
        <body>
            <h1>Enter End Date</h1>
            <form action="${basePath}/review" method="post">
                <input type="text" name="endDate" placeholder="Enter End Date dd/mm/yyyy" required /><br>
                <button type="submit">Next</button>
            </form>
        </body>
        </html>
    `);
});

// Step 4: Review and Submit
app.post(`${basePath}/review`, (req, res) => {
    globalEndDate = req.body.endDate;

    if (!validateDate(globalStartDate) || !validateDate(globalEndDate)) {
        return res.redirect(`${basePath}/error`);
    }

    const ogImage = createReviewOGImage(globalGoal, globalStartDate, globalEndDate);
    res.send(`
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImage}" />
            <meta property="fc:frame:button:1" content="Previous" />
            <meta property="fc:frame:post_url" content="${basePath}/step3" />
            <meta property="fc:frame:button:2" content="Set Goal" />
            <meta property="fc:frame:post_url:2" content="${basePath}/setGoal" />
        </head>
        <body>
            <h1>Review Your Goal</h1>
            <p>Goal: ${globalGoal}</p>
            <p>Start Date: ${globalStartDate}</p>
            <p>End Date: ${globalEndDate}</p>
            <form action="${basePath}/setGoal" method="post">
                <button type="submit">Set Goal</button>
            </form>
        </body>
        </html>
    `);
});

// Step 5: Success Message with Share and Home Options
app.post(`${basePath}/setGoal`, async (req, res) => {
    try {
        const response = await fetch(`${basePath}/api/goal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                trustedData: { messageBytes: 'dummy-bytes' }, // Use actual data
                goal: globalGoal,
                startDate: globalStartDate,
                endDate: globalEndDate,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to set goal via API");
        }

        const ogImage = createSuccessOGImage();
        const shareText = encodeURIComponent(`I just set a new goal: "${globalGoal}"! Join me on Empower Goal Tracker.\n\nStart Date: ${globalStartDate}\nEnd Date: ${globalEndDate}`);
        const shareLink = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${encodeURIComponent(basePath)}`;

        res.send(`
            <html>
            <head>
                <meta property="fc:frame" content="vNext" />
                <meta property="fc:frame:image" content="${ogImage}" />
                <meta property="fc:frame:button:1" content="Home" />
                <meta property="fc:frame:post_url" content="${basePath}/" />
                <meta property="fc:frame:button:2" content="Share" />
                <meta property="fc:frame:button:2:action" content="link" />
                <meta property="fc:frame:button:2:target" content="${shareLink}" />
            </head>
            <body>
                <h1>Goal Set Successfully!</h1>
                <p>Your goal has been saved.</p>
                <form action="${basePath}/" method="get">
                    <button type="submit">Home</button>
                </form>
                <form action="${shareLink}" method="get">
                    <button type="submit">Share</button>
                </form>
            </body>
        </html>
        `);
    } catch (error) {
        res.redirect(`${basePath}/error`);
    }
});

// Error route
app.get(`${basePath}/error`, (req, res) => {
    const ogImage = createErrorOGImage('Invalid date format: Please use dd/mm/yyyy');
    return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImage}" />
            <meta property="fc:frame:button:1" content="Try Again" />
            <meta property="fc:frame:post_url" content="${basePath}/start" />
        </head>
        </html>
    `);
});

// Utility functions
function validateDate(dateString) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(dateString);
}

function createReviewOGImage(goal, startDate, endDate) {
    const svgContent = `
        <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f8ea"/>
            <foreignObject x="50" y="50" width="1200" height="675">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                    <p style="font-size: 36px; color: #333; max-width: 1000px; margin: 0;">Goal: ${goal}</p>
                    <p style="font-size: 28px; color: #666; margin-top: 20px;">Start Date: ${startDate}</p>
                    <p style="font-size: 28px; color: #666; margin-top: 10px;">End Date: ${endDate}</p>
                </div>
            </foreignObject>
        </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}

function createSuccessOGImage() {
    const svgContent = `
        <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f8ea"/>
            <foreignObject x="50" y="50" width="1200" height="675">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                    <p style="font-size: 46px; color: #333; max-width: 1000px; margin: 0;">Your goal has been set successfully!</p>
                </div>
            </foreignObject>
        </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}

function createErrorOGImage(message) {
    const svgContent = `
        <svg width="1200" height="675" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f8ea"/>
            <foreignObject x="50" y="50" width="1200" height="675">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                    <p style="font-size: 36px; color: #333; max-width: 1000px; margin: 0;">${message}</p>
                </div>
            </foreignObject>
        </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
