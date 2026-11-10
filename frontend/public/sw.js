const CACHE_NAME = 'sportgram-cache-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/icon-192.svg',
    '/icon-512.svg',
    '/icon.svg'
];

let inMemoryUser = null;
let inMemoryTrainings = [];
let inMemoryGoals = [];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            return caches.delete(key);
                        }
                    })
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'SET_OFFLINE_USER') {
        inMemoryUser = event.data.data || event.data.user;
    } else if (event.data.type === 'SET_OFFLINE_TRAININGS') {
        inMemoryTrainings = event.data.data || event.data.trainings || [];
    } else if (event.data.type === 'SET_OFFLINE_GOALS') {
        inMemoryGoals = event.data.data || event.data.goals || [];
    }
});

function createJsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'X-Sportgram-Offline': 'true',
        },
    });
}

async function handleOfflineApi(request, url) {
    const method = request.method.toUpperCase();

    if (method === 'GET') {
        // Users endpoint
        if (url.pathname === '/api/users' || url.pathname.startsWith('/api/users/')) {
            const linkParam = url.searchParams.get('filter[link]');
            const signIdParam = url.searchParams.get('filter[signId]');

            if (inMemoryUser) {
                if (linkParam && inMemoryUser.link === linkParam) {
                    return createJsonResponse({
                        data: [inMemoryUser],
                        pagination: { total: 1, page: 1, limit: 1, totalPages: 1 },
                    });
                }
                if (signIdParam && inMemoryUser.signId === signIdParam) {
                    return createJsonResponse({
                        data: [inMemoryUser],
                        pagination: { total: 1, page: 1, limit: 1, totalPages: 1 },
                    });
                }
                if (url.pathname === `/api/users/${inMemoryUser.id}`) {
                    return createJsonResponse({ data: inMemoryUser });
                }
            }

            return createJsonResponse({
                data: [],
                pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
            });
        }

        // Trainings endpoint
        if (url.pathname === '/api/trainings' || url.pathname.startsWith('/api/trainings/')) {
            const linkParam = url.searchParams.get('filter[link]');
            if (linkParam) {
                const found = inMemoryTrainings.find((t) => t.link === linkParam || t.id === linkParam);
                return createJsonResponse({
                    data: found ? [found] : [],
                    pagination: { total: found ? 1 : 0, page: 1, limit: 1, totalPages: 1 },
                });
            }
            return createJsonResponse({
                data: inMemoryTrainings,
                pagination: {
                    total: inMemoryTrainings.length,
                    page: 1,
                    limit: Math.max(10, inMemoryTrainings.length),
                    totalPages: 1,
                },
            });
        }

        // Goals endpoint
        if (url.pathname === '/api/goals' || url.pathname.startsWith('/api/goals/')) {
            const linkParam = url.searchParams.get('filter[link]');
            if (linkParam) {
                const found = inMemoryGoals.find((g) => g.link === linkParam || g.id === linkParam);
                return createJsonResponse({
                    data: found ? [found] : [],
                    pagination: { total: found ? 1 : 0, page: 1, limit: 1, totalPages: 1 },
                });
            }
            return createJsonResponse({
                data: inMemoryGoals,
                pagination: {
                    total: inMemoryGoals.length,
                    page: 1,
                    limit: Math.max(10, inMemoryGoals.length),
                    totalPages: 1,
                },
            });
        }

        // Any other GET endpoint returns empty list / null
        return createJsonResponse({
            data: [],
            pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
        });
    }

    return createJsonResponse({ message: 'Saved in offline storage' });
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Handle API requests
    if (url.pathname.startsWith('/api')) {
        event.respondWith(
            fetch(event.request).catch(() => handleOfflineApi(event.request, url))
        );
        return;
    }

    // Handle Static assets & document navigation
    event.respondWith(
        fetch(event.request)
            .then(async (response) => {
                if (response && response.status === 200 && event.request.method === 'GET') {
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, response.clone());
                }
                return response;
            })
            .catch(async () => {
                const cached = await caches.match(event.request);
                if (cached) {
                    return cached;
                }

                if (event.request.mode === 'navigate' || event.request.destination === 'document') {
                    const fallback = (await caches.match('/')) || (await caches.match('/index.html'));
                    if (fallback) {
                        return fallback;
                    }
                }

                return new Response('Network error', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain' },
                });
            })
    );
});

self.addEventListener('push', (event) => {
    const payload = event.data
        ? event.data.json()
        : { title: 'Sportgram', body: 'Nowe powiadomienie' };

    event.waitUntil(
        self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
        })
    );
});
