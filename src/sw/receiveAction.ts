import { rewriteCss } from "../rewrite/mainThread/rewriteCss";
import { rewriteHtml } from "../rewrite/mainThread/rewriteHtml";
import { rewriteJs } from "../rewrite/mainThread/rewriteJs";
import { setCookies } from "../rewrite/mainThread/setCookies";

/** Receives an action from the service worker. */
export function receiveAction() {
  navigator.serviceWorker.addEventListener("message", (e) => {
    const { id, action, data } = e.data;
    let result;
    let error = false;

    try {
      if (action === "rewrite html")
        result = rewriteHtml(data.html, data.url, data.collection, data.time);
      else if (action === "rewrite css")
        result = rewriteCss(data.css, data.url, data.collection);
      else if (action === "rewrite js")
        result = rewriteJs(data.js, data.url, data.collection);
      else if (action === "set cookies")
        setCookies(data.cookies);
    } catch (e) {
      result = e;
      error = true;
    }

    e.source?.postMessage({ id, result, error });
  });
}