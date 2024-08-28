import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

async function getFarcasterProfileName(fid) {
  try {
    const response = await fetch(`https://api.farcaster.xyz/v2/user?fid=${fid}`);
    const data = await response.json();
    return data.result.username;
  } catch (error) {
    console.error("Error fetching Farcaster profile:", error);
    return "Unknown User";
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const goal = searchParams.get('goal');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const fid = searchParams.get('fid');

  const username = await getFarcasterProfileName(fid);

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
        <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#4CAF50' }}>{username}'s Goal</h1>
        <p style={{ fontSize: '36px', marginBottom: '30px' }}>{goal}</p>
        <p style={{ fontSize: '24px', marginBottom: '10px' }}>Start Date: {startDate}</p>
        <p style={{ fontSize: '24px', marginBottom: '30px' }}>End Date: {endDate}</p>
        <p style={{ fontSize: '28px', color: '#FFD700' }}>Support this goal or start your own!</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}