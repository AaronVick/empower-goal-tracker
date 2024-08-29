const admin = require('firebase-admin');
const axios = require('axios');

// Log the Firebase project ID to confirm it's being passed correctly
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);

// Initialize Firebase with the service account details
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});

// Function to send a cast
async function sendCast() {
  try {
    const db = admin.firestore();

    // Log a confirmation that Firebase was initialized
    console.log("Firebase initialized successfully");

    const today = new Date().toISOString().split('T')[0]; // Format today's date as YYYY-MM-DD
    console.log("Today's date:", today);

    // Fetch active goals from Firebase
    const goalsSnapshot = await db.collection('goals')
      .where('startDate', '<=', today)
      .where('endDate', '>=', today)
      .get();

    if (goalsSnapshot.empty) {
      console.log('No active goals found for today');
      return;
    }

    console.log(`Found ${goalsSnapshot.size} active goal(s) for today.`);

    // Loop through active goals and send casts
    goalsSnapshot.forEach(async (doc) => {
      const goalData = doc.data();
      console.log('Processing goal:', goalData.goal);

      // Assuming the FID is stored in user_id
      const fid = goalData.user_id;
      console.log('FID:', fid);

      // Lookup username via Pinata API
      const pinataResponse = await axios.get(`https://api.pinata.cloud/v3/farcaster/user/${fid}`, {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_API_KEY}`
        }
      });

      const username = pinataResponse.data.user.username;
      console.log('Username found:', username);

      // Construct the message
      const message = `@${username} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters.length} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;
      console.log('Constructed message:', message);

      // Send the cast via the Farcaster API
      const castResponse = await axios.post('https://hub.pinata.cloud/v1/submitMessage', {
        fid,
        message
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WARPCAST_PRIVATE_KEY}`
        }
      });

      console.log('Cast sent successfully:', castResponse.data);
    });
  } catch (error) {
    console.error('Error occurred during sendCast:', error);
  }
}

// Execute the sendCast function
sendCast();
