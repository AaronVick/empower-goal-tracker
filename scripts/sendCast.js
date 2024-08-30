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

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for comparison
    console.log("Today's date:", today.toISOString().split('T')[0]);

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
          // Perform FID lookup using an open API endpoint
          const pinataResponse = await axios.get(`https://api.pinata.cloud/v3/farcaster/user/${fid}`);

          if (pinataResponse.status === 200) {
            const username = pinataResponse.data.result.username;
            console.log('Username found:', username);

            // Construct the message
            const message = `@${username} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters.length} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

            // Send the cast via the Farcaster API
            const castResponse = await axios.post('https://hub.pinata.cloud/v1/submitMessage', {
              castAddBody: {
                text: message,
              },
              signerId: process.env.WARPCAST_PRIVATE_KEY
            }, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.WARPCAST_PRIVATE_KEY}`
              }
            });

            console.log('Cast sent successfully:', castResponse.data);
          } else {
            console.error('FID lookup failed with status:', pinataResponse.status);
          }
        } catch (error) {
          console.error('Error during Pinata lookup or cast submission:', error.message);
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
