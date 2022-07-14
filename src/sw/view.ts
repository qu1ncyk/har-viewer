import { get } from "../db";
import type { Entry } from "../db/db";
import { rewrite } from "../rewrite/sw";
import { matchScore } from "./matchScore";

/** `originalUrl/collection, [otherUrl, Date]` */
let matchCache = new Map<string, [string, Date]>();

export async function view(url: URL) {
  // /view/:collection/:time/:originalUrl 
  const pathParts = url.pathname.split("/");
  let [, , collection, time, ...originalUrlArray] = pathParts;
  collection = decodeURIComponent(collection);
  let originalUrl = originalUrlArray.join("/") + url.search;

  if (originalUrl.startsWith("//"))
    originalUrl = "https:" + originalUrl;

  const store = await get.entriesStore(collection);
  let lowestScore = Infinity;
  let bestMatch: Entry | undefined;

  const key = matchCache.get(originalUrl + "/" + collection);

  if (key) {
    bestMatch = await store.get(key);
  } else {
    for await (const cursor of store) {
      const entry = cursor.value;
      const score = matchScore(new URL(originalUrl), new URL(entry.url));
      if (score < lowestScore) {
        lowestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch)
      matchCache.set(originalUrl + "/" + collection, [bestMatch.url, bestMatch.time]);
  }

  return await rewrite(bestMatch, time, collection);
}