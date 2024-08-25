import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  // Log during the component's render
  console.log('Rendering Home component');
  console.log('Base Path:', basePath);

  useEffect(() => {
    console.log('Home component mounted');
    return () => {
      console.log('Home component unmounted');
    };
  }, []);

  // Additional logging for route clicks
  const handleStartGoalClick = () => {
    console.log('Start a Goal button clicked');
    router.push('/api/start');
  };

  const handleReviewGoalsClick = () => {
    console.log('Review Goals button clicked');
    router.push('/api/review');
  };

  return (
    <div>
      <Head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${basePath}/empower.png`} />
        <meta property="fc:frame:button:1" content="Start a Goal" />
        <meta property="fc:frame:post_url" content={`${basePath}/api/start`} />
        <meta property="fc:frame:button:2" content="Review Goals" />
        <meta property="fc:frame:post_url:2" content={`${basePath}/api/review`} />
      </Head>
      <h1>Welcome to Empower Goal Tracker</h1>
      <button onClick={handleStartGoalClick}>Start a Goal</button>
      <button onClick={handleReviewGoalsClick}>Review Goals</button>
    </div>
  );
}
