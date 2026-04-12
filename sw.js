const CACHE_NAME = 'xf-notes-v2';
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

                        // API calls and external services: DO NOT intercept — let browser handle directly
                        if (url.includes('api.github.com') || url.includes('dropbox') || url.includes('api.')) {
                              return;
                        }

                        // Only handle GET requests for caching
                        if (event.request.method !== 'GET') return;

                        // Cache-first for app assets
                        event.respondWith(
                              caches.match(event.request).then(cached => {
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
