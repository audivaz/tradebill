const CACHE_NAME = 'tradebill-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './CSS/styles.css',
  './Javascript/app.js',
  './manifest.json',
  './img/TradeBill-logo02.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});