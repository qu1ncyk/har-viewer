import { openCollection, type Entry } from "../db/db";
import { rewrite } from "../rewrite/sw";
import { matchScore } from "./matchScore";

/**
 * The cache of the looked up URLs mapped to the best matches.
 * `originalUrl/collection, matchedUrl`
 */
let matchCache = new Map<string, [string, Date]>();

/**
 * The function that handles calls to the /view/* URL path. Fetch the requested
 * page from the collection in the database, rewrite it so that the references
 * don't break and return a `Response`.
 *
 * @param url The URL of the requested page. The pathname should have the shape
 * of `/view/:collection/:time/:originalUrl`.
 */
export async function view(url: URL) {
  const { collectionName, originalUrl, time } = splitUrl(url);
  const objectStore = await openCollection(collectionName);
  const urlsStore = objectStore.transaction("urls").store;
  let lowestScore = Infinity;
  let bestMatch: [string, Date] | undefined;

  const cached = matchCache.get(originalUrl + "/" + collectionName);

  if (cached) {
    bestMatch = cached;
  } else {
    for await (const cursor of urlsStore) {
      const url = cursor.key;
      const score = matchScore(new URL(originalUrl), new URL(url));
      if (score < lowestScore) {
        lowestScore = score;
        bestMatch = [url, cursor.value[0]];
      }
    }

    if (bestMatch)
      matchCache.set(originalUrl + "/" + collectionName, bestMatch);
  }

  let entry: Entry | undefined;
  if (bestMatch) {
    entry = await objectStore.get("entries", bestMatch);
  }
  return await rewrite(entry, time, collectionName);
}

/**
 * Split a view URL into multiple parts.
 *
 * @param url The URL of the requested page. The pathname should have the shape
 * of `/view/:collection/:time/:originalUrl`.
 */
function splitUrl(url: URL) {
  const pathParts = url.pathname.split("/");
  let [, , collectionName, time, ...originalUrlArray] = pathParts;
  collectionName = decodeURIComponent(collectionName);
  let originalUrl = originalUrlArray.join("/") + url.search;
  if (originalUrl.startsWith("//")) {
    originalUrl = "https:" + originalUrl;
  }

  return { collectionName, originalUrl, time };
}
