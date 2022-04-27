export function sleep(ms: number, throws = false): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(throws ? reject : resolve, ms);
  });
}

export function readFile(element: HTMLInputElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const file = element.files?.[0];
    if (!file) {
      reject("Could not load the file");
      return;
    }

    const fileReader = new FileReader();
    fileReader.onerror = () => reject("Could not read the file");
    fileReader.onload = () => {
      resolve(fileReader.result as string);
    };
    fileReader.readAsText(file);
  });
}