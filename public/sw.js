/* eslint-disable no-restricted-globals */

const SW_VERSION = "v2";
const STATIC_CACHE = `static-${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-${SW_VERSION}`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached ?? (await fetchPromise) ?? new Response("", { status: 504 });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (!request || request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Avoid caching Next internals that change frequently in dev/build transitions.
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // Next.js build assets: cache-first (except app chunks that can become stale)
  if (url.pathname.startsWith("/_next/static/")) {
    if (url.pathname.includes("/chunks/app/")) return;
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Runtime assets (images, fonts, scripts, styles): SWR
  const dest = request.destination;
  if (
    (dest === "image" || dest === "font" || dest === "style" || dest === "script") &&
    !url.pathname.startsWith("/_next/")
  ) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});
