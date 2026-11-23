/* NextStep Study N1: online-first updates, offline fallback. Never cache third-party hosts. */
'use strict';
const CACHE = 'nextstep-n1-shell-v3';
const SHELL = ['./', './index.html', './style.css', './app.js',
  './THIRD-PARTY-NOTICE.txt', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if ((name.startsWith('nextstep-n1-shell-') || name === 'nextstep-n1-data-v1') && name !== CACHE) {
        await caches.delete(name);
      }
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin ||
      !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  event.respondWith((async () => {
    try {
      // Revalidate each resource online; cache the newest valid response for offline reading.
      const response = await fetch(req, { cache: 'no-cache' });
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        try { await cache.put(req, response.clone()); } catch (_) { /* quota/private mode */ }
      }
      return response;
    } catch (_) {
      const fallback = await caches.match(req);
      if (fallback) return fallback;
      if (req.mode === 'navigate') {
        const homepage = await caches.match(new URL('./index.html', self.registration.scope).href);
        if (homepage) return homepage;
      }
      return Response.error();
    }
  })());
});
