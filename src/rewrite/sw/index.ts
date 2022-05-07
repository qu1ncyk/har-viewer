import type { Entry } from "../../db/db";
import { sendAction } from "../../sw/sendAction";
import { rewriteHeaders } from "./rewriteHeaders";

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
  let content: ArrayBuffer | string = entry.content;
  let headers = new Headers(entry.responseHeaders);

  const decoder = new TextDecoder();
  const modifier = time?.slice(-3);
  switch (modifier) {
    case "_mp":
      if (headers.get("Content-Type") === "text/html")
        content = await rewriteHtml(decoder.decode(content), url, collection);
      break;
  }

  rewriteHeaders(headers, url, collection);

  return new Response(content, { headers, status });
}

function rewriteHtml(html: string, url: string, collection: string) {
  // the actual code for the rewriter is executed at the main thread
  return sendAction("rewrite html", { html, url, collection }) as Promise<string>;
}