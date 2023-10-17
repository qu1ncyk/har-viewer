import { openDB, DBSchema } from "idb/with-async-ittr";

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
  requestHeaders: HeadersObject;
  responseHeaders: HeadersObject;
  setCookie: string[];
  status: number;
  time: Date;
}

interface Collection extends DBSchema {
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

  if (prevVersion === 1) {
    // Copy the URLs from the `entries` store into the new `urls` store
    const tx = db.transaction(["urls", "entries"], "readwrite");
    const urls = tx.objectStore("urls");

    for await (const entry of tx.objectStore("entries")) {
      const times = (await urls.get(entry.value.url)) ?? [];
      await urls.put([...times, entry.value.time], entry.value.url);
    }
  }

  return db;
}
