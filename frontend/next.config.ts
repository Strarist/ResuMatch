import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Strict React mode catches bugs early
  reactStrictMode: true,

  // Reduce bundle: don't ship source maps to client
  productionBrowserSourceMaps: false,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Transpile workspace packages
  transpilePackages: ['@resumatch/types'],

  // Headers for SSE and caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;
