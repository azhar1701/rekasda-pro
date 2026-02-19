const CACHE_NAME = 'rekasda-pro-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Guard: Ignore non-http/https requests (chrome-extension://, file://, data:)
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Guard: Ignore non-GET requests (POST, PUT, DELETE should not be cached)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    }).catch(() => {
      // Fallback for offline
      return new Response('Offline', { status: 503 });
    })
  );
});
