const admin = require('firebase-admin');
const { FarcasterNetwork, getInsecureHubRpcClient, makeCastAdd, NobleEd25519Signer } = require('@farcaster/hub-nodejs');
const { hexToBytes } = require('@noble/hashes/utils');

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

    // Set up Farcaster signer
    const privateKeyBytes = hexToBytes(process.env.WARPCAST_PRIVATE_KEY.slice(2));
    const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);

    const dataOptions = {
      fid: parseInt(process.env.WARPCAST_FID),
      network: FarcasterNetwork.MAINNET,  // Use MAINNET instead of TESTNET
    };

    // Loop through active goals and send casts
    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('Processing goal:', goalData.goal);

      // Construct the cast message
      const message = `@${goalData.user_name} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters ? goalData.supporters.length : 0} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

      const mentionIndex = message.indexOf(`@${goalData.user_name}`);
      const mentions = [parseInt(goalData.user_id)];
      const mentionsPositions = [mentionIndex];

      const castResult = await makeCastAdd(
        {
          text: message,
          embeds: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}` }],
          mentions,
          mentionsPositions
        },
        dataOptions,
        ed25519Signer
      );

      if (castResult.isErr()) {
        console.error('Error creating cast:', castResult.error);
        continue;  // Skip to the next goal if there's an error
      }

      const cast = castResult.value;

      // Submit the cast to the Farcaster network
      const client = getInsecureHubRpcClient('farcaster.xyz:2283');  // Mainnet Hub URL
      const submitResult = await client.submitMessage(cast);

      if (submitResult.isErr()) {
        console.error('Error submitting cast:', submitResult.error);
        continue;
      }

      console.log('Cast sent successfully:', submitResult.value);
    }
  } catch (error) {
    console.error('Error occurred during sendCast:', error.message);
  }
}

// Execute the sendCast function
sendCast();
