const admin = require('firebase-admin');
const axios = require('axios');
const { NeynarAPIClient } = require("@neynar/nodejs-sdk");

console.log('Starting sendCast script...');

// Log all relevant environment variables (excluding sensitive data)
console.log('Environment variables check:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('NEYNAR_API set:', !!process.env.NEYNAR_API);
console.log('NEYNAR_SIGNER set:', !!process.env.NEYNAR_SIGNER);
console.log('EMPOWER_CHANNEL_URL set:', !!process.env.EMPOWER_CHANNEL_URL);
console.log('NEXT_PUBLIC_BASE_PATH:', process.env.NEXT_PUBLIC_BASE_PATH);

// Initialize Firebase with the service account details
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  process.exit(1);
}

// Function to add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to send a cast
async function sendCast() {
  let successfulCasts = 0;
  let failedCasts = 0;

  try {
    const db = admin.firestore();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for comparison
    console.log("Processing goals for date:", today.toISOString());

    // Fetch active goals from Firebase
    const goalsSnapshot = await db.collection('goals')
      .where('startDate', '<=', admin.firestore.Timestamp.fromDate(today))
      .where('endDate', '>=', admin.firestore.Timestamp.fromDate(today))
      .get();

    console.log(`Found ${goalsSnapshot.size} active goals for today`);

    if (goalsSnapshot.empty) {
      console.log('No active goals found for today');
      return;
    }

    // Initialize Neynar API Client
    if (!process.env.NEYNAR_API) {
      console.error("Error: NEYNAR_API key is missing or undefined.");
      return;
    }

    const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API);
    const signer = process.env.NEYNAR_SIGNER;

    // Check if NEXT_PUBLIC_BASE_PATH is set
    if (!process.env.NEXT_PUBLIC_BASE_PATH) {
      console.error("Error: NEXT_PUBLIC_BASE_PATH is not set.");
      return;
    }

    // Loop through active goals and send casts
    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('---');
      console.log('Processing goal:', goalData.goal);
      console.log('Goal start date:', goalData.startDate.toDate());
      console.log('Goal end date:', goalData.endDate.toDate());

      const fid = goalData.user_id;
      console.log('FID for this goal:', fid);

      try {
        // Fetch the display name and custody address using Pinata's open API
        console.log('Fetching display name and custody address from Pinata...');
        const response = await axios.get(`https://api.pinata.cloud/v3/farcaster/users/${fid}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const displayName = response.data.user.display_name;
        const custodyAddress = response.data.user.custody_address;

        console.log('Display name found:', displayName);
        console.log('Custody address found:', custodyAddress);

        if (!displayName || !custodyAddress) {
          console.error('Error: Display name or custody address not found.');
          failedCasts++;
          continue;
        }

        // Construct the cast message
        const message = `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters ? goalData.supporters.length : 0} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

        // Use the channel URL from your provided details
        const empowerChannelUrl = process.env.EMPOWER_CHANNEL_URL;

        // Send the cast via the Neynar API
        console.log('Sending cast to Neynar...');
        const result = await neynarClient.publishCast(signer, message, {
          embeds: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}` }],
          replyTo: empowerChannelUrl,
        });

        console.log('Cast sent successfully. Neynar API response:', JSON.stringify(result, null, 2));
        successfulCasts++;

        // Add a delay to avoid rate limiting
        await delay(1000); // 1 second delay

      } catch (error) {
        failedCasts++;
        if (error.response && error.response.status === 401) {
          console.error('Unauthorized access - 401 Error:', error.message);
        } else if (error.response) {
          console.error('Error during API call:', error.response.data);
        } else {
          console.error('Error during Pinata lookup or Neynar cast submission:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error occurred during sendCast:', error.message);
  } finally {
    console.log('---');
    console.log('Cast sending summary:');
    console.log(`Successful casts: ${successfulCasts}`);
    console.log(`Failed casts: ${failedCasts}`);
    console.log('sendCast script completed.');
  }
}

// Execute the sendCast function
sendCast();