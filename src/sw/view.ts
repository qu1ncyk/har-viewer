import { get } from "../db";
import { rewrite } from "../rewrite/sw";

export async function view(url: URL) {
  // /view/:collection/:time/:originalUrl
  const pathParts = url.pathname.split("/");
  let [, , collection, time, ...originalUrlArray] = pathParts;
  collection = decodeURIComponent(collection);
  const originalUrl = originalUrlArray.join("/") + url.search;

  const entries = await get.entries(collection);
  const entry = entries.find(x => x.url === originalUrl);
  if (!entry)
    debugger;

  return await rewrite(entry, time, collection);
}