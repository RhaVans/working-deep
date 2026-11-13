/* sw.js — offline cache for the lab shell. Bump CACHE on every shipped change. */
const CACHE = 'working-deep-v9';
const ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './css/lab.css',
  './css/tools.css',
  './css/fixes.css',
  './css/layout.css',
  './js/app.js',
  './js/core.js',
  './js/data.js',
  './js/explore.js',
  './js/experiments-a.js',
  './js/experiments-b.js',
  './js/workbench.js',
  './js/progress.js',
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
