const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initialize Firebase Admin with environment variables from Vercel
admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  }),
});

const db = admin.firestore();

let globalGoal = '';
let globalStartDate = '';
let globalEndDate = '';

const validateDate = (dateString) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(dateString);
};

const convertToTimestamp = (dateString, isStart) => {
    const [day, month, year] = dateString.split('/');
    const date = new Date(`${year}-${month}-${day}`);

    if (date.toDateString() === new Date().toDateString()) {
        return admin.firestore.Timestamp.fromDate(new Date());
    } else {
        if (isStart) {
            date.setHours(0, 0, 0, 0);
        } else {
            date.setHours(23, 59, 59, 999);
        }
        return admin.firestore.Timestamp.fromDate(date);
    }
};

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/empower.png'));
});

app.get('/start', (req, res) => {
    res.send(`
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="/addGoal.png" />
        </head>
        <body>
            <h1>Enter Your Goal</h1>
            <form action="/api/addGoal" method="post">
                <input type="text" name="goal" placeholder="Enter your goal" required /><br>
                <input type="text" name="startDate" placeholder="Enter Start Date dd/mm/yyyy" required /><br>
                <button type="submit">Next</button>
            </form>
        </body>
        </html>
    `);
});

app.post('/api/addGoal', async (req, res) => {
    try {
        const { goal, startDate, endDate } = req.body;
        globalGoal = goal;
        globalStartDate = startDate;
        globalEndDate = endDate;

        if (!validateDate(startDate) || !validateDate(endDate)) {
            throw new Error('Invalid date format');
        }

        res.redirect('/review');
    } catch (error) {
        res.redirect('/error');
    }
});

app.get('/review', (req, res) => {
    res.send(`
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="/addGoal.png" />
        </head>
        <body>
            <h1>Review Your Goal</h1>
            <p>Goal: ${globalGoal}</p>
            <p>Start Date: ${globalStartDate}</p>
            <p>End Date: ${globalEndDate}</p>
            <form action="/setGoal" method="post">
                <button type="submit">Set Goal</button>
            </form>
        </body>
        </html>
    `);
});

app.post('/setGoal', async (req, res) => {
    try {
        const startTimestamp = convertToTimestamp(globalStartDate, true);
        const endTimestamp = convertToTimestamp(globalEndDate, false);

        await db.collection('goals').add({
            goal: globalGoal,
            startDate: startTimestamp,
            endDate: endTimestamp,
            createdAt: admin.firestore.Timestamp.now(),
        });

        res.send(`
            <html>
            <head>
                <meta property="fc:frame" content="vNext" />
                <meta property="fc:frame:image" content="/empower.png" />
            </head>
            <body>
                <h1>Goal Set Successfully!</h1>
                <p>Your goal has been saved.</p>
                <a href="/">Back to Home</a>
            </body>
            </html>
        `);
    } catch (error) {
        res.redirect('/error');
    }
});

app.get('/error', (req, res) => {
    const ogImage = createErrorOGImage('Invalid date format: Please use dd/mm/yyyy');
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImage}" />
            <meta property="fc:frame:button:1" content="Try Again" />
            <meta property="fc:frame:post_url" content="/start" />
        </head>
        </html>
    `);
});

function createErrorOGImage(message) {
    const svgContent = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f8ea"/>
            <foreignObject x="50" y="50" width="1100" height="530">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                    <p style="font-size: 46px; color: #333; max-width: 1000px; margin: 0;">${message}</p>
                </div>
            </foreignObject>
        </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
