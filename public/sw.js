const SW_VERSION = "v3";
const STATIC_CACHE = `static-${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-${SW_VERSION}`;
const IS_LOCALHOST =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";
let CURRENT_VIEWER_EMAIL = "";

const toText = (value) => String(value || "").trim();
const normalizeEmail = (value) => toText(value).toLowerCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const personalizeNotificationBody = (body, actorLabel, actorEmail) => {
  const normalizedBody = toText(body);
  if (!normalizedBody) return normalizedBody;
  if (!actorEmail || !CURRENT_VIEWER_EMAIL || normalizeEmail(actorEmail) !== CURRENT_VIEWER_EMAIL) {
    return normalizedBody;
  }

  const label = toText(actorLabel);
  if (!label) return normalizedBody;

  const startsWithLabel = new RegExp(`^${escapeRegExp(label)}\\b`);
  if (startsWithLabel.test(normalizedBody)) {
    return normalizedBody.replace(startsWithLabel, "Anda");
  }
  return normalizedBody.replace(label, "Anda");
};

const readFcmConfig = () => {
  try {
    const url = new URL(self.location.href);
    const apiKey = toText(url.searchParams.get("fcmApiKey"));
    const authDomain = toText(url.searchParams.get("fcmAuthDomain"));
    const projectId = toText(url.searchParams.get("fcmProjectId"));
    const messagingSenderId = toText(url.searchParams.get("fcmMessagingSenderId"));
    const appId = toText(url.searchParams.get("fcmAppId"));

    if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId) {
      return null;
    }

    return {
      apiKey,
      authDomain,
      projectId,
      messagingSenderId,
      appId,
    };
  } catch {
    return null;
  }
};

const resolveNotificationUrl = (value) => {
  const fallback = `${self.location.origin}/ts-support-view`;
  const raw = toText(value);
  if (!raw) return fallback;

  try {
    const nextUrl = new URL(raw, self.location.origin);
    if (nextUrl.origin !== self.location.origin) return fallback;
    return nextUrl.href;
  } catch {
    return fallback;
  }
};

const setupFcmBackgroundHandler = () => {
  const fcmConfig = readFcmConfig();
  if (!fcmConfig) return;

  try {
    importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
    importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

    if (!self.firebase?.apps?.length) {
      self.firebase.initializeApp(fcmConfig);
    }

    const messaging = self.firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const data = payload?.data || {};
      const notificationTitle =
        toText(payload?.notification?.title) || "Aktivitas TS Support";
      const rawBody =
        toText(payload?.notification?.body || payload?.data?.body) ||
        "Ada update aktivitas baru.";
      const notificationBody = personalizeNotificationBody(
        rawBody,
        toText(data.actor),
        normalizeEmail(data.actorEmail)
      );
      const clickUrl = resolveNotificationUrl(
        payload?.data?.clickUrl || payload?.fcmOptions?.link
      );

      self.registration.showNotification(notificationTitle, {
        body: notificationBody,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: {
          clickUrl,
        },
      });
    });
  } catch (error) {
    console.warn("FCM init failed in service worker:", error);
  }
};

setupFcmBackgroundHandler();

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
  if (IS_LOCALHOST) return;
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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const clickUrl = resolveNotificationUrl(event.notification?.data?.clickUrl);

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        if (client.url === clickUrl && "focus" in client) {
          await client.focus();
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(clickUrl);
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  const payload = event?.data || {};
  if (toText(payload.type) !== "TS_SUPPORT_VIEWER") return;
  CURRENT_VIEWER_EMAIL = normalizeEmail(payload.email);
});
