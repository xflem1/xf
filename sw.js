const CACHE_NAME = 'xf-notes-v1';
const ASSETS = ['./', 'manifest.json', 'icon-192.png', 'icon-512.png'];

// Cache app shell on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Clean old caches on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for API calls, cache-first for app files
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Always go to network for Dropbox API calls
  if (url.includes('dropbox') || url.includes('api.')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for app assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      // Return cached version, but also update cache in background
      const fetchPromise = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
