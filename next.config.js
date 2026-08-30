const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [
    /chunks\/pages\/admin\/.*$/,
    /chunks\/pages\/login.*$/,
    /chunks\/pages\/index.*$/,
    /chunks\/pages\/register.*$/,
  ],
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 32, maxAgeSeconds: 3600 },
      },
    },
    {
      urlPattern: /\/icons\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'icons',
        expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 3600 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
};

module.exports = withPWA(nextConfig);
