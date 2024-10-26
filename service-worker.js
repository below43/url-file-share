self.addEventListener('install', event =>
{
	event.waitUntil(
		caches.open('v1').then(cache =>
		{
			return cache.addAll([
				'/',
				'/index.html',
				'/style.css',
				'/manifest.json',
				'/icons/icon-1024x1024.png'
			]);
		})
	);
});

self.addEventListener('fetch', event =>
{
	event.respondWith(
		caches.match(event.request).then(response =>
		{
			return response || fetch(event.request);
		})
	);
});