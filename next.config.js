/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // No pwa or next-pwa config! Manual PWA via manifest and service-worker.js in public.
};