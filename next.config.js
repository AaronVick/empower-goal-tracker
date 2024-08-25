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
};

module.exports = nextConfig;