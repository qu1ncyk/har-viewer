import { deleteDB } from "idb";

import { collectionsDb } from "./db";

export async function deleteCollection(collectionName: string) {
  const collections = await collectionsDb;
  await collections.delete("collections", collectionName);
  
  await deleteDB(`c:${collectionName}`);
}