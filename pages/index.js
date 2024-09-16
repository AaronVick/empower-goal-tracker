import { db } from '../lib/firebase';

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  return (
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/api/image`} />
        <meta property="fc:frame:button:1" content="Start a Goal" />
        <meta property="fc:frame:button:2" content="Review Goals" />
        <meta property="fc:frame:post_url" content={`${baseUrl}/api`} />
      </head>
      <body>
        <h1>Welcome to Empower Goal Tracker</h1>
      </body>
    </html>
  );
}

export async function getServerSideProps(context) {
  if (context.req.method === 'POST') {
    const body = await readBody(context.req);
    const { untrustedData } = JSON.parse(body);
    const buttonIndex = parseInt(untrustedData.buttonIndex);
    const fid = untrustedData.fid;

    if (buttonIndex === 1) {
      // "Start a Goal" was clicked
      console.log('Start a Goal button clicked');

      // Initialize a session for the user
      await db.collection('sessions').doc(fid.toString()).set({
        currentStep: 'start',
        fid: fid
      });

      return {
        redirect: {
          destination: `/api/start?fid=${fid}`,
          permanent: false,
        },
      };
    } else if (buttonIndex === 2) {
      // "Review Goals" was clicked
      console.log('Review Goals button clicked');
      return {
        redirect: {
          destination: `/api/reviewGoals?fid=${fid}`,
          permanent: false,
        },
      };
    }
  }

  return { props: {} };
}

// Helper function to read the request body
function readBody(req) {
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