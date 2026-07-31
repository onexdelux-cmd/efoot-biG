const CACHE_NAME = 'efootball-red-dimension-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/blog.html',
    '/tutoriel.html',
    '/articles.html',
    '/auth.html',
    '/profile.html',
    '/styles.css',
    '/auth.css',
    '/articles.css',
    '/tutoriel.css',
    '/script.js',
    '/auth.js',
    '/nav-auth.js',
    '/profile.js',
    '/comments.js',
    '/newsletter.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://joyful.to/embed/p/Gj5hTTViyWDwjFQ9tpcm7/widget.js'
];

// Installation du service worker
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Cache ouvert');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activation du service worker
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interception des requêtes
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone de la requête
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(function(response) {
                    // Vérifier si la réponse est valide
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone de la réponse
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});
