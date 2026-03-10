/* ═══════════════════════════════════════════════════════════
   POCKET GURU AI — Service Worker
   Caches app shell for offline use
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'pocket-guru-v1';

const APP_SHELL = [
  '/app/',
  '/app/index.html',
  '/app/manifest.json',
  '/app/icon.svg',
  '/app/css/styles.css',
  '/app/js/api.js',
  '/app/js/audio.js',
  '/app/js/breathing.js',
  '/app/js/meditation.js',
  '/app/js/app.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap'
];

// ─── Install ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL.filter(url => !url.startsWith('https://')));
    }).catch(err => console.warn('Cache install failed:', err))
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch Strategy ──────────────────────────────────────
// App shell: Cache-first
// API requests: Network-first with fallback
// Everything else: Network-first
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // API requests: network first, no caching
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => {
      return new Response(
        JSON.stringify({ error: 'You are offline. Please check your connection.' }),
        { headers: { 'Content-Type': 'application/json' }, status: 503 }
      );
    }));
    return;
  }

  // App shell: cache first, fallback to network
  if (APP_SHELL.includes(url.pathname) || url.pathname.startsWith('/app/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      }).catch(() => {
        // Offline fallback for navigation
        if (request.mode === 'navigate') {
          return caches.match('/app/index.html');
        }
      })
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
