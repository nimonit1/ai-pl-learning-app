const CACHE_NAME = 'quiz-master-cache-v3';
const urlsToCache = [
    '/',
    '/index.html',
    '/apps/programming/index.html',
    '/src/portal/main.tsx',
    '/src/apps/programming/main.tsx',
    '/src/shared/styles/base.css'
];

self.addEventListener('install', (event: any) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event: any) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
