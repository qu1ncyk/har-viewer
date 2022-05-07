/// <reference lib="WebWorker" />
declare const self: ServiceWorkerGlobalScope;

import { view } from "./view";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", async (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/view/")) {
    event.respondWith(view(url));
  }
});
