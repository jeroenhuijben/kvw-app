const CACHE_NAME = "kvw-shell-v8-sponsors";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=20260816-sponsors",
  "./app.js?v=20260816-sponsors",
  "./supabase-config.js",
  "./program-data.js?v=20260811-heukelom-route",
  "./timetable-data.js",
  "./instruction-data.js",
  "./agreements-data.js?v=20260810",
  "./sponsor-data.js?v=20260816",
  "./kvw-logo.png",
  "./manifest.webmanifest",
  "./apple-touch-icon.png",
  "./assets/icons/kvw-app-192.png",
  "./assets/icons/kvw-app-512.png",
  "./assets/cleaning/schoonmaakrooster-kvw-2026.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === "navigate";
  const isAppShell = APP_SHELL.some((path) => requestUrl.href === new URL(path, self.location.href).href);
  if (!isNavigation && !isAppShell) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
