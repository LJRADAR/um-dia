// 1 Dia: funciona sem internet (gerado por scripts/montar-site.js)
const BASE = "/um-dia";
const CACHE = '1dia-e20a3d98d0';
const SHELL = BASE + '/';
const FILES = [SHELL, BASE + '/manifest.json', BASE + '/icon-192.png', BASE + '/icon-512.png', BASE + '/apple-touch-icon.png', BASE + '/favicon.ico'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('1dia-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SHELL)) return;
  if (req.mode === 'navigate') {
    // Com internet: versão mais nova (e atualiza a cópia). Sem internet: a cópia guardada.
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.pathname === SHELL) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(SHELL, copy));
          }
          return res;
        })
        .catch(() => caches.match(SHELL))
    );
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
