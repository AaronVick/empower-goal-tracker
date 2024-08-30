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

    for (const doc of goalsSnapshot.docs) {
      const goalData = doc.data();
      console.log('Processing goal:', goalData.goal);
      const fid = goalData.user_id;
      console.log('FID for this goal:', fid);

      try {
        // Perform the FID lookup to get the profile information
        const pinataResponse = await axios.get(`https://api.pinata.cloud/v3/farcaster/users/${fid}`, {
          headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
        });

        const userData = pinataResponse.data.user;
        const displayName = userData.display_name;
        const custodyAddress = userData.custody_address; // Use this as the signerId

        console.log('Display name found:', displayName);

        // Construct the cast message
        const castMessage = {
          text: `@${displayName} you're being supported on your goal, "${goalData.goal}", by ${goalData.supporters.length} supporters! Keep up the great work!\n\n${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}`,
          embeds: [{ url: `${process.env.NEXT_PUBLIC_BASE_PATH}/goalShare?id=${doc.id}` }],
          mentions: [fid],
        };

        console.log('Cast message created:', castMessage);

        // Send the cast via Pinata
        const castResponse = await axios.post('https://api.pinata.cloud/v3/farcaster/casts', {
          castAddBody: castMessage,
          signerId: custodyAddress,  // Use the custody address as the signerId
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
        });

        console.log('Cast sent successfully:', castResponse.data);
      } catch (error) {
        console.error('Error during Pinata lookup or cast submission:', error.response ? error.response.data : error.message);
      }
    }
  } catch (error) {
    console.error('Error occurred during sendCast:', error.message);
  }
}

sendCast();
