module.exports = {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    async rewrites() {
      return [
        {
          source: '/:path*',
          destination: '/', // Route everything through the root path
        },
      ];
    },
  };
  