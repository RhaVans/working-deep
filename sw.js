/* sw.js — cache the app shell so the manual works offline.
   Bump CACHE when shipping changes. */
const CACHE = 'working-deep-v5';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/core.js',
  './js/intro.js',
  './js/rules-a.js',
  './js/rules-b.js',
  './js/templates.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
