const CACHE_NAME = "harbor-club-demo-static-v1";
const STATIC_CACHE_PATTERNS = [
  /^\/_next\/static\//,
  /^\/icon-(192|512)\.png$/,
  /^\/apple-icon\.png$/,
  /^\/icon\.svg$/,
];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

// Alleen statische, versie-gebonden assets krijgen een stale-while-revalidate
// cache. Pagina's, /api en auth-routes gaan altijd rechtstreeks over het
// netwerk zodat sessie/inlogstatus nooit verouderd uit de cache komt.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!STATIC_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
