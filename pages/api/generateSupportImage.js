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
        <h1 style={{ fontSize: '48px', marginBottom: '30px', color: '#4CAF50' }}>Support Confirmed!</h1>
        <p style={{ fontSize: '36px', marginBottom: '20px' }}>You've supported {username}'s goal:</p>
        <p style={{ fontSize: '32px', marginBottom: '40px' }}>{goal}</p>
        <p style={{ fontSize: '28px', color: '#FFD700' }}>Thank you for your support!</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}