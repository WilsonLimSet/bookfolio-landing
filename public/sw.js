// Service Worker for Bookfolio - Image Caching
const CACHE_NAME = 'bookfolio-covers-v1';

// Image domains to cache
const CACHEABLE_ORIGINS = [
  'covers.openlibrary.org',
  'supabase.co'
];

// Install event - pre-cache nothing, we'll cache on demand
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('bookfolio-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache images with stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only cache images from specific domains
  const shouldCache = CACHEABLE_ORIGINS.some(origin => url.hostname.includes(origin));

  if (!shouldCache || event.request.method !== 'GET') {
    return;
  }

  // Check if it's an image request
  const isImage = event.request.destination === 'image' ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname);

  if (!isImage) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try to get from cache first
      const cachedResponse = await cache.match(event.request);

      // Fetch fresh version in background
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache successful responses
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, return cached version if available
        return cachedResponse;
      });

      // Return cached version immediately if available (stale-while-revalidate)
      // Otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for messages to clear cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});
