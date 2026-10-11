/* ZH Store board service worker: makes the board installable (Add to Home Screen) and keeps the loader shell and icons
   available offline. It never caches anything from api.github.com or the sign-in helper: the board's data is private and
   is always fetched live with the viewer's own key. */
const CACHE = 'zh-store-shell-v1';
const SHELL = ['/store/', '/store/index.html', '/store/manifest.webmanifest', '/store/icon-192.png', '/store/icon-512.png', '/store/icon-180.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || e.request.method !== 'GET') { return; }
  if (!url.pathname.startsWith('/store/')) { return; }
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match('/store/index.html'))));
});
