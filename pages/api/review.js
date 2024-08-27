import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const goal = searchParams.get('goal');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          color: 'black',
          background: 'linear-gradient(to bottom right, #f0f0f0, #e0e0e0)',
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
        <h1 style={{ fontSize: '56px', marginBottom: '30px', color: '#4a4a4a' }}>Goal Review</h1>
        <div style={{ 
          fontSize: '36px', 
          marginBottom: '20px', 
          padding: '20px', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '80%', 
          wordWrap: 'break-word' 
        }}>
          <strong style={{ color: '#2c3e50' }}>Goal:</strong> {goal}
        </div>
        <div style={{ 
          fontSize: '28px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          width: '100%', 
          maxWidth: '600px' 
        }}>
          <span>
            <strong style={{ color: '#27ae60' }}>Start:</strong> {startDate}
          </span>
          <span>
            <strong style={{ color: '#e74c3c' }}>End:</strong> {endDate}
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}