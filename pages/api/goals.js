import { db } from '../../firebase';
import { Message } from '@farcaster/core';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { trustedData, goal, startDate, endDate } = req.body;

    try {
      const frameMessage = Message.decode(Buffer.from(trustedData.messageBytes, 'hex'));
      const userFID = frameMessage.data.fid;

      const startTimestamp = convertToTimestamp(startDate, true);
      const endTimestamp = convertToTimestamp(endDate, false);

      await db.collection('goals').add({
        user_id: userFID,
        goal,
        startDate: startTimestamp,
        endDate: endTimestamp,
        createdAt: admin.firestore.Timestamp.now(),
      });

      res.status(200).json({ message: 'Goal set successfully' });
    } catch (error) {
      console.error("Error setting goal in Firebase:", error);
      res.status(500).json({ error: 'Failed to set goal' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function convertToTimestamp(dateString, isStart) {
  const [day, month, year] = dateString.split('/');
  const date = new Date(`${year}-${month}-${day}`);

  if (date.toDateString() === new Date().toDateString()) {
    return admin.firestore.Timestamp.fromDate(new Date());
  } else {
    if (isStart) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }
    return admin.firestore.Timestamp.fromDate(date);
  }
}
