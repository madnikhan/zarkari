/**
 * One-time cleanup: clears old PWA caches and unregisters this worker.
 * Replaces the previous cache-first sw.js that served stale demo HTML.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
  );
});
