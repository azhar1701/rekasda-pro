const CACHE_NAME = 'hydrofield-v2';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Check if cached response is still valid
        if (response) {
          const cachedDate = response.headers.get('sw-cache-date');
          if (cachedDate) {
            const cacheAge = Date.now() - parseInt(cachedDate);
            if (cacheAge > CACHE_EXPIRY) {
              // Cache expired, try network first
              return fetchAndCache(event.request).catch(() => response);
            }
          }
          return response;
        }
        
        // No cache, try network
        return fetchAndCache(event.request);
      })
      .catch(() => {
        // Network failed, try cache as fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        throw new Error('Network and cache failed');
      })
  );
});

function fetchAndCache(request) {
  return fetch(request).then(response => {
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response;
    }
    
    const responseToCache = response.clone();
    const headers = new Headers(responseToCache.headers);
    headers.set('sw-cache-date', Date.now().toString());
    
    const modifiedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headers
    });
    
    caches.open(CACHE_NAME)
      .then(cache => {
        cache.put(request, modifiedResponse);
      });
    
    return response;
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    const syncQueue = JSON.parse(localStorage.getItem('hydrofield_sync_queue') || '[]');
    for (const item of syncQueue) {
      await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    }
    localStorage.removeItem('hydrofield_sync_queue');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}