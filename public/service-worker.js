// Simple service worker for PWA offline support
const CACHE_NAME = 'greenreceipt-cache-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/generate-receipt',
  '/dashboard/inventory-management',
  '/dashboard/customer-analytics',
  '/analytics',
  '/profile',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});
