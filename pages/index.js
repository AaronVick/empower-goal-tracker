import { useEffect } from 'react';

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  useEffect(() => {
    console.log('Home Frame Accessed');
    console.log('Base URL:', baseUrl);

    // Log Button Clicks
    document.addEventListener('click', (event) => {
      if (event.target.tagName === 'META' && event.target.getAttribute('property').startsWith('fc:frame:button')) {
        console.log(`Button clicked: ${event.target.getAttribute('content')}`);
      }
    });

    console.log('Home Frame Loaded');
  }, []);

  return (
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/api/image`} />

        {/* Start a Goal Button */}
        <meta property="fc:frame:button:1" content="Start a Goal" />
        <meta property="fc:frame:button:1:action" content="post_redirect" />
        <meta property="fc:frame:button:1:target" content={`${baseUrl}/api/start`} />

        {/* Review Goals Button */}
        <meta property="fc:frame:button:2" content="Review Goals" />
        <meta property="fc:frame:button:2:action" content="post_redirect" />
        <meta property="fc:frame:button:2:target" content={`${baseUrl}/api/reviewGoals`} />
      </head>
      <body>
        <h1>Welcome to Empower Goal Tracker</h1>
      </body>
    </html>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
