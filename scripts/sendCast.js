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

    // Loop through active goals and send casts
    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('Processing goal:', goalData.goal);
      console.log('Goal start date:', goalData.startDate.toDate());
      console.log('Goal end date:', goalData.endDate.toDate());

      const fid = goalData.user_id;
      console.log('FID for this goal:', fid);

      try {
        // Fetch the display name and custody address from Pinata API
        const response = await axios.get(`https://api.pinata.cloud/v3/farcaster/users/${fid}`, {
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`,
            'Content-Type': 'application/json'
          }
        });

        const displayName = response.data.user.display_name;
        const custodyAddress = response.data.user.custody_address;

        console.log('Display name found:', displayName);
        console.log('Custody address found:', custodyAddress);

        // Construct the cast message
        const message = `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters ? goalData.supporters.length : 0} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

        const castAddBody = {
          text: message,
          embeds: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}` }],
          mentions: [fid]
        };

        const requestBody = JSON.stringify({
          castAddBody: castAddBody,
          signerId: custodyAddress,
        });

        // Send the cast via the Farcaster API
        const castResponse = await axios.post('https://api.pinata.cloud/v3/farcaster/casts', requestBody, {
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`,
            'Content-Type': 'application/json'
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
