/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['https://empower-goal-tracker.vercel.app'],  // Replace with your actual domain if needed
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'sharp'];
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline';",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig;
