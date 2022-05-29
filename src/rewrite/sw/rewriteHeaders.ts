import { rewriteUrl } from "../rewriteUrl";

export function rewriteHeaders(headers: Headers, url: string, collection: string) {
  const location = headers.get("Location");
  if (location)
    headers.set("Location", rewriteUrl(location, url, collection, "mp_"));

  if (headers.get("Content-Security-Policy"))
    headers.delete("Content-Security-Policy");
}