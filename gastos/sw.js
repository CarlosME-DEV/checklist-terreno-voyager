/* Service worker de Gastos Retrofit: deja la app disponible sin conexión.
   Al publicar una versión nueva, sube el número de VERSION. */
const VERSION = 'v1';
const CACHE = 'gastos-retrofit-' + VERSION;
const LIBS = 'gastos-retrofit-libs';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  '../logo.png'
];
/* Bibliotecas externas (Excel, PDF, lectura de comprobantes): se guardan la primera vez que se usan. */
const CDN = ['https://cdnjs.cloudflare.com/', 'https://cdn.jsdelivr.net/'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('gastos-retrofit-v') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  if (CDN.some(p => url.startsWith(p))) {
    e.respondWith(caches.open(LIBS).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  if (new URL(url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(req).catch(() => req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    })
  );
});
