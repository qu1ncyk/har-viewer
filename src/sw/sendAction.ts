/// <reference lib="WebWorker" />
declare const self: ServiceWorkerGlobalScope;

let callbacks: {
  resolve: (value: any) => void,
  reject: (reason: any) => void
}[] = [];
let callbackId = 0;

self.addEventListener("message", (e) => {
  const { id, result, error } = e.data;
  if (id in callbacks) {
    if (error)
      callbacks[id].reject(result);
    else
      callbacks[id].resolve(result);

    delete callbacks[id];
  }
});

/** Sends an action to the main thread. */
export function sendAction(action: string, data: any) {
  return new Promise((resolve, reject) => {
    const id = callbackId++;
    callbacks[id] = { resolve, reject };

    self.clients.matchAll()
      // the open windows in /view/ don't listen for messages
      .then((clients) => clients.find(client => !urlIsView(client.url)))
      .then((client) => client?.postMessage({ id, action, data }));
  });
}

function urlIsView(url: string) {
  return new URL(url).pathname.startsWith("/view/");
}