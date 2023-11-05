import type { IDBPObjectStore } from "idb/with-async-ittr";
import { Collection, openCollection, type Entry } from "../db/db";
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

  let entry: Entry | undefined;
  let match = await getMatch(collectionName, originalUrl, urlsStore);
  if (match) {
    matchCache.set(originalUrl + "/" + collectionName, match);
    entry = await objectStore.get("entries", match);
  }
  return await rewrite(entry, time, collectionName);
}

/**
 * Find the URL that matches the best with a URL in the collection.
 */
async function getMatch(
  collectionName: string,
  originalUrl: string,
  urlsStore: IDBPObjectStore<Collection, ["urls"], "urls", "readonly">,
): Promise<[string, Date] | undefined> {
  const cached = matchCache.get(originalUrl + "/" + collectionName);
  if (cached) {
    return cached;
  }

  let perfectMatch = await urlsStore.get(originalUrl);
  if (perfectMatch) {
    return [originalUrl, perfectMatch[0]];
  }

  let lowestScore = Infinity;
  let bestMatch: [string, Date] | undefined;
  for await (const cursor of urlsStore) {
    const url = cursor.key;
    const score = matchScore(new URL(originalUrl), new URL(url));
    if (score < lowestScore) {
      lowestScore = score;
      bestMatch = [url, cursor.value[0]];
    }
  }

  return bestMatch;
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
