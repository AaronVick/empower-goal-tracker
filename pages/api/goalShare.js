import { db } from '../../lib/firebase';
import { ImageResponse } from '@vercel/og';
import { Timestamp } from 'firebase-admin/firestore';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';
  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get('id');

  if (req.method === 'GET') {
    // Handle GET request - display goal information
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
  } else if (req.method === 'POST') {
    // Handle POST request - support the goal
    const { untrustedData } = await req.json();
    const supporterId = untrustedData.fid;

    const goalRef = db.collection('goals').doc(goalId);
    const supporterRef = goalRef.collection('supporters').doc(supporterId.toString());

    const supporterDoc = await supporterRef.get();
    if (supporterDoc.exists) {
      const lastSupported = supporterDoc.data().supported_at.toDate();
      const now = new Date();
      if (lastSupported.toDateString() === now.toDateString()) {
        return new Response('You have already supported this goal today', { status: 400 });
      }
    }

    await supporterRef.set({
      supporter_id: supporterId,
      supported_at: Timestamp.now(),
    });

    return new Response('Goal supported successfully', { status: 200 });
  } else {
    return new Response('Method not allowed', { status: 405 });
  }
}