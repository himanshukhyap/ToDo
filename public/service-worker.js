const CACHE_NAME = 'notetask-v2-1.0.0';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE).catch(err => {
        console.log('Cache addAll error:', err);
        // Continue even if some cache fails
      });
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip API calls and special requests
  if (event.request.url.includes('/api/') || 
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached version if available
      if (response) {
        return response;
      }

      // Try network
      return fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseClone = response.clone();
          
          // Only cache GET requests for assets
          if (event.request.method === 'GET' && 
              (event.request.url.includes('.js') ||
               event.request.url.includes('.css') ||
               event.request.url.includes('.svg') ||
               event.request.url.includes('.png') ||
               event.request.url.includes('.jpg'))) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }

          return response;
        })
        .catch(err => {
          console.log('Fetch error:', err);
          // Return offline page if available
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return null;
        });
    })
  );
});

// Message event - handle messages from clients (app)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
