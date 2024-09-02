const admin = require('firebase-admin');
const { FarcasterNetwork, getInsecureHubRpcClient, makeCastAdd, NobleEd25519Signer } = require('@farcaster/hub-nodejs');
const { hexToBytes } = require('@noble/hashes/utils');

console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);

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
    const db = admin.firestore();

    console.log("Firebase initialized successfully");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log("Today's date:", today);

    const goalsSnapshot = await db.collection('goals')
      .where('startDate', '<=', admin.firestore.Timestamp.fromDate(today))
      .where('endDate', '>=', admin.firestore.Timestamp.fromDate(today))
      .get();

    if (goalsSnapshot.empty) {
      console.log('No active goals found for today');
      return;
    }

    const privateKeyBytes = hexToBytes(process.env.WARPCAST_PRIVATE_KEY.slice(2));
    const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);

    const dataOptions = {
      fid: parseInt(process.env.WARPCAST_FID),
      network: FarcasterNetwork.MAINNET,
    };

    const hubAddresses = [
      'nemes.farcaster.xyz:2282'
    ];

    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('Processing goal:', goalData.goal);

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
        continue;
      }

      const cast = castResult.value;

      for (const hubAddress of hubAddresses) {
        console.log(`Attempting to connect to hub: ${hubAddress}`);
        const client = getInsecureHubRpcClient(hubAddress);

        try {
          const submitResult = await client.submitMessage(cast);
          if (submitResult.isOk()) {
            console.log('Cast sent successfully to hub:', hubAddress);
            break;
          } else {
            console.error('Error submitting cast:', submitResult.error);
          }
        } catch (error) {
          console.error(`Failed to submit cast to hub: ${hubAddress}`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error occurred during sendCast:', error.message);
  }
}

sendCast();
