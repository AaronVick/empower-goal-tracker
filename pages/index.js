import { useState } from 'react';

export default function Home() {
  const baseUrl = 'https://empower-goal-tracker.vercel.app';

  return (
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/api/image`} />
        <meta property="fc:frame:button:1" content="Start a Goal" />
        <meta property="fc:frame:post_url" content={`${baseUrl}/api/start`} />
        <meta property="fc:frame:button:2" content="Review Goals" />
        <meta property="fc:frame:post_url:2" content={`${baseUrl}/api/reviewGoals`} />
      </head>
      <body>
        <h1>Welcome to Empower Goal Tracker</h1>
      </body>
    </html>
  );
}

export async function getServerSideProps(context) {
  const { req, res } = context;
  console.log('getServerSideProps called');
  console.log('Request method:', req.method);

  if (req.method === 'POST') {
    try {
      const body = await getRawBody(req);
      console.log('Raw body:', body);
      const data = JSON.parse(body);
      console.log('Parsed data:', data);
      const buttonIndex = data?.untrustedData?.buttonIndex;
      console.log('Button index:', buttonIndex);

      if (buttonIndex === 1) {
        console.log('Redirecting to start goal');
        res.writeHead(302, { Location: `${process.env.NEXT_PUBLIC_BASE_PATH}/api/start` });
        res.end();
      } else if (buttonIndex === 2) {
        const fid = data?.untrustedData?.fid;
        console.log('Redirecting to review goals with FID:', fid);
        res.writeHead(302, { Location: `${process.env.NEXT_PUBLIC_BASE_PATH}/api/reviewGoals?fid=${fid}` });
        res.end();
      }
    } catch (error) {
      console.error('Error in getServerSideProps:', error);
    }
  }

  return { props: {} };
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });
}