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

    console.log(`Today's date: ${today}`);

    // Fetch active goals from Firebase
    const goalsSnapshot = await db.collection('goals')
      .where('startDate', '<=', today)
      .where('endDate', '>=', today)
      .get();

    if (goalsSnapshot.empty) {
      console.log('No active goals found for today');
      return;
    }

    // Loop through active goals and send casts
    goalsSnapshot.forEach(async (doc) => {
      const goalData = doc.data();
      console.log(`Processing goal: ${goalData.goal}`);
      console.log(`Goal start date: ${goalData.startDate.toDate().toISOString().split('T')[0]}`);
      console.log(`Goal end date: ${goalData.endDate.toDate().toISOString().split('T')[0]}`);
      console.log(`Goal is active today`);

      const fid = goalData.user_id;
      console.log(`FID for this goal: ${fid}`);

      try {
        // Perform the FID lookup via Pinata API
        const pinataResponse = await axios.get(`https://api.pinata.cloud/v3/farcaster/user/${fid}`);
        const username = pinataResponse.data.username;
        console.log(`Username found: ${username}`);

        // Construct the message
        const message = `@${username} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters.length} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

        // Send the cast via the Farcaster API
        const castResponse = await axios.post('https://hub.pinata.cloud/v1/submitMessage', {
          castAddBody: {
            text: message,
            parent_url: `https://warpcast.com/~/channel/${process.env.EMPOWER_CHANNEL}`,
            mentions: [fid],
            mention_positions: [0]
          },
          signerId: process.env.WARPCAST_PRIVATE_KEY
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.WARPCAST_PRIVATE_KEY}`
          }
        });

        console.log('Cast sent successfully:', castResponse.data);
      } catch (error) {
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
        } else {
          console.error('Error message:', error.message);
        }
        console.error('Error during Pinata lookup or cast submission:', error);
      }
    });
  } catch (error) {
    console.error('Error occurred during sendCast:', error);
  }
}

// Execute the sendCast function
sendCast();
