import { Component, createResource, For, Show } from "solid-js";
import type { Har } from "har-format";

import { formatSize, readFile, readFileAsBytes } from "../utils";
import { Inserter, get } from "../db";
import styles from "./Home.module.css";
import * as gzip from "../gzip";

const [collections, { refetch }] = createResource(get.collections);
export { refetch };

const Home: Component = () => {
  return (
    <>
      <h1>HAR viewer</h1>
      <p>
        Upload a <code>.har</code> or <code>.har.gz</code> file or choose a
        previously loaded file
      </p>
      <input type="file" accept=".har, application/json, application/gzip" onInput={upload} />
      <Show when={!collections.loading} fallback={<p>Loading...</p>}>
        <ul class={styles.list}>
          <For each={collections()}>
            {([name, value]) => (
              <li>
                <a href={collectionUrl(name)} class={styles.collectionName}>
                  {name}
                </a>
                <p class={styles.subtitle}>
                  Snapshot taken at {value.time.toLocaleString()}
                </p>
                <p class={styles.subtitle}>{formatSize(value.size)}</p>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </>
  );
};

export default Home;

async function upload(event: InputEvent) {
  try {
    const element = event.currentTarget as HTMLInputElement;
    const file = element.files?.[0];
    if (!file) {
      throw new Error("Could not load the file");
    }

    const filename = element.files?.[0].name ?? "";
    let obj;

    if (filename.endsWith(".gz")) {
      const arrayBuffer = await readFileAsBytes(file);
      obj = await gzip.decompressToJson(arrayBuffer);
    } else {
      const json = await readFile(file);
      obj = JSON.parse(json);
    }

    await Inserter.insert(obj as Har, filename);

    refetch();
  } catch (e) {
    alert("Could not load the file");
    console.error(e);
  }
}

function collectionUrl(collectionName: string) {
  return `/collection/${encodeURIComponent(collectionName)}`;
}
