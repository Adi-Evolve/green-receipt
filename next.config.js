/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa').default;

const nextConfig = withPWA({
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  output: 'export',
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
  },
});

module.exports = nextConfig;