/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['empower-goal-tracker.vercel.app'],
  },
  async rewrites() {
    return [
      {
        source: '/start',
        destination: '/api/start',
      },
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig