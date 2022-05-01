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

  const [id, title] =
    await Promise.all([store.getAllKeys(), store.getAll(), tx.done]);
  return zip(id, title);
}