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
    // Check if Pinata credentials are set
    if (!process.env.PINATA_JWT) {
      throw new Error('PINATA_JWT is not set in the environment variables');
    }
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET) {
      console.warn('PINATA_API_KEY or PINATA_SECRET is not set. These might be needed for some operations.');
    }

    const db = admin.firestore();

    console.log("Firebase initialized successfully");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for comparison
    const isoToday = today.toISOString().split('T')[0]; // Format today's date as YYYY-MM-DD
    console.log("Today's date:", isoToday);

    // Fetch active goals from Firebase
    const goalsSnapshot = await db.collection('goals')
      .where('startDate', '<=', admin.firestore.Timestamp.fromDate(today))
      .where('endDate', '>=', admin.firestore.Timestamp.fromDate(today))
      .get();

    if (goalsSnapshot.empty) {
      console.log('No active goals found for today');
      return;
    }

    // Loop through active goals and send casts
    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('Processing goal:', goalData.goal);
      console.log('Goal start date:', goalData.startDate.toDate().toISOString().split('T')[0]);
      console.log('Goal end date:', goalData.endDate.toDate().toISOString().split('T')[0]);

      // Ensure the goal is active today
      if (goalData.startDate.toDate() <= today && goalData.endDate.toDate() >= today) {
        console.log('Goal is active today');

        const fid = goalData.user_id;
        console.log('FID for this goal:', fid);

        try {
          // Fetch the display name from Pinata API
          const response = await axios.get(`https://api.pinata.cloud/v3/farcaster/users/${fid}`, {
            headers: {
              'Authorization': `Bearer ${process.env.PINATA_JWT}`,
              'x-api-key': process.env.PINATA_API_KEY
            }
          });

          const displayName = response.data.user.display_name;
          console.log('Display name found:', displayName);

          // Construct the message
          const message = `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters ? goalData.supporters.length : 0} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

          // Send the cast via the Farcaster API
          const castResponse = await axios.post('https://hub.pinata.cloud/v1/submitMessage', {
            fid: process.env.WARPCAST_FID, // Use the FID from environment variables
            message
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.WARPCAST_PRIVATE_KEY}`
            }
          });

          console.log('Cast sent successfully:', castResponse.data);
        } catch (error) {
          console.error('Error during Pinata lookup or cast submission:', error.message);
          if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
            console.error('Error response headers:', error.response.headers);
          } else if (error.request) {
            console.error('Error request:', error.request);
          } else {
            console.error('Error message:', error.message);
          }
          console.error('Error config:', error.config);
        }
      } else {
        console.log('Goal is not active today');
      }
    }
  } catch (error) {
    console.error('Error occurred during sendCast:', error.message);
  }
}

// Execute the sendCast function
sendCast();