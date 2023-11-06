import type { Har, Page, Entry, Content } from "har-format";
import { decode as decodeBase64 } from "base64-arraybuffer";

import {
  collectionsDb,
  openCollection,
  HeadersObject,
  Collection,
  type Entry as StoredEntry,
} from "./db";
import * as gzip from "../gzip";
import { IDBPTransaction } from "idb";

type CollectionTx = IDBPTransaction<
  Collection,
  ("pages" | "entries" | "urls")[],
  "readwrite"
>;
type InputHeaders = Array<{ name: string; value: string }>;

export class Inserter {
  size = 0;
  urlDates = new Map<string, Date[]>();

  /**
   * Insert a new HAR entry into the database.
   */
  static async insert(har: Har, name: string) {
    const inserter = new Inserter();
    const pages = har.log.pages;
    if (!pages || pages.length === 0)
      throw new Error("Har file does not contain page");

    const entries = har.log.entries;
    if (entries.length === 0)
      throw new Error("Har file does not contain entries");
    const storedEntries = await Inserter.transformEntries(entries);

    const [collection, collections] = await Promise.all([
      openCollection(name),
      collectionsDb,
    ]);

    const tx = collection.transaction(
      ["pages", "entries", "urls"],
      "readwrite",
    );
    let promises: Promise<any>[] = [tx.done];
    promises.push(inserter.insertPages(tx, pages, entries));
    promises.push(inserter.insertEntries(tx, storedEntries));
    promises.push(inserter.insertUrls(tx));

    const time = new Date(pages[0].startedDateTime);
    collections.put("collections", { time, size: inserter.size }, name);

    await Promise.all(promises);
  }

  /**
   * Insert multiple `Page` objects into the database.
   */
  async insertPages(tx: CollectionTx, pages: Page[], entries: Entry[]) {
    let promises = [];
    const pagesStore = tx.objectStore("pages");
    for (let i = 0; i < pages.length; i++) {
      const title = pages[i].title;
      const pageUrl = entries.find((x) => x.pageref === pages[i].id)?.request
        .url;
      promises.push(pagesStore.put({ title, url: pageUrl }, pages[i].id));
      this.size += title.length + (pageUrl?.length ?? 0);
    }
    await Promise.all(promises);
  }

  /**
   * Transform an `Entry` array from a HAR file to an `Entry` array as stored
   * in the database.
   */
  static async transformEntries(entries: Entry[]): Promise<StoredEntry[]> {
    const promises = entries.map(async (entry) => {
      const content = Inserter.contentToU8(entry.response.content);
      const { result, compressed } = await gzip.tryCompress(content);

      const [requestHeaders] = Inserter.rewriteHeaders(entry.request.headers);
      const [responseHeaders, setCookie] = Inserter.rewriteHeaders(
        entry.response.headers,
      );

      return {
        id: entry.pageref ?? "",
        url: entry.request.url,
        requestHeaders,
        responseHeaders,
        setCookie,
        status: entry.response.status,
        content: result,
        time: new Date(entry.startedDateTime),
        compressed,
      };
    });

    return await Promise.all(promises);
  }

  /**
   * Insert multiple `Entry` objects into the database.
   */
  async insertEntries(tx: CollectionTx, entries: StoredEntry[]) {
    let promises = [];
    const entriesStore = tx.objectStore("entries");
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      this.size +=
        Inserter.headersSize(entry.requestHeaders) +
        Inserter.headersSize(entry.responseHeaders);
      this.size += entry.setCookie.join("").length;

      this.size += entry.content.byteLength;

      const dates = this.urlDates.get(entry.url) ?? [];
      this.urlDates.set(entry.url, [...dates, new Date(entry.time)]);

      promises.push(entriesStore.put(entry));
    }
    return promises;
  }

  /**
   * Insert the URLs from the entries into the database. The URLs were stored
   * in `this.urls` by `this.insertEntries()`.
   */
  async insertUrls(tx: CollectionTx) {
    let promises = [];
    const urlsStore = tx.objectStore("urls");
    for (let [key, value] of this.urlDates) {
      promises.push(urlsStore.put(value, key));
      this.size += key.length + value.length * 8;
    }
    return promises;
  }

  /**
   * Rewrite headers in the style of
   * ```ts
   * [
   *   { name: "Content-Type", value: "text/plain" },
   *   { name: "Date", value: "Thu, 01 Jan 1970 00:00:00 GMT" },
   *   { name: "Set-Cookie", value: "cookie1=value1" },
   *   { name: "Set-Cookie", value: "cookie2=value2" },
   * ]
   * ```
   * to
   * ```ts
   * {
   *   "content-type": "text/plain",
   *   date: "Thu, 01 Jan 1970 00:00:00 GMT",
   * }
   * ```
   * and return the `Set-Cookie` header values as a separate array.
   */
  static rewriteHeaders(headers: InputHeaders): [HeadersObject, string[]] {
    let outputHeaders: HeadersObject = {};
    let setCookie = [];
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].name.toLowerCase() === "set-cookie")
        setCookie.push(headers[i].value);
      // Chrome adds "headers" like :method and :scheme
      else if (!headers[i].name.startsWith(":"))
        outputHeaders[headers[i].name] = headers[i].value;
    }
    return [outputHeaders, setCookie];
  }

  /**
   * Get the size of an object of headers.
   */
  static headersSize(headers: HeadersObject) {
    let size = 0;
    for (let headerName in headers) {
      size += headerName.length + headers[headerName].length;
    }
    return size;
  }

  /**
   * Convert the content of an entry (string or base64 encoded binary) into a
   * `Uint8Array`.
   */
  static contentToU8(content: Content) {
    const textEncoder = new TextEncoder();
    if (content.text === undefined) {
      return new ArrayBuffer(0);
    } else if (content.encoding === "base64") {
      return decodeBase64(content.text);
    } else {
      const u8 = textEncoder.encode(content.text);
      return u8.buffer;
    }
  }
}
