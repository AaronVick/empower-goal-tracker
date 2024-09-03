const admin = require('firebase-admin');
const axios = require('axios');
const { NeynarAPIClient } = require("@neynar/nodejs-sdk");

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

    // Initialize Neynar API Client
    if (!process.env.NEYNAR_API) {
      console.error("Error: NEYNAR_API key is missing or undefined.");
      return;
    }

    const neynarClient = new NeynarAPIClient(process.env.NEYNAR_API);

    // Loop through active goals and send casts
    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('Processing goal:', goalData.goal);
      console.log('Goal start date:', goalData.startDate.toDate());
      console.log('Goal end date:', goalData.endDate.toDate());

      const fid = goalData.user_id;
      console.log('FID for this goal:', fid);

      try {
        // Fetch the display name and custody address using Pinata's open API
        const response = await axios.get(`https://api.pinata.cloud/v3/farcaster/users/${fid}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const displayName = response.data.user.display_name;
        const custodyAddress = response.data.user.custody_address;

        console.log('Display name found:', displayName);
        console.log('Custody address found:', custodyAddress);

        if (!displayName || !custodyAddress) {
          console.error('Error: Display name or custody address not found.');
          continue;
        }

        // Construct the cast message
        const message = `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters ? goalData.supporters.length : 0} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

        const memesChannelUrl = "chain://eip155:1/erc721:0xfd8427165df67df6d7fd689ae67c8ebf56d9ca61";  // Replace with your channel's parent_url

        // Send the cast via the Neynar API
        const result = await neynarClient.publishCast(custodyAddress, message, {
          embeds: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}` }],
          replyTo: memesChannelUrl,  // Replace with your channel's URL
        });

        console.log('Cast sent successfully:', result);
      } catch (error) {
        console.error('Error during Pinata lookup or Neynar cast submission:', error.message);
      }
    }
  } catch (error) {
    console.error('Error occurred during sendCast:', error.message);
  }
}

// Execute the sendCast function
sendCast();
