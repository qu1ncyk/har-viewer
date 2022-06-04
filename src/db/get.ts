import { collectionsDb, openCollection } from "./db";
import { zip } from "../utils";

export async function collections() {
  const collections = await collectionsDb;
  const tx = collections.transaction("collections");
  const store = tx.store;

  const [names, times] =
    await Promise.all([store.getAllKeys(), store.getAll(), tx.done]);
  return zip(names, times);
}

export async function pages(collectionName: string) {
  const collection = await openCollection(collectionName);
  const tx = collection.transaction("pages");
  const store = tx.store;

  const [pages] = await Promise.all([store.getAll(), tx.done]);
  return pages.filter(x => x.url);
}

export async function entries(collectionName: string) {
  const collection = await openCollection(collectionName);
  return collection.getAll("entries");
}