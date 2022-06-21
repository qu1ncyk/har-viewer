import { get } from "../db";
import type { Entry } from "../db/db";
import { rewrite } from "../rewrite/sw";
import { matchScore } from "./matchScore";

export async function view(url: URL) {
  // /view/:collection/:time/:originalUrl 
  const pathParts = url.pathname.split("/");
  let [, , collection, time, ...originalUrlArray] = pathParts;
  collection = decodeURIComponent(collection);
  const originalUrl = originalUrlArray.join("/") + url.search;

  const store = await get.entriesStore(collection);
  let lowestScore = Infinity;
  let bestMatch: Entry | undefined;
  for await (const cursor of store) {
    const entry = cursor.value;
    const score = matchScore(new URL(originalUrl), new URL(entry.url));
    if (score < lowestScore) {
      lowestScore = score;
      bestMatch = entry;
    }
  }

  if (lowestScore !== 0)
    console.log({
      originalUrl,
      otherUrl: bestMatch?.url,
      lowestScore,
      allUrls: (await get.entries(collection)).map(x => x.url)
    });

  return await rewrite(bestMatch, time, collection);
}