import { db } from '../../lib/firebase';

export default async function handler(req, res) {
  const { id: goalId } = req.query;

  if (req.method === 'GET') {
    try {
      const goalDoc = await db.collection('goals').doc(goalId).get();
      if (!goalDoc.exists) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      const goalData = goalDoc.data();

      res.status(200).json({
        goal: goalData.goal,
        startDate: goalData.startDate.toDate().toLocaleDateString(),
        endDate: goalData.endDate.toDate().toLocaleDateString()
      });
    } catch (error) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}