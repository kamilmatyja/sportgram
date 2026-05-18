declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME: string = 'sportgram-v1';
const ASSETS: string[] = [
    '/',
    '/manifest.webmanifest',
    '/icon-192.svg',
    '/icon-512.svg',
    '/icon.svg'
];

self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event: FetchEvent) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request);
        })
    );
});

interface PushPayload {
    title: string;
    body: string;
}

self.addEventListener('push', (event: PushEvent) => {
    const payload: PushPayload = event.data
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

export {};