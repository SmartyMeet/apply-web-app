const smEnv = process.env.SM_ENV || 'dev';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose SM_ENV-derived values to client-side code
  env: {
    NEXT_PUBLIC_THEME_BASE_URL: process.env.NEXT_PUBLIC_THEME_BASE_URL || `https://sm-${smEnv}-tb-core-cdn-bucket.s3.us-east-1.amazonaws.com`,
    NEXT_PUBLIC_CDN_BASE_URL: process.env.NEXT_PUBLIC_CDN_BASE_URL || `https://sm-${smEnv}-tb-core-cdn-bucket.s3.us-east-1.amazonaws.com`,
  },

  // Allow images from CDN
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.smartytalent.eu',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.smartytalent.eu',
        pathname: '/**',
      },
    ],
  },
  
  // Enable standalone output for containerized deployments
  output: 'standalone',
  
  // Strict mode for development
  reactStrictMode: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
};

module.exports = nextConfig;