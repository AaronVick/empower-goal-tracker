const admin = require('firebase-admin');
const axios = require('axios');

const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';
const USER_DATA_TYPES = {
  USERNAME: 6,
};

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

async function getFarcasterProfileName(fid) {
  console.log(`Fetching profile for FID: ${fid}`);
  try {
    const response = await fetch(`${PINATA_HUB_API}/userDataByFid?fid=${fid}&user_data_type=${USER_DATA_TYPES.USERNAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    return data.result.username;
  } catch (error) {
    console.error(`Error fetching profile for FID ${fid}:`, error);
    return null;
  }
}

// Function to send a cast
async function sendCast() {
  try {
    const db = admin.firestore();

    console.log("Firebase initialized successfully");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for comparison
    const isoToday = today.toISOString().split('T')[0]; // Format today's date as YYYY-MM-DD
    console.log("Today's date:", isoToday);

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
      console.log('Goal start date:', goalData.startDate.toDate().toISOString().split('T')[0]);
      console.log('Goal end date:', goalData.endDate.toDate().toISOString().split('T')[0]);

      if (goalData.startDate.toDate() <= today && goalData.endDate.toDate() >= today) {
        console.log('Goal is active today');

        const fid = goalData.user_id;
        console.log('FID for this goal:', fid);

        const username = await getFarcasterProfileName(fid);

        if (username) {
          console.log('Username found:', username);

          const message = `@${username} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters.length} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

          console.log('Constructed message:', message);

          try {
            const castResponse = await axios.post('https://hub.pinata.cloud/v1/submitMessage', {
              fid,
              message
            }, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.WARPCAST_PRIVATE_KEY}`
              }
            });

            console.log('Cast sent successfully:', castResponse.data);
          } catch (error) {
            console.error('Error during cast submission:', error.message);
            console.error('Full error details:', error);
          }
        } else {
          console.log('No username found for FID:', fid);
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
