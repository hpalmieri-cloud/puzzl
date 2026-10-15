// Service worker: guarda los archivos del juego en el dispositivo
// para que funcione sin conexión después de la primera visita.

// IMPORTANTE: cada vez que cambies algún archivo del juego y lo vuelvas a subir,
// cambiá este nombre (por ejemplo a "puzzle-v2"). Así los dispositivos descargan la versión nueva.
const VERSION = "puzzle-v1";

// Archivos que se guardan al instalar
const ARCHIVOS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];

// Al instalar: guardar los archivos
self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(VERSION).then(function (cache) {
      return cache.addAll(ARCHIVOS);
    })
  );
  self.skipWaiting();
});

// Al activar: borrar las copias de versiones anteriores
self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(
        nombres
          .filter(function (nombre) { return nombre !== VERSION; })
          .map(function (nombre) { return caches.delete(nombre); })
      );
    })
  );
  self.clients.claim();
});

// Cada vez que la página pide un archivo: usar la copia guardada si existe,
// y si no, buscarlo en internet.
self.addEventListener("fetch", function (evento) {
  const pedido = evento.request;

  // Solo nos ocupamos de archivos del propio juego
  if (pedido.method !== "GET" || new URL(pedido.url).origin !== self.location.origin) {
    return;
  }

  evento.respondWith(
    caches.match(pedido).then(function (guardado) {
      if (guardado) {
        return guardado;
      }
      return fetch(pedido).then(function (respuesta) {
        const copia = respuesta.clone();
        caches.open(VERSION).then(function (cache) {
          cache.put(pedido, copia);
        });
        return respuesta;
      }).catch(function () {
        return caches.match("index.html");
      });
    })
  );
});
