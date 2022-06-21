import { rewriteUrl } from "../rewriteUrl";

export function rewriteHeaders(headers: Headers, url: string, collection: string) {
  const location = headers.get("Location");
  if (location)
    headers.set("Location", rewriteUrl(location, url, collection, "mp_"));

  const removedHeaders = ["Content-Security-Policy", "X-Frame-Options"];
  removedHeaders.forEach(headerName => {
    if (headers.get(headerName))
      headers.delete(headerName);
  });
}