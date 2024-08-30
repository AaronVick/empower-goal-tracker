const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

// Function to send a cast
async function sendCast() {
  try {
    const db = admin.firestore();
    console.log("Firebase initialized successfully");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for comparison
    console.log("Today's date:", today);

    // Fetch active goals from Firebase
    const goalsSnapshot = await db.collection('goals')
      .where('startDate', '<=', admin.firestore.Timestamp.fromDate(today))
      .where('endDate', '>=', admin.firestore.Timestamp.fromDate(today))
      .get();

    if (goalsSnapshot.empty) {
      console.log('No active goals found for today');
      return;
    }

    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('Processing goal:', goalData.goal);
      console.log('Goal start date:', goalData.startDate.toDate());
      console.log('Goal end date:', goalData.endDate.toDate());

      const fid = goalData.user_id;
      console.log('FID for this goal:', fid);

      try {
        // Fetch the display name from Pinata API
        const response = await axios.get(`https://api.pinata.cloud/v3/farcaster/users/${fid}`, {
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`
          }
        });

        const displayName = response.data.user.display_name;
        console.log('Display name found:', displayName);

        // Construct the message
        const message = `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters ? goalData.supporters.length : 0} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

        // Send the cast via the Farcaster API
        const castResponse = await axios.post('https://hub.pinata.cloud/v1/submitMessage', {
          fid,
          message
        }, {
          headers: {
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
        }
      }
    }
  } catch (error) {
    console.error('Error occurred during sendCast:', error.message);
  }
}

// Execute the sendCast function
sendCast();
