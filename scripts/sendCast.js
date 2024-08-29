const fetch = require('node-fetch');
const admin = require('firebase-admin');
const axios = require('axios');
const { Message, NobleEd25519Signer, FarcasterNetwork, makeCastAdd } = require('@farcaster/core');
const { hexToBytes } = require('@noble/hashes/utils');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
});

const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';

async function getUserDataByFid(fid) {
    console.log(`Fetching user data for FID: ${fid}`);
    try {
        const response = await axios.get(`${PINATA_HUB_API}/userDataByFid`, {
            params: { fid, user_data_type: 6 }, // 6 corresponds to USERNAME
            timeout: 10000
        });
        console.log(`User data for FID ${fid}:`, response.data.data.userDataBody.value);
        return response.data.data.userDataBody.value;
    } catch (error) {
        console.error(`Error getting user data for FID ${fid}:`, error.message);
        return null;
    }
}

async function sendCast() {
    console.log('Starting sendCast function');
    
    const db = admin.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Normalize time to start of the day

    console.log('Querying Firebase for active goals today');
    const goalsSnapshot = await db.collection('goals')
        .where('startDate', '<=', today)
        .where('endDate', '>=', today)
        .get();

    if (goalsSnapshot.empty) {
        console.log('No active goals found for today.');
        return;
    }

    console.log(`${goalsSnapshot.size} active goals found.`);

    const privateKey = process.env.WARPCAST_PRIVATE_KEY;
    const FID = parseInt(process.env.WARPCAST_FID, 10);
    const privateKeyBytes = hexToBytes(privateKey.slice(2));
    const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);

    for (const goalDoc of goalsSnapshot.docs) {
        const goalData = goalDoc.data();
        const goalId = goalDoc.id;
        const userFid = goalData.user_id;
        const goalName = goalData.goal;
        const uniqueSupporterCount = goalData.supporters ? goalData.supporters.length : 0;

        console.log(`Processing goal "${goalName}" for FID ${userFid}.`);

        // Get the username using Pinata API
        const userName = await getUserDataByFid(userFid);
        if (!userName) {
            console.log(`No username found for FID ${userFid}. Skipping.`);
            continue;
        }

        // Construct the cast message
        const message = `@${userName} you're being supported on your goal, ${goalName}, by ${uniqueSupporterCount} supporters! Keep up the great work!\n\nhttps://empower-goal-tracker.vercel.app/api/goalShare?id=${goalId}`;
        console.log(`Constructed message for ${userName}: ${message}`);

        const castBody = {
            text: message,
            embeds: [],
            parentUrl: `https://warpcast.com/~/channel/empower`,
        };

        const dataOptions = {
            fid: FID,
            network: FarcasterNetwork.MAINNET,
        };

        try {
            console.log('Creating cast request');
            const castAddReq = await makeCastAdd(castBody, dataOptions, ed25519Signer);
            const castAdd = castAddReq._unsafeUnwrap();
            const messageBytes = Buffer.from(Message.encode(castAdd).finish());

            console.log('Sending cast to Pinata API');
            const response = await fetch('https://hub.pinata.cloud/v1/submitMessage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
                body: messageBytes,
            });

            const castResult = await response.json();
            console.log('Cast sent successfully:', castResult);
        } catch (error) {
            console.error('Error sending cast:', error.message);
        }
    }

    console.log('Finished processing all goals.');
}

sendCast().catch(console.error);
