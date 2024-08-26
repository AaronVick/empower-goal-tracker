import { ImageResponse } from '@vercel/og';

export default function handler(req) {
  const { error } = req.query;

  let message;

  switch (error) {
    case 'no_goal':
      message = 'Please enter a goal';
      break;
    case 'invalid_start_date':
      message = 'Please enter a valid start date (dd/mm/yyyy)';
      break;
    case 'invalid_end_date':
      message = 'Please enter a valid end date (dd/mm/yyyy)';
      break;
    default:
      message = 'An error occurred';
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          color: 'black',
          background: 'white',
          width: '100%',
          height: '100%',
          padding: '50px 200px',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <h1>Error</h1>
        <p>{message}</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}

export const config = {
  runtime: 'edge',
};