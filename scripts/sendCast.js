const admin = require('firebase-admin');
const axios = require('axios');

console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);

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
    const response = await axios.get(`https://api.pinata.cloud/v3/farcaster/users/${fid}`, {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      }
    });

    console.log(`Response status: ${response.status}`);
    if (response.data.user) {
      return response.data.user.display_name;
    } else {
      throw new Error('User data not found in response');
    }
  } catch (error) {
    console.error(`Error fetching profile for FID ${fid}:`, error);
    return null;
  }
}

async function sendCast() {
  try {
    const db = admin.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoToday = today.toISOString().split('T')[0];
    console.log("Today's date:", isoToday);

    const goalsSnapshot = await db.collection('goals')
      .where('startDate', '<=', admin.firestore.Timestamp.fromDate(today))
      .where('endDate', '>=', admin.firestore.Timestamp.fromDate(today))
      .get();

    if (goalsSnapshot.empty) {
      console.log('No active goals found for today');
      return;
    }

    console.log(`Found ${goalsSnapshot.size} active goals`);

    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('Processing goal:', goalData.goal);
      console.log('Goal start date:', goalData.startDate.toDate().toISOString());
      console.log('Goal end date:', goalData.endDate.toDate().toISOString());

      if (goalData.startDate.toDate() <= today && goalData.endDate.toDate() >= today) {
        console.log('Goal is active today');

        const fid = goalData.user_id;
        console.log('FID for this goal:', fid);

        const displayName = await getFarcasterProfileName(fid);

        if (!displayName) {
          console.log(`No display name found for FID: ${fid}`);
          continue;
        }

        console.log(`Display name found: ${displayName}`);

        const supportersCount = goalData.supporters ? goalData.supporters.length : 0;

        const castMessage = {
          text: `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${supportersCount} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`,
          embeds: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}` }],
          mentions: [fid],
        };

        console.log('Creating cast message...');
        console.log('Cast message created:', castMessage);

        try {
          console.log('Sending cast to Pinata...');
          const castResponse = await axios.post('https://api.pinata.cloud/v3/farcaster/casts', {
            castAddBody: castMessage,
            signerId: process.env.WARPCAST_FID,
          }, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.PINATA_JWT}`,
            }
          });

          console.log('Cast sent successfully:', castResponse.data);
        } catch (error) {
          console.error('Error during Pinata lookup or cast submission:', error.response ? error.response.data : error.message);
        }
      } else {
        console.log('Goal is not active today');
      }
    }
  } catch (error) {
    console.error('Error occurred during sendCast:', error.message);
  }
}

sendCast();
