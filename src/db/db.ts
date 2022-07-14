import { openDB, DBSchema } from "idb/with-async-ittr";

interface Collections extends DBSchema {
  collections: {
    key: string; // collection name
    value: {
      time: Date;
      size: number;
    };
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