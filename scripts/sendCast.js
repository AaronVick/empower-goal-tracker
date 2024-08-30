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
    oneof body {
      CastAddBody cast_add_body = 1;
    }
    bytes hash = 2;
    bytes signature = 3;
    bytes signer = 4;
    bytes data = 5;
  }

  message CastAddBody {
    string text = 1;
    repeated EmbedUrl embeds = 2;
    repeated uint64 mentions = 3;
    bytes parent_cast_id = 4;
    repeated string parent_url = 5;
  }

  message EmbedUrl {
    string url = 1;
  }
`;

async function sendCast() {
  try {
    // ... (previous code for checking environment variables and fetching goals remains the same)

    // Load the protobuf message type
    const root = protobuf.parse(MessageProto).root;
    const Message = root.lookupType("Message");

    for (const doc of goalsSnapshot.docs) {
      // ... (previous code for processing each goal remains the same)

      try {
        // ... (previous code for fetching display name remains the same)

        const messageText = `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters ? goalData.supporters.length : 0} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

        // Create the protobuf message
        const messageBuffer = Message.encode({
          castAddBody: {
            text: messageText,
            mentions: [parseInt(fid)],
            embeds: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}` }]
          },
          hash: Buffer.alloc(32), // Placeholder, should be filled with actual hash
          signature: Buffer.alloc(65), // Placeholder, should be filled with actual signature
          signer: Buffer.from(process.env.WARPCAST_FID, 'hex'),
          data: Buffer.alloc(0) // Optional, can be left empty
        }).finish();

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