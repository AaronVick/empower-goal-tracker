import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const PINATA_HUB_API = 'https://hub.pinata.cloud/v1';
const USER_DATA_TYPES = {
  USERNAME: 6,
};

async function getFarcasterProfileName(fid) {
  console.log(`Fetching profile for FID: ${fid}`);
  try {
    const response = await fetch(`${PINATA_HUB_API}/userDataByFid?fid=${fid}&user_data_type=${USER_DATA_TYPES.USERNAME}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Data received from Pinata:', JSON.stringify(data, null, 2));
    
    return data?.data?.userDataBody?.value || 'Unknown User';
  } catch (error) {
    console.error("Error fetching Farcaster profile from Pinata:", error);
    return 'Unknown User';
  }
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const goal = searchParams.get('goal');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const fid = searchParams.get('fid');

  console.log('Generating image for FID:', fid);
  const username = await getFarcasterProfileName(fid);
  console.log('Username fetched:', username);

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
