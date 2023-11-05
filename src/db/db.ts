import {
  openDB,
  DBSchema,
  IDBPDatabase,
  IDBPTransaction,
} from "idb/with-async-ittr";
import * as gzip from "../gzip";

interface Collections extends DBSchema {
  collections: {
    key: string; // collection name
    value: {
      time: Date;
      size: number;
    };
  };
}

export const collectionsDb = openDB<Collections>("collections", 1, {
  upgrade(db, oldVersion) {
    if (oldVersion === 0) {
      db.createObjectStore("collections");
    }
  },
});

export interface HeadersObject {
  [name: string]: string;
}

export interface Entry {
  id: string;
  url: string;
  content: ArrayBuffer;
  compressed: boolean;
  requestHeaders: HeadersObject;
  responseHeaders: HeadersObject;
  setCookie: string[];
  status: number;
  time: Date;
}

export interface Collection extends DBSchema {
  pages: {
    key: string; // id
    value: {
      title: string;
      url?: string;
    };
  };
  entries: {
    value: Entry;
    key: [string, Date]; // [url, time]
    indexes: { "by-id": string };
  };
  urls: {
    key: string; // url
    value: Date[];
  };
}

export async function openCollection(collection: string) {
  let prevVersion: number | undefined;
  const db = await openDB<Collection>(`c:${collection}`, 2, {
    upgrade(db, oldVersion) {
      prevVersion = oldVersion;
      switch (oldVersion) {
        case 0:
          db.createObjectStore("pages");
          const entries = db.createObjectStore("entries", {
            keyPath: ["url", "time"],
          });
          entries.createIndex("by-id", "id");
        case 1:
          db.createObjectStore("urls");
      }
    },
  });

  await updateDb(db, collection, prevVersion);

  return db;
}

/**
 * Update the collection database version by updating the current values.
 */
async function updateDb(
  db: IDBPDatabase<Collection>,
  collection: string,
  prevVersion?: number,
) {
  if (prevVersion === 1) {
    // Copy the URLs from the `entries` store into the new `urls` store
    let grownSize = await createUrlsStore(db);
    grownSize += await compressContents(db);

    // Update the size for the extra stored URLs
    const collections = await collectionsDb;
    const collTx = collections.transaction("collections", "readwrite");
    const oldValue = await collTx.store.get(collection);
    if (oldValue)
      await collTx.store.put(
        { ...oldValue, size: oldValue.size + grownSize },
        collection,
      );
  }
}

/**
 * Create the `urls` store and fill it with every URL in `entries`.
 * @return The estimated increase in size.
 */
async function createUrlsStore(db: IDBPDatabase<Collection>) {
  const tx = db.transaction(["urls", "entries"], "readwrite");
  let grownSize = 0;
  let urlDates = new Map<string, Date[]>();
  for await (const entry of tx.objectStore("entries")) {
    const times = urlDates.get(entry.value.url) ?? [];
    urlDates.set(entry.value.url, [...times, entry.value.time]);
  }

  const urls = tx.objectStore("urls");
  let promises: Promise<any>[] = [tx.done];
  for (const [url, dates] of urlDates) {
    promises.push(urls.put(dates, url));
    grownSize += url.length + dates.length * 8;
  }
  await Promise.all(promises);
  return grownSize;
}

/**
 * Compress the contents of each entry.
 * @return The (negative) increase in size.
 */
async function compressContents(db: IDBPDatabase<Collection>) {
  const readTx = db.transaction("entries");
  let grownSize = 0;
  let readPromises = [readTx.done];
  let updates: Entry[] = [];

  // Store the compressed entries in an array before writing them back,
  // because compressing is async and transactions auto close while idle
  for await (const entry of readTx.store) {
    const value = entry.value;
    readPromises.push(
      gzip.tryCompress(value.content).then(({ compressed, result }) => {
        grownSize -= value.content.byteLength - result.byteLength;
        updates.push({ ...value, content: result, compressed });
      }),
    );
  }
  await Promise.all(readPromises);

  const writeTx = db.transaction("entries", "readwrite");
  let writePromises: Promise<any>[] = [writeTx.done];
  for (const update of updates) {
    writePromises.push(writeTx.store.put(update));
  }
  await Promise.all(writePromises);

  return grownSize;
}
