// Service worker: permite usar la app sin conexión.
// Al publicar cambios, sube el número de VERSION para que los móviles descarguen la nueva versión.
const VERSION = 'hipo-rn-v10';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest',
  'img/icon.svg', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png', 'img/algoritmo.png',
  encodeURI('Protocolo/Protocolo hipoglucemia en recién nacidos (nuevo diseño).pdf'),
  encodeURI('Protocolo/Protocolo hipoglucemia en recién nacidos (formato revista).pdf'),
  encodeURI('Protocolo/Infografía hipoglucemia en recién nacidos.pdf'), 'Protocolo/paginas/paginas.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
// Páginas del visor de documentos (Protocolo/paginas/): se guardan en segundo plano, sin bloquear la instalación.
async function guardarPaginas() {
  const c = await caches.open(VERSION);
  const n = await (await c.match('Protocolo/paginas/paginas.json') || await fetch('Protocolo/paginas/paginas.json')).clone().json();
  const urls = Object.entries(n).flatMap(([k, t]) => Array.from({ length: t }, (_, i) => `Protocolo/paginas/${k}-${String(i + 1).padStart(2, '0')}.jpg`));
  await Promise.allSettled(urls.map((u) => c.match(u).then((r) => r || c.add(u))));
}
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
  e.waitUntil(guardarPaginas().catch(() => {}));
});
// Red primero (para recibir actualizaciones); si no hay conexión, caché.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
