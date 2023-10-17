import type { Har } from "har-format";
import { decode as decodeBase64 } from "base64-arraybuffer";

import { collectionsDb, openCollection, HeadersObject } from "./db";

export async function insert(har: Har, name: string) {
  let size = 0;

  const pages = har.log.pages;
  if (!pages || pages.length === 0)
    throw new Error("Har file does not contain page");

  const entries = har.log.entries;
  if (entries.length === 0)
    throw new Error("Har file does not contain entries");

  const textEncoder = new TextEncoder();

  const [collection, collections] = await Promise.all([
    openCollection(name),
    collectionsDb,
  ]);

  const tx = collection.transaction(["pages", "entries", "urls"], "readwrite");
  const pagesStore = tx.objectStore("pages");
  let promises: Promise<any>[] = [tx.done];
  for (let i = 0; i < pages.length; i++) {
    const title = pages[i].title;
    const pageUrl = entries.find((x) => x.pageref === pages[i].id)?.request.url;
    promises.push(pagesStore.put({ title, url: pageUrl }, pages[i].id));
    size += title.length + (pageUrl?.length ?? 0);
  }

  const entriesStore = tx.objectStore("entries");
  const urlDates = new Map<string, Date[]>();
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    const requestHeaders = rewriteHeaders(entry.request.headers);
    let setCookie: string[] = [];
    const responseHeaders = rewriteHeaders(entry.response.headers, setCookie);

    size += headersSize(requestHeaders) + headersSize(responseHeaders);
    size += setCookie.join("").length;

    const sourceContent = entry.response.content;
    let content: ArrayBuffer;
    if (sourceContent.text === undefined) {
      content = new ArrayBuffer(0);
    } else if (sourceContent.encoding === "base64") {
      content = decodeBase64(sourceContent.text);
    } else {
      const u8 = textEncoder.encode(sourceContent.text);
      content = u8.buffer;
    }

    size += content.byteLength;

    const dates = urlDates.get(entry.request.url) ?? [];
    urlDates.set(entry.request.url, [
      ...dates,
      new Date(entry.startedDateTime),
    ]);

    promises.push(
      entriesStore.put({
        id: entry.pageref ?? "",
        url: entry.request.url,
        requestHeaders,
        responseHeaders,
        setCookie,
        status: entry.response.status,
        content,
        time: new Date(entry.startedDateTime),
      }),
    );
  }

  const urlsStore = tx.objectStore("urls");
  for (let [key, value] of urlDates) {
    promises.push(urlsStore.put(value, key));
  }

  const time = new Date(pages[0].startedDateTime);
  collections.put("collections", { time, size }, name);

  await Promise.all(promises);
}

type InputHeaders = Array<{ name: string; value: string }>;
function rewriteHeaders(
  headers: InputHeaders,
  setCookie?: string[],
): HeadersObject {
  let outputHeaders: HeadersObject = {};
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].name.toLowerCase() === "set-cookie" && setCookie)
      setCookie.push(headers[i].value);
    // Chrome adds "headers" like :method and :scheme
    else if (!headers[i].name.startsWith(":"))
      outputHeaders[headers[i].name] = headers[i].value;
  }
  return outputHeaders;
}

function headersSize(headers: HeadersObject) {
  let size = 0;
  for (let headerName in headers) {
    size += headerName.length + headers[headerName].length;
  }
  return size;
}
