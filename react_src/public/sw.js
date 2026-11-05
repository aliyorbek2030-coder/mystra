// MYSTRA service worker: ilova qobig'ini keshlaydi, API so'rovlarini doim tarmoqdan oladi.
const CACHE = 'mystra-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/admin/')) return;

  // Sahifa: avval tarmoq, bo'lmasa keshdagi nusxa (internet yo'q bo'lsa ham ochiladi)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put('/', r.clone())); return r; })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // JS/CSS/rasm: keshdan tez, orqada yangilanadi
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => {
        if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
