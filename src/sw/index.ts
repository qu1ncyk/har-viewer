/// <reference lib="WebWorker" />
declare const self: ServiceWorkerGlobalScope;

export { };

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.pathname === "/test-sw") {
    event.respondWith(new Response("ok"));
  }
});