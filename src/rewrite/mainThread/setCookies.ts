export function setCookies(cookies: string[]) {
  cookies.forEach(cookie => (document.cookie = cookie));
}