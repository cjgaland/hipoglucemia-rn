// Service worker: permite usar la app sin conexión.
// Al publicar cambios, sube VERSION (y APP_VERSION en app.js): los móviles verán «Nueva versión disponible · Actualizar».
const VERSION = 'hipo-rn-v14';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest',
  'img/icon.svg', 'img/icon-192.png', 'img/icon-512.png', 'img/apple-touch-icon.png', 'img/algoritmo.png',
  encodeURI('Protocolo/Protocolo hipoglucemia en recién nacidos (nuevo diseño).pdf'),
  encodeURI('Protocolo/Protocolo hipoglucemia en recién nacidos (formato revista).pdf'),
  encodeURI('Protocolo/Infografía hipoglucemia en recién nacidos.pdf'), 'Protocolo/paginas/paginas.json'];

self.addEventListener('install', (e) => {
  // Sin skipWaiting(): la versión nueva queda en espera hasta que el usuario pulse «Actualizar» en el aviso.
  // cache: 'reload' = descargar del servidor, no de la caché del navegador (GitHub Pages la guarda 10 min).
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((u) => new Request(u, { cache: 'reload' })))));
});
// Páginas del visor de documentos (Protocolo/paginas/): se guardan en segundo plano, sin bloquear la instalación.
async function guardarPaginas() {
  const c = await caches.open(VERSION);
  const n = await (await c.match('Protocolo/paginas/paginas.json') || await fetch('Protocolo/paginas/paginas.json')).clone().json();
  const urls = Object.entries(n).flatMap(([k, t]) => Array.from({ length: t }, (_, i) => `Protocolo/paginas/${k}-${String(i + 1).padStart(2, '0')}.jpg`));
  await Promise.allSettled(urls.map((u) => c.match(u).then((r) => r || c.add(new Request(u, { cache: 'reload' })))));
}
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
  e.waitUntil(guardarPaginas().catch(() => {}));
});
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
// Red primero (para recibir actualizaciones); si no hay conexión, caché.
// Con conexión se comprueba siempre con el servidor (cache: 'no-cache'; si no ha cambiado, la respuesta es mínima),
// para no servir durante 10 minutos la versión anterior guardada por el navegador.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const mismoOrigen = new URL(e.request.url).origin === self.location.origin;
  const req = !mismoOrigen ? e.request
    : e.request.mode === 'navigate' ? new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })
    : new Request(e.request, { cache: 'no-cache' });
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok && mismoOrigen) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
