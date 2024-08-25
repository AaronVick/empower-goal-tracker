/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['empower-goal-tracker.vercel.app'],
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals = [...config.externals, 'sharp'];
    return config;
  },
  // Add this to ensure all routes are treated as dynamic
  trailingSlash: true,
};

module.exports = nextConfig;