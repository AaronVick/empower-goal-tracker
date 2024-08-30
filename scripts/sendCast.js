const admin = require('firebase-admin');
const axios = require('axios');
const protobuf = require('protobufjs');

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

// Define the protobuf message structure
const MessageProto = `
  syntax = "proto3";

  message Message {
    uint32 type = 1;
    bytes data = 2;
    uint32 fid = 3;
    uint32 network = 4;
    bytes hash = 5;
    bytes signature = 6;
    bytes signer = 7;
  }

  message CastAddBody {
    bytes parent_cast_id = 1;
    repeated uint32 parent_urls = 2;
    string text = 3;
    repeated uint32 mentions = 4;
    repeated string embeds = 5;
  }
`;

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
      throw error;
    }

    if (!goalsSnapshot || goalsSnapshot.empty) {
      console.log('No active goals found for today');
      return;
    }

    // Load the protobuf message types
    const root = protobuf.parse(MessageProto).root;
    const Message = root.lookupType("Message");
    const CastAddBody = root.lookupType("CastAddBody");

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

          const messageText = `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters ? goalData.supporters.length : 0} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

          // Create the CastAddBody
          const castAddBody = CastAddBody.create({
            text: messageText,
            mentions: [parseInt(fid)],
            embeds: [`${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`]
          });

          // Encode the CastAddBody
          const castAddBodyBuffer = CastAddBody.encode(castAddBody).finish();

          // Create the Message
          const message = Message.create({
            type: 1, // Assuming 1 is for CastAdd
            data: castAddBodyBuffer,
            fid: parseInt(process.env.WARPCAST_FID),
            network: 1, // Set network to 1 as expected by the API
            hash: Buffer.alloc(32), // Placeholder, should be filled with actual hash
            signature: Buffer.alloc(65), // Placeholder, should be filled with actual signature
            signer: Buffer.from(process.env.WARPCAST_FID, 'hex')
          });

          // Encode the Message
          const messageBuffer = Message.encode(message).finish();

          const castResponse = await axios.post('https://hub.pinata.cloud/v1/submitMessage', 
            messageBuffer,
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
    console.error('Error occurred during sendCast:', error);
  }
}

sendCast().then(() => {
  console.log('SendCast execution completed');
  process.exit(0);
}).catch((error) => {
  console.error('SendCast execution failed:', error);
  process.exit(1);
});