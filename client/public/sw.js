const CACHE_NAME = 'omnimanage-offline-v1';
const OFFLINE_FALLBACK_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  OFFLINE_FALLBACK_URL,
  '/logo.svg',
  '/favicon.svg',
  '/favicon.ico',
];

// Install: Cache offline essentials immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Handle network failures by serving offline fallback for navigations
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Never intercept non-GET or chrome-extension requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // API and upload requests should go directly to server
  if (request.url.includes('/api/') || request.url.includes('/uploads/')) {
    return;
  }

  // Navigation requests (user opening or reloading pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOfflinePage = await cache.match(OFFLINE_FALLBACK_URL);
        return cachedOfflinePage || Response.error();
      })
    );
    return;
  }

  // For cached static assets (like logo, favicon, offline.html)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).catch(() => {
        // Fallback for image requests if any
        if (request.destination === 'image') {
          return caches.match('/logo.svg');
        }
        return Response.error();
      });
    })
  );
});
