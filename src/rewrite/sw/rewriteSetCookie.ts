export function rewriteSetCookie(cookies: string[], snapTime: Date) {
  return cookies.map(cookieString => {
    try {
      const cookie = parseSetCookie(cookieString);
      if (!cookie.maxAge && cookie.expires) {
        cookie.maxAge = Math.round((cookie.expires.getTime() - snapTime.getTime()) / 1000);
        cookie.expires = undefined;
      }

      cookie.path = "/view/";
      cookie.domain = undefined;

      return stringifySetCookie(cookie);
    } catch (e) {
      return "";
    }
  });
}

interface Cookie {
  name: string;
  value: string;
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
}
// name=value; Expires=<date>; Max-Age=<number>; ...
function parseSetCookie(cookie: string): Cookie {
  // split into ["name=value", "Expires=<date>", ...]
  const cookieParts = cookie.split(";");

  // split into [["name", "value"], ["Expires", "<date>"], ["httpOnly"], ...]
  const keyValuePairs = cookieParts.map(x => x.split("=")) as [string, string][];

  const [name, value] = keyValuePairs.shift() as [string, string];
  let returnValue: Cookie = { name, value };

  keyValuePairs.forEach(([key, value]) => {
    const lowercaseKey = key.toLowerCase().trim();
    switch (lowercaseKey) {
      case "expires":
        returnValue.expires = new Date(value);
        break;
      case "max-age":
        returnValue.maxAge = Number(value);
        break;
      case "domain":
        returnValue.domain = value.trim();
        break;
      case "path":
        returnValue.path = value.trim();
        break;
      case "secure":
        returnValue.secure = true;
        break;
      case "httponly":
        returnValue.httpOnly = true;
        break;
      case "samesite":
        const lowercaseValue = value.toLowerCase().trim();
        if (lowercaseValue === "strict" || lowercaseValue === "lax" || lowercaseValue === "none")
          returnValue.sameSite = lowercaseValue;
        break;
    }
  });

  return returnValue;
}

function stringifySetCookie(cookie: Cookie) {
  let returnValue = `${cookie.name}=${cookie.value}`;
  if (cookie.domain)
    returnValue += `; Domain=${cookie.domain}`;

  if (cookie.expires)
    returnValue += `; Expires=${cookie.expires}`;

  if (cookie.httpOnly)
    returnValue += `; HttpOnly`;

  if (cookie.maxAge)
    returnValue += `; Max-Age=${cookie.maxAge}`;

  if (cookie.path)
    returnValue += `; Path=${cookie.path}`;

  if (cookie.sameSite) {
    const mapSameSite = { strict: "Strict", lax: "Lax", none: "None" };
    returnValue += `; SameSite=${mapSameSite[cookie.sameSite]}`;
  }
  if (cookie.secure)
    returnValue += `; Secure`

  return returnValue;
}