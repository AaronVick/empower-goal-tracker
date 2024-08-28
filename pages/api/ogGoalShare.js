import { db } from '../../lib/firebase';
import { ImageResponse } from '@vercel/og';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  const { id: goalId } = req.query;

  if (req.method === 'GET') {
    try {
      const goalDoc = await db.collection('goals').doc(goalId).get();
      if (!goalDoc.exists) {
        return res.status(404).json({ error: 'Goal not found' });
      }
      const goalData = goalDoc.data();

      const imageResponse = new ImageResponse(
        (
          <div
            style={{
              fontSize: 32,
              color: 'white',
              background: 'linear-gradient(to bottom right, #1E2E3D, #2D3E4D)',
              width: '100%',
              height: '100%',
              padding: '40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h1 style={{ fontSize: '48px', marginBottom: '30px', color: '#4CAF50' }}>Goal: {goalData.goal}</h1>
            <p style={{ fontSize: '24px', marginBottom: '20px' }}>Start Date: {goalData.startDate.toDate().toLocaleDateString()}</p>
            <p style={{ fontSize: '24px', marginBottom: '40px' }}>End Date: {goalData.endDate.toDate().toLocaleDateString()}</p>
            <p style={{ fontSize: '28px', color: '#FFD700' }}>Support this goal or start your own!</p>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );

      res.setHeader('Content-Type', 'image/png');
      res.status(200).send(imageResponse);
    } catch (error) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
