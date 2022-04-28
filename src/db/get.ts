import { collectionsDb, openCollection } from "./db";

export async function collections() {
  const collections = await collectionsDb;
  const tx = collections.transaction("collections");
  const store = tx.store;

  const [names, times] =
    await Promise.all([store.getAllKeys(), store.getAll(), tx.done]);

  const output: [string, Date][] = names.map((x, i) => [x, times[i]]);
  return output;
}