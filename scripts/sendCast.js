const admin = require('firebase-admin');
const axios = require('axios');

// ... (previous code remains the same)

async function sendCast() {
  try {
    // ... (previous code remains the same)

    for (const doc of goalsSnapshot.docs) {
      // ... (previous code remains the same)

      try {
        // Fetch the display name from Pinata API
        const response = await axios.get(`https://api.pinata.cloud/v3/farcaster/users/${fid}`, {
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`,
            'x-api-key': process.env.PINATA_API_KEY
          }
        });

        const displayName = response.data.user.display_name;
        console.log('Display name found:', displayName);

        // Construct the message
        const message = `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters ? goalData.supporters.length : 0} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`;

        // Send the cast via the Farcaster API
        const castResponse = await axios.post('https://hub.pinata.cloud/v1/submitMessage', 
          JSON.stringify({
            fid: parseInt(process.env.WARPCAST_FID),
            message: {
              type: 1,  // Assuming type 1 is for text messages
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
    }
  } catch (error) {
    console.error('Error occurred during sendCast:', error.message);
  }
}

// Execute the sendCast function
sendCast();