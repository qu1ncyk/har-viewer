import type { Entry } from "../../db/db";
import { sendAction } from "../../sw/sendAction";
import { rewriteHeaders } from "./rewriteHeaders";
import { rewriteSetCookie } from "./rewriteSetCookie";

/**
 * Rewrites the URLs in the given file, according to the modifier in the time.
 * The modifiers can be found at https://pywb.readthedocs.io/en/latest/manual/rewriter.html
 */
export async function rewrite(entry?: Entry, time?: string, collection?: string) {
  if (!entry)
    return new Response();

  if (!time || !collection)
    return new Response(entry.content, {
      headers: entry.responseHeaders,
      status: entry.status,
    });

  const { url, status } = entry;
  let content: ArrayBuffer | string | null = entry.content;
  let headers = new Headers(entry.responseHeaders);

  // Set-Cookie can't be set in Headers
  const cookies = rewriteSetCookie(entry.setCookie, entry.time);
  setCookies(cookies);

  // HTTP 204 No Content
  if (status === 204) {
    content = null;
  } else {
    const decoder = new TextDecoder();
    const modifier = time?.slice(-3);
    switch (getFileType(modifier, headers)) {
      case "html":
        content = await rewriteHtml(decoder.decode(content), url, collection, entry.time.getTime() / 1000);
        break;
      case "css":
        content = await rewriteCss(decoder.decode(content), url, collection);
        break;
      case "js":
        content = await rewriteJs(decoder.decode(content), url, collection);
    }
  }

  rewriteHeaders(headers, url, collection);

  return new Response(content, { headers, status });
}

function getFileType(modifier: string, headers: Headers) {
  const contentType = headers.get('Content-Type');
  switch (modifier) {
    case "cs_":
      return "css";
    case "js_":
      return "js";
    case "id_":
      return undefined;
    default:
      if (contentType?.startsWith("text/html"))
        return "html";
      else if (contentType?.startsWith("text/css"))
        return "css";
      else if (contentType?.startsWith("text/javascript") || contentType?.startsWith("application/javascript"))
        return "js";
  }
}

function rewriteHtml(html: string, url: string, collection: string, time: number) {
  // the actual code for the rewriter is executed at the main thread
  return sendAction("rewrite html", { html, url, collection, time }) as Promise<string>;
}

function rewriteCss(css: string, url: string, collection: string) {
  return sendAction("rewrite css", { css, url, collection }) as Promise<string>;
}

function rewriteJs(js: string, url: string, collection: string) {
  return sendAction("rewrite js", { js, url, collection }) as Promise<string>;
}

function setCookies(cookies: string[]) {
  return sendAction("set cookies", { cookies }) as Promise<void>;
}