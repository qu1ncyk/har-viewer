import { Component, createResource, For, Show } from "solid-js";
import type { Har } from "har-format";
import { Link } from "solid-app-router";

import { formatSize, readFile } from "../utils";
import { Inserter, get } from "../db";
import styles from "./Home.module.css";

const [collections, { refetch }] = createResource(get.collections);
export { refetch };

const Home: Component = () => {
  return (
    <>
      <h1>HAR viewer</h1>
      <p>Upload a <code>.har</code> file or choose a previously loaded file</p>
      <input type="file" accept=".har, application/json" onInput={upload} />
      <Show when={!collections.loading} fallback={<p>Loading...</p>}>
        <ul class={styles.list}>
          <For each={collections()}>{([name, value]) =>
            <li>
              <Link href={collectionUrl(name)} class={styles.collectionName}>{name}</Link>
              <p class={styles.subtitle}>Snapshot taken at {value.time.toLocaleString()}</p>
              <p class={styles.subtitle}>{formatSize(value.size)}</p>
            </li>
          }</For>
        </ul>
      </Show>
    </>
  );
}

export default Home;

async function upload(event: InputEvent) {
  try {
    const element = event.currentTarget as HTMLInputElement;

    const json = await readFile(element);
    const obj = JSON.parse(json);

    const filename = element.files?.[0].name ?? "";

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
