// Version du cache - changez ce numéro pour forcer la mise à jour
const CACHE_VERSION = 'v2';
const CACHE_NAME = 'efootball-red-dimension-' + CACHE_VERSION;

const urlsToCache = [
    '/',
    '/index.html',
    '/blog.html',
    '/tutoriel.html',
    '/articles.html',
    '/auth.html',
    '/profile.html',
    '/feed.html',
    '/leaderboard.html',
    '/styles.css',
    '/auth.css',
    '/articles.css',
    '/tutoriel.css',
    '/social.css',
    '/leaderboard.css',
    '/script.js',
    '/auth.js',
    '/nav-auth.js',
    '/profile.js',
    '/comments.js',
    '/newsletter.js',
    '/social-profile.js',
    '/feed.js',
    '/leaderboard.js',
    '/followers.js',
    '/likes.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://joyful.to/embed/p/Gj5hTTViyWDwjFQ9tpcm7/widget.js'
];

// Installation du service worker
self.addEventListener('install', function(event) {
    console.log('Service Worker installation - Version:', CACHE_VERSION);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Cache ouvert:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .catch(function(error) {
                console.error('Erreur lors du cache:', error);
            })
    );
    // Force l'activation immédiate
    self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', function(event) {
    console.log('Service Worker activation - Version:', CACHE_VERSION);
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
    // Prend le contrôle immédiatement de toutes les pages
    return self.clients.claim();
});

// Interception des requêtes avec stratégie Network First pour les fichiers critiques
self.addEventListener('fetch', function(event) {
    const url = event.request.url;
    
    // Ne pas mettre en cache les requêtes CDN externes
    if (url.includes('cdn.jsdelivr.net') || url.includes('joyful.to')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    // Stratégie Network First pour les fichiers HTML et JS critiques locaux
    if (url.includes('.html') || url.includes('.js') || url.includes('css')) {
        event.respondWith(
            fetch(event.request)
                .then(function(response) {
                    // Vérifier si la réponse est valide
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        // Fallback vers le cache
                        return caches.match(event.request);
                    }

                    // Clone de la réponse
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                })
                .catch(function() {
                    // Fallback vers le cache si réseau échoue
                    return caches.match(event.request);
                })
        );
    } else {
        // Stratégie Cache First pour les autres ressources
        event.respondWith(
            caches.match(event.request)
                .then(function(response) {
                    if (response) {
                        return response;
                    }

                    return fetch(event.request).then(function(response) {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
                })
        );
    }
});
