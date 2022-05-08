import { rewriteUrl } from "../rewriteUrl";
import { rewriteStyleAttribute, rewriteStyleElement } from "./rewriteCss";

export function rewriteHtml(html: string, url: string, collection: string) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, "text/html");

  /** Rewrites every `attribute` of `tagName` with the result of `fn`. */
  function rewriteAttributeExec(
    tagName: string,
    attribute: string,
    fn: (value: string) => string
  ) {
    const elements = dom.getElementsByTagName(tagName);
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const attributeValue = element.getAttribute(attribute);
      if (attributeValue) {
        const newValue = fn(attributeValue);
        element.setAttribute(attribute, newValue);
      }
    }
  }

  function rewriteAttribute(tagName: string, attribute: string, modifier: string) {
    rewriteAttributeExec(tagName, attribute,
      (value) => rewriteUrl(value, url, collection, modifier)
    );
  }

  function rewriteSrcset(tagName: string, modifier: string) {
    // "url1, url2 res1, url3 res2"
    rewriteAttributeExec(tagName, "srcset", (value) =>
      value.split(",")
        .map(s =>
          s.replace(
            /([^\w,]+)/,
            (match) => rewriteUrl(match, url, collection, modifier)
          ))
        .join(",")
    );
  }

  // list of tags with URLs:
  // https://stackoverflow.com/questions/2725156/complete-list-of-html-tag-attributes-which-have-a-url-value
  rewriteAttribute("a", "href", "_mp");
  rewriteAttribute("applet", "codebase", "_oe");
  rewriteAttribute("area", "href", "_mp");
  rewriteAttribute("base", "href", "_mp");
  rewriteAttribute("blockquote", "cite", "_mp");
  rewriteAttribute("body", "background", "_im");
  rewriteAttribute("del", "cite", "_mp");
  rewriteAttribute("form", "action", "_mp");
  rewriteAttribute("frame", "longdesc", "_mp");
  rewriteAttribute("frame", "src", "_fr");
  rewriteAttribute("head", "profile", "_mp");
  rewriteAttribute("iframe", "longdesc", "_mp");
  rewriteAttribute("iframe", "src", "_if");
  rewriteAttribute("img", "src", "_im");
  rewriteAttribute("img", "longdesc", "_mp");
  rewriteAttribute("input", "src", "_im");
  rewriteAttribute("ins", "cite", "_mp");
  rewriteAttribute("link", "href", "_oe");
  rewriteAttribute("object", "classid", "_oe");
  rewriteAttribute("object", "codebase", "_oe");
  rewriteAttribute("object", "data", "_oe");
  rewriteAttribute("q", "cite", "_mp");
  rewriteAttribute("script", "src", "_js");
  rewriteAttribute("audio", "src", "_oe");
  rewriteAttribute("button", "formaction", "_mp");
  rewriteAttribute("command", "icon", "_im");
  rewriteAttribute("embed", "src", "_oe");
  rewriteAttribute("html", "manifest", "_id");
  rewriteAttribute("input", "formaction", "_mp");
  rewriteAttribute("source", "src", "_oe");
  rewriteAttribute("track", "src", "_oe");
  rewriteAttribute("video", "poster", "_im");
  rewriteAttribute("video", "src", "_oe");

  rewriteSrcset("img", "_im");
  rewriteSrcset("source", "_oe");

  // "url1 url2 url3"
  rewriteAttributeExec("object", "archive",
    (value) => value.split(" ")
      // when the value contains multiple spaces next to each other, the
      // split value becomes an empty string
      .map(s => s === "" ? s : rewriteUrl(s, url, collection, "_oe"))
      .join(" ")
  );

  // "url1,url2,url3"
  rewriteAttributeExec("appplet", "archive",
    (value) => value.split(",")
      .map(s => rewriteUrl(s, url, collection, "_oe"))
      .join(",")
  );

  // <meta http-equiv="refresh" content="seconds; url" />
  dom.querySelectorAll("meta[http-equiv=refresh]").forEach(element => {
    const content = element.getAttribute("content");
    if (content) {
      let [time, redirect] = content.split(";");
      if (redirect) {
        redirect = rewriteUrl(redirect, url, collection, "_mp");
        element.setAttribute("content", `${time}; ${redirect}`);
      }
    }
  });

  dom.querySelectorAll("style").forEach(element =>
    rewriteStyleElement(element, url, collection)
  );
  dom.querySelectorAll("[style]").forEach(element => {
    if (element instanceof HTMLElement)
      rewriteStyleAttribute(element, url, collection);
  });

  return dom.documentElement.outerHTML;
}
