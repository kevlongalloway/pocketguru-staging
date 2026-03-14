'use strict';

const CACHE = 'pocketguru-v3';
// Only cache truly static assets - NOT HTML or JS (those change on every deploy)
const STATIC = ['/style.css', '/manifest.json', '/icon-192.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Always network for API calls, HTML, and JS
  if (url.pathname.startsWith('/api')) return;
  if (url.pathname.endsWith('.js') || url.pathname === '/' || url.pathname.endsWith('.html')) return;
  // Cache-first for static assets (CSS, icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
