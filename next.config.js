// next.config.js
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['empower-goal-tracker.vercel.app'], // Ensure this domain is listed
    unoptimized: true, // Disable Next.js image optimization
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'sharp'];
    return config;
  },
};

module.exports = nextConfig;
