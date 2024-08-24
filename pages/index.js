import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <div>
      <Head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://empower-goal-tracker.vercel.app/empower.png" />
        <meta property="fc:frame:button:1" content="Start a Goal" />
        <meta property="fc:frame:post_url" content={`https://empower-goal-tracker.vercel.app${basePath}/api/start`} />
        <meta property="fc:frame:button:2" content="Review Goals" />
        <meta property="fc:frame:post_url:2" content={`https://empower-goal-tracker.vercel.app${basePath}/api/reviewGoals`} />
      </Head>
      <h1>Welcome to Empower Goal Tracker</h1>
      <button onClick={() => router.push('/api/start')}>Start a Goal</button>
      <button onClick={() => router.push('/api/reviewGoals')}>Review Goals</button>
    </div>
  );
}