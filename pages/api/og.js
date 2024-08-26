import { ImageResponse } from '@vercel/og';

export default function handler(req, res) {
  const { step, error } = req.query;

  let title, message;

  if (error === 'no_goal') {
    title = 'Error';
    message = 'Please enter a goal';
  } else if (error === 'invalid_start_date') {
    title = 'Error';
    message = 'Please enter a valid start date (dd/mm/yyyy)';
  } else if (error === 'invalid_end_date') {
    title = 'Error';
    message = 'Please enter a valid end date (dd/mm/yyyy)';
  } else {
    title = `Step ${step}`;
    message = 'Enter the required information';
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
        <h1>{title}</h1>
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