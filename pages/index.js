export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || 'https://empower-goal-tracker.vercel.app';

  console.log('Home Frame Accessed');
  console.log('Base URL:', baseUrl);

  return (
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={`${baseUrl}/api/image`} />
        
        {/* Start a Goal Button */}
        <meta property="fc:frame:button:1" content="Start a Goal" />
        <meta property="fc:frame:button:1:action" content="post_redirect" />
        <meta property="fc:frame:button:1:target" content={`${baseUrl}/api/start`} />
        <script type="text/javascript">
          console.log('Button 1 (Start a Goal) initialized with target:', '{`${baseUrl}/api/start`}');
        </script>

        {/* Review Goals Button */}
        <meta property="fc:frame:button:2" content="Review Goals" />
        <meta property="fc:frame:button:2:action" content="post_redirect" />
        <meta property="fc:frame:button:2:target" content={`${baseUrl}/api/reviewGoals`} />
        <script type="text/javascript">
          console.log('Button 2 (Review Goals) initialized with target:', '{`${baseUrl}/api/reviewGoals`}');
        </script>

        {/* Script to Log Button Clicks */}
        <script type="text/javascript">
          document.addEventListener('DOMContentLoaded', () => {
            const buttons = document.querySelectorAll('meta[property^="fc:frame:button"]');
            buttons.forEach((button, index) => {
              button.addEventListener('click', () => {
                console.log(`Button ${index + 1} clicked:`, button.getAttribute('content'));
              });
            });
          });
        </script>
      </head>
      <body>
        <h1>Welcome to Empower Goal Tracker</h1>
        <script type="text/javascript">
          console.log('Home Frame Loaded');
        </script>
      </body>
    </html>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
