const admin = require('firebase-admin');
const axios = require('axios');

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

async function sendCast() {
  try {
    if (!process.env.PINATA_JWT) {
      throw new Error('PINATA_JWT is not set in the environment variables');
    }
    if (!process.env.PINATA_API_KEY || !process.env.PINATA_SECRET) {
      console.warn('PINATA_API_KEY or PINATA_SECRET is not set. These might be needed for some operations.');
    }

    const db = admin.firestore();
    console.log("Firebase initialized successfully");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoToday = today.toISOString().split('T')[0];
    console.log("Today's date:", isoToday);

    let goalsSnapshot;
    try {
      goalsSnapshot = await db.collection('goals')
        .where('startDate', '<=', admin.firestore.Timestamp.fromDate(today))
        .where('endDate', '>=', admin.firestore.Timestamp.fromDate(today))
        .get();
      
      console.log(`Found ${goalsSnapshot.size} active goals`);
    } catch (error) {
      console.error('Error fetching goals from Firebase:', error);
      throw error; // Re-throw the error to be caught in the outer catch block
    }

    if (goalsSnapshot.empty) {
      console.log('No active goals found for today');
      return;
    }

    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('Processing goal:', goalData.goal);
      console.log('Goal start date:', goalData.startDate.toDate().toISOString());
      console.log('Goal end date:', goalData.endDate.toDate().toISOString());

      if (goalData.startDate.toDate() <= today && goalData.endDate.toDate() >= today) {
        console.log('Goal is active today');

        const fid = goalData.user_id;
        console.log('FID for this goal:', fid);

        try {
          const response = await axios.get(`https://api.pinata.cloud/v3/farcaster/users/${fid}`, {
            headers: {
              'Authorization': `Bearer ${process.env.PINATA_JWT}`,
              'x-api-key': process.env.PINATA_API_KEY
            }
          });

          const displayName = response.data.user.display_name;
          console.log('Display name found:', displayName);

          const message = `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters ? goalData.supporters.length : 0} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

          const castResponse = await axios.post('https://hub.pinata.cloud/v1/submitMessage', 
            JSON.stringify({
              fid: parseInt(process.env.WARPCAST_FID),
              message: {
                type: 1,
                data: Buffer.from(message).toString('hex')
              }
            }),
            {
              headers: {
                'Content-Type': 'application/octet-stream',
                'Authorization': `Bearer ${process.env.WARPCAST_PRIVATE_KEY}`
              }
            }
          );

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

sendCast().then(() => {
  console.log('SendCast execution completed');
  process.exit(0);
}).catch((error) => {
  console.error('SendCast execution failed:', error);
  process.exit(1);
});