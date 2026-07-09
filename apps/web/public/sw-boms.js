/* Minimal BOMS service worker — enables install prompt + push */
const CACHE = "zarkari-boms-v3";
const PRECACHE = [
  "/manifest-boms.json",
  "/icons/boms-180.png",
  "/icons/boms-192.png",
  "/icons/boms-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request))
  );
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() ?? {};
  const title = payload.notification?.title ?? payload.data?.title ?? "ZARKARI";
  const body = payload.notification?.body ?? payload.data?.body ?? "";
  const href = payload.data?.href ?? (payload.data?.orderId ? `/admin/orders/${payload.data.orderId}` : "/");

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/boms-192.png",
      badge: "/icons/boms-180.png",
      data: { href },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href ?? "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(href);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(href);
    })
  );
});
