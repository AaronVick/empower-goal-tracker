export default function Home() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const fullBasePath = `https://empower-goal-tracker.vercel.app${basePath}`;

  return (
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${fullBasePath}/empower.png`} />
        <meta property="fc:frame:button:1" content="Start a Goal" />
        <meta property="fc:frame:post_url" content={`${fullBasePath}/api/start`} />
        <meta property="fc:frame:button:2" content="Review Goals" />
        <meta property="fc:frame:post_url:2" content={`${fullBasePath}/api/reviewGoals`} />
      </head>
      <body>
        <h1>Welcome to Empower Goal Tracker</h1>
      </body>
    </html>
  );
}

export async function getStaticProps() {
  return {
    props: {}, // will be passed to the page component as props
  };
}