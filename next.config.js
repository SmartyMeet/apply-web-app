/** @type {import('next').NextConfig} */
const nextConfig = {

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
  
  // Pass server-side env vars so they are available at SSR runtime
  env: {
    PUBLISH_APPLY_EVENT_URL: process.env.PUBLISH_APPLY_EVENT_URL,
  },

  // Enable standalone output for containerized deployments
  output: 'standalone',
  
  // Strict mode for development
  reactStrictMode: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
};

module.exports = nextConfig;