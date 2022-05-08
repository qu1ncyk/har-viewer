import { rewriteUrl } from "../rewriteUrl";

export function rewriteCss(css: string, url: string, collection: string) {
  const dom = document.implementation.createHTMLDocument("");
  const style = document.createElement("style");
  style.textContent = css;
  dom.body.appendChild(style);

  rewriteStyleElement(style, url, collection);
  return style.textContent;
}

export function rewriteStyleElement(style: HTMLStyleElement, url: string, collection: string) {
  const sheet = style.sheet;
  const rules = sheet?.cssRules;
  if (rules) {
    let outputCss = "";
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      let modifier = "";
      if (rule instanceof CSSImportRule)
        modifier = "_cs";
      else if (rule instanceof CSSFontFaceRule)
        modifier = "_oe";
      else
        modifier = "_im";

      // CSSRule.prototype.cssText wraps all urls in url("")
      outputCss += rewriteUrlFunction(rule.cssText, url, collection, modifier) + "\n";
    }
    style.textContent = outputCss;
  }
}

export function rewriteStyleAttribute(element: HTMLElement, url: string, collection: string) {
  const css = element.style.cssText;
  element.style.cssText = rewriteUrlFunction(css, url, collection, "_im");
}

function escapeCss(str: string) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}
function unescapeCss(str: string) {
  return str
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function rewriteUrlFunction(rule: string, url: string, collection: string, modifier: string) {
  // match everything except " or \, or match \", \\ or \0-\f zero or more times
  //                         /-------------------------------\
  return rule.replace(/url\("((?:[^"\\]|\\"|\\\\|\\[0-9a-f])*)"\)/g, (match, escapedMatchedUrl) => {
    const matchedUrl = unescapeCss(escapedMatchedUrl);
    const newUrl = rewriteUrl(matchedUrl, url, collection, modifier);
    const escapedNewUrl = escapeCss(newUrl);
    return `url("${escapedNewUrl}")`;
  });
}