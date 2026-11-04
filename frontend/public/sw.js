const CACHE_NAME = 'sportgram-v1';
const ASSETS = [
    '/',
    '/manifest.webmanifest',
    '/icon-192.svg',
    '/icon-512.svg',
    '/icon.svg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);

    if (!url.protocol.startsWith('http')) {
        return;
    }

    if (url.pathname.startsWith('/api')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                return cached;
            }
            return fetch(event.request).catch(async () => {
                if (event.request.mode === 'navigate') {
                    const fallback = await caches.match('/');
                    if (fallback) {
                        return fallback;
                    }
                }
                return new Response('Network error', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain' },
                });
            });
        })
    );
});

self.addEventListener('push', event => {
    const payload = event.data
        ? event.data.json()
        : {title: 'Sportgram', body: 'Nowe powiadomienie'};

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: '/icon-192.svg',
            badge: '/icon-192.svg'
        })
    );
});
