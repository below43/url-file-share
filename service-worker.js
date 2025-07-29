const CACHE_NAME = 'v12.1';

self.addEventListener('install', event => {
	console.debug('Installing service worker...', event);
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/style.css',
                '/script.js',
                '/manifest.json',
                '/icon.png',
                '/favicon.png'
            ]);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
	console.debug('Activating service worker...', event);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
						console.debug(`Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html') || event.request.url.endsWith('script.js')) {
        event.respondWith(
            fetch(event.request).then(response => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(() => {
                return caches.match(event.request);
            })
        );
    } else {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    }
});