// Minimal service worker: required for "installability" as a PWA, plus a small
// offline fallback for the app shell. Since this dashboard depends on live data
// (Google Sheets, Apps Script, CDNs), everything uses network-first so users
// always see fresh data when online \u2014 the cache only kicks in if offline.
const CACHE_NAME = "dashboard-mep-shell-v1";
const SHELL_FILES = [
  "./dashboard_V15.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return; // never intercept POSTs to the Sheets backend
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
