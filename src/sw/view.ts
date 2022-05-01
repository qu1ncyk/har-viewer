import { get } from "../db";

export async function view(url: URL) {
  // /view/:collection/:time/:originalUrl
  const pathParts = url.pathname.split("/");
  let [, , collection, time, ...originalUrlArray] = pathParts;
  collection = decodeURIComponent(collection);
  const originalUrl = originalUrlArray.join("/");

  const entries = await get.entries(collection);
  const entry = entries.find(x => x.url === originalUrl);
  return new Response(entry?.content, { 
    headers: entry?.responseHeaders,
    status: entry?.status,
  });
}