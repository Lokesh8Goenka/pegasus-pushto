// Keeps a copy of the app so it opens in the field with no internet.
// Network first, so a fresh version is picked up whenever there is a connection.
const CACHE = 'pegasus-v1';
const FILES = ['./', 'index.html', 'dial.html', 'style.css', 'app.js', 'serial.js', 'targets.js',
  'vendor/astronomy.browser.min.js', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
