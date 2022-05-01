import { openDB, DBSchema } from "idb/with-async-ittr";

interface Collections extends DBSchema {
  collections: {
    key: string; // collection name
    value: Date;
  }
}

export const collectionsDb = openDB<Collections>("collections", 1, {
  upgrade(db, oldVersion) {
    if (oldVersion === 0) {
      db.createObjectStore("collections");
    }
  }
});

export interface HeadersObject {
  [name: string]: string;
}

interface Collection extends DBSchema {
  pages: {
    key: string; // id
    value: string; // title
  };
  entries: {
    value: {
      id: string;
      url: string;
      content: ArrayBuffer;
      requestHeaders: HeadersObject;
      responseHeaders: HeadersObject;
      status: number;
      time: Date;
    };
    key: [string, Date]; // [url, time]
    indexes: { "by-id": string; };
  }
}

export function openCollection(collection: string) {
  return openDB<Collection>(`c:${collection}`, 1, {
    upgrade(db, oldVersion) {
      if (oldVersion === 0) {
        db.createObjectStore("pages");
        const entries = db.createObjectStore("entries", { keyPath: ["url", "time"] });
        entries.createIndex("by-id", "id");
      }
    }
  })
}