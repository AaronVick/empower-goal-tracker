import Head from 'next/head';

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  return (
    <>
      <Head>
        <title>Empower Goal Tracker</title>
        <meta name="description" content="Track and achieve your goals with Empower" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/api/image`} />
        <meta property="fc:frame:button:1" content="Start a Goal" />
        <meta property="fc:frame:button:1:action" content="post" />
        <meta property="fc:frame:button:1:target" content={`${baseUrl}/api/start`} />
        <meta property="fc:frame:button:2" content="Review Goals" />
        <meta property="fc:frame:button:2:action" content="post" />
        <meta property="fc:frame:button:2:target" content={`${baseUrl}/api/reviewing`} />
      </Head>
      <main>
        <h1>Welcome to Empower Goal Tracker</h1>
        <p>Set and track your goals with ease!</p>
      </main>
    </>
  );
}

// If you need any server-side logic, you can use getServerSideProps
export async function getServerSideProps(context) {
  // You can perform any server-side operations here if needed
  // For now, we're just returning an empty props object
  return {
    props: {}, // will be passed to the page component as props
  };
}