import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'http://127.0.0.1:3005',
    'http://localhost:3005',
    'http://127.0.0.1',
    'http://localhost',
    '127.0.0.1',
    'localhost',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
