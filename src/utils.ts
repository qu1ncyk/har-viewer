export function sleep(ms: number, throws = false): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(throws ? reject : resolve, ms);
  });
}

/**
 * Read a `file` as a `string`.
 */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onerror = () => reject("Could not read the file");
    fileReader.onload = () => {
      resolve(fileReader.result as string);
    };
    fileReader.readAsText(file);
  });
}

/**
 * Read a `file` as an `ArrayBuffer`.
 */
export function readFileAsBytes(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onerror = () => reject("Could not read the file");
    fileReader.onload = () => {
      resolve(fileReader.result as ArrayBuffer);
    };
    fileReader.readAsArrayBuffer(file);
  });
}

export function zip<T, U>(array1: T[], array2: U[]): [T, U][] {
  return array1.map((x, i) => [x, array2[i]]);
}

export function noun(noun: string, plural: boolean) {
  return noun + (plural ? "s" : "");
}

// /viewer/:collection/*url
export function viewerExtractUrl(url: string) {
  const urlObject = new URL(url, location.href);
  return (
    urlObject.pathname.split("/").slice(3).join("/") +
    urlObject.search +
    urlObject.hash
  );
}

// /view/:collection/:time/*url
export function viewExtractUrl(url: string) {
  const urlObject = new URL(url, location.href);
  return (
    urlObject.pathname.split("/").slice(4).join("/") +
    urlObject.search +
    urlObject.hash
  );
}

export function last<T>(array: T[]) {
  return array[array.length - 1];
}

export function formatSize(size: number) {
  const units = ["kB", "MB", "GB", "TB"];
  let unit = "B";
  for (let i = 0; i < units.length; i++) {
    if (size >= 1000) {
      size /= 1024;
      unit = units[i];
    }
  }
  return `${size.toFixed(2)} ${unit}`;
}
