import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.BUILD_MOBILE === 'true' ? 'export' : 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: process.env.BUILD_MOBILE === 'true',
    formats: ['image/avif', 'image/webp'],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://s3.tradingview.com https://*.tradingview.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://accounts.google.com; img-src 'self' data: blob: https://s3.tradingview.com https://*.tradingview.com https://lh3.googleusercontent.com https://*.googleusercontent.com; connect-src 'self' https://s3.tradingview.com https://*.tradingview.com https://accounts.google.com; frame-src 'self' https://s3.tradingview.com https://*.tradingview.com https://accounts.google.com;",
        },
      ],
    },
  ],
};

export default nextConfig;
