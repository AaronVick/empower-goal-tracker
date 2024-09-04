const admin = require('firebase-admin');
const axios = require('axios');

console.log('Starting sendCast script...');

const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';
const NEYNAR_API = 'https://api.neynar.com/v2/farcaster/cast';

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

// Function to get user data from Pinata Hub API
async function getUserDataByFid(fid) {
  try {
    const displayResponse = await axios.get(`${PINATA_HUB_API}/userDataByFid`, {
      params: { fid, user_data_type: 2 }, // 2 is for DISPLAY
      timeout: 10000
    });
    const displayName = displayResponse.data.data.userDataBody.value;

    const usernameResponse = await axios.get(`${PINATA_HUB_API}/userDataByFid`, {
      params: { fid, user_data_type: 6 }, // 6 is for USERNAME
      timeout: 10000
    });
    const username = usernameResponse.data.data.userDataBody.value;

    return { displayName, username };
  } catch (error) {
    console.error(`Error getting user data for FID ${fid}:`, error.message);
    return null;
  }
}

// Function to send a cast using Neynar API
async function sendCastToNeynar(signerUuid, text, parentUrl, channelId, embedUrl) {
  try {
    const response = await axios.post(NEYNAR_API, {
      signer_uuid: signerUuid,
      text: text,
      parent: parentUrl,
      channel_id: channelId,
      embeds: embedUrl ? [{ url: embedUrl }] : undefined
    }, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api_key': process.env.NEYNAR_API
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error sending cast to Neynar:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Function to send a cast
async function sendCast() {
  let successfulCasts = 0;
  let failedCasts = 0;
  let skippedCompletedGoals = 0;

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

    // Check if required environment variables are set
    if (!process.env.NEYNAR_API || !process.env.NEYNAR_SIGNER || !process.env.EMPOWER_CHANNEL_URL || !process.env.NEXT_PUBLIC_BASE_PATH) {
      console.error("Error: One or more required environment variables are missing.");
      return;
    }

    // Loop through active goals and send casts
    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('---');
      console.log('Processing goal:', goalData.goal);
      console.log('Goal start date:', goalData.startDate.toDate());
      console.log('Goal end date:', goalData.endDate.toDate());
      console.log('Goal completed status:', goalData.completed);

      // Skip completed goals
      if (goalData.completed === true) {
        console.log('Skipping completed goal');
        skippedCompletedGoals++;
        continue;
      }

      const fid = goalData.user_id;
      console.log('FID for this goal:', fid);

      try {
        // Fetch user data from Pinata Hub API
        const userData = await getUserDataByFid(fid);
        if (!userData) {
          console.error('Failed to fetch user data from Pinata Hub API');
          failedCasts++;
          continue;
        }

        console.log('User data fetched successfully:', userData);

        // Construct the cast message based on the number of supporters
        const supportersCount = goalData.supporters ? goalData.supporters.length : 0;
        let message;
        if (supportersCount === 0) {
          message = `@${userData.username} You've got this!`;
        } else {
          message = `@${userData.username} you're being supported on your goal, "${goalData.goal}", by ${supportersCount} supporter${supportersCount > 1 ? 's' : ''}! Keep up the great work!`;
        }

        const embedUrl = `https://empower-goal-tracker.vercel.app/api/goalShare?id=${doc.id}`;

        // Send the cast via the Neynar API
        console.log('Sending cast to Neynar...');
        console.log('Message:', message);
        console.log('Signer UUID:', process.env.NEYNAR_SIGNER);
        console.log('Channel URL:', process.env.EMPOWER_CHANNEL_URL);
        console.log('Embed URL:', embedUrl);

        const result = await sendCastToNeynar(
          process.env.NEYNAR_SIGNER,
          message,
          process.env.EMPOWER_CHANNEL_URL,
          'empower',
          embedUrl
        );

        console.log('Cast sent successfully. Neynar API response:', JSON.stringify(result, null, 2));
        successfulCasts++;

        // Add a delay to avoid rate limiting
        await delay(1000); // 1 second delay

      } catch (error) {
        failedCasts++;
        console.error('Error processing goal or sending cast:', error.message);
      }
    }
  } catch (error) {
    console.error('Error occurred during sendCast:', error.message);
  } finally {
    console.log('---');
    console.log('Cast sending summary:');
    console.log(`Successful casts: ${successfulCasts}`);
    console.log(`Failed casts: ${failedCasts}`);
    console.log(`Skipped completed goals: ${skippedCompletedGoals}`);
    console.log('sendCast script completed.');
  }
}

// Execute the sendCast function
sendCast();