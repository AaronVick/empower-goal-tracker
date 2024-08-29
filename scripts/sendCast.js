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

// Function to format a Firebase timestamp to YYYY-MM-DD
function formatDate(timestamp) {
  return timestamp.toDate().toISOString().split('T')[0];
}

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
      .get();

    if (goalsSnapshot.empty) {
      console.log('No goals found in the database');
      return;
    }

    // Loop through active goals and filter those active for today
    goalsSnapshot.forEach(async (doc) => {
      const goalData = doc.data();
      const startDate = formatDate(goalData.startDate);
      const endDate = formatDate(goalData.endDate);

      console.log('Processing goal:', goalData.goal);
      console.log('Goal start date:', startDate);
      console.log('Goal end date:', endDate);

      // Check if the goal is active for today
      if (startDate <= today && endDate >= today) {
        console.log('Goal is active today');
        
        // Assuming the FID is stored in user_id
        const fid = goalData.user_id;
        console.log('FID for this goal:', fid);

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
      } else {
        console.log('Goal is not active today');
      }
    });
  } catch (error) {
    console.error('Error occurred during sendCast:', error);
  }
}

// Execute the sendCast function
sendCast();
