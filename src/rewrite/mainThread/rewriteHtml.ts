// This file contains parts that are borrowed from
// https://github.com/webrecorder/wabac.js under AGPLv3+

import { viewExtractUrl } from "../../utils";
import { rewriteUrl } from "../rewriteUrl";
import { rewriteStyleAttribute, rewriteStyleElement } from "./rewriteCss";
import { rewriteJs } from "./rewriteJs";

export function rewriteHtml(html: string, url: string, collection: string, time: number) {
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
  rewriteAttribute("base", "href", "mp_");
  let base = dom.querySelector("base");
  if (base)
    url = viewExtractUrl(base.href);

  rewriteAttribute("a", "href", "mp_");
  rewriteAttribute("applet", "codebase", "oe_");
  rewriteAttribute("area", "href", "mp_");
  rewriteAttribute("blockquote", "cite", "mp_");
  rewriteAttribute("body", "background", "im_");
  rewriteAttribute("del", "cite", "mp_");
  rewriteAttribute("form", "action", "mp_");
  rewriteAttribute("frame", "longdesc", "mp_");
  rewriteAttribute("frame", "src", "fr_");
  rewriteAttribute("head", "profile", "mp_");
  rewriteAttribute("iframe", "longdesc", "mp_");
  rewriteAttribute("iframe", "src", "if_");
  rewriteAttribute("img", "src", "im_");
  rewriteAttribute("img", "longdesc", "mp_");
  rewriteAttribute("input", "src", "im_");
  rewriteAttribute("ins", "cite", "mp_");
  rewriteAttribute("link", "href", "oe_");
  rewriteAttribute("object", "classid", "oe_");
  rewriteAttribute("object", "codebase", "oe_");
  rewriteAttribute("object", "data", "oe_");
  rewriteAttribute("q", "cite", "mp_");
  rewriteAttribute("script", "src", "js_");
  rewriteAttribute("audio", "src", "oe_");
  rewriteAttribute("button", "formaction", "mp_");
  rewriteAttribute("command", "icon", "im_");
  rewriteAttribute("embed", "src", "oe_");
  rewriteAttribute("html", "manifest", "id_");
  rewriteAttribute("input", "formaction", "mp_");
  rewriteAttribute("source", "src", "oe_");
  rewriteAttribute("track", "src", "oe_");
  rewriteAttribute("video", "poster", "im_");
  rewriteAttribute("video", "src", "oe_");

  rewriteSrcset("img", "im_");
  rewriteSrcset("source", "oe_");

  // "url1 url2 url3"
  rewriteAttributeExec("object", "archive",
    (value) => value.split(" ")
      // when the value contains multiple spaces next to each other, the
      // split value becomes an empty string
      .map(s => s === "" ? s : rewriteUrl(s, url, collection, "oe_"))
      .join(" ")
  );

  // "url1,url2,url3"
  rewriteAttributeExec("appplet", "archive",
    (value) => value.split(",")
      .map(s => rewriteUrl(s, url, collection, "oe_"))
      .join(",")
  );

  // <meta http-equiv="refresh" content="seconds; url" />
  dom.querySelectorAll("meta[http-equiv=refresh]").forEach(element => {
    const content = element.getAttribute("content");
    if (content) {
      let [time, redirect] = content.split(";");
      if (redirect) {
        redirect = rewriteUrl(redirect, url, collection, "mp_");
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

  dom.querySelectorAll("script").forEach(element => {
    if (element.textContent?.trim())
      element.textContent = rewriteJs(element.textContent, url, collection);
  });

  // https://github.com/webrecorder/wabac.js/blob/4da4093d15b8a182eba18615ab378cab8bf01479/src/collection.js#L389

  const encodedCollection = encodeURIComponent(collection);
  const wombatConfig = {
    top_url: `${location.origin}/view/${encodedCollection}/0/${url}`,
    url,
    timestamp: 0,
    request_ts: 0,
    prefix: `${location.origin}/view/${encodedCollection}/`,
    mod: "mp_",
    is_framed: true,
    is_live: false,
    coll: collection,
    proxy_magic: "",
    static_prefix: "https://cdn.jsdelivr.net/npm/@webrecorder/wombat@3.3.6/dist/",
    enable_auto_fetch: true,
    isSW: true,
    wombat_ts: 0,
    wombat_sec: time,
    wombat_scheme: new URL(url).protocol.replace(":", ""),
    wombat_host: new URL(url).host,
    wombat_opts: {}
  };

  dom.head.insertAdjacentHTML("afterbegin", `
    <script src="https://cdn.jsdelivr.net/npm/@webrecorder/wombat@3.3.6/dist/wombat.js"></script>
    <script>
      if (window && window._WBWombatInit) {
        window._WBWombatInit(${JSON.stringify(wombatConfig)});
      }
    </script>
  `);

  return dom.documentElement.outerHTML;
}
