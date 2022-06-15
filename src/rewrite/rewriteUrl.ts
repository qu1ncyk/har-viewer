export function rewriteUrl(path: string, parent: string, collection: string, modifier = "") {
    const url = new URL(path, parent);
    return `/view/${encodeURIComponent(collection)}/0${modifier}/${url.href}`;
}