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

export async function getServerSideProps() {
  return { props: {} };
}