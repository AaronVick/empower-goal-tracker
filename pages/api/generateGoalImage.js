import { ImageResponse } from '@vercel/og';
import { db } from '../../lib/firebase';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get('id');

  try {
    const goalDoc = await db.collection('goals').doc(goalId).get();
    if (!goalDoc.exists) {
      return new Response('Goal not found', { status: 404 });
    }
    const goalData = goalDoc.data();

    return new ImageResponse(
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
  } catch (error) {
    console.error("Error generating goal image:", error);
    return new Response('Error generating image', { status: 500 });
  }
}