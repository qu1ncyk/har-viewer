import { Component, createSignal, For, onMount } from "solid-js";
import type { Har } from "har-format";
import { Link } from "solid-app-router";

import { readFile } from "../utils";
import { insert, get } from "../db";
import styles from "./Home.module.css";

const Home: Component = () => {
  const [collections, setCollections] = createSignal([] as [string, Date][]);

  onMount(async () => {
    setCollections(await get.collections());
  });

  return (
    <>
      <h1>HAR viewer</h1>
      <p>Upload a <code>.har</code> file or choose a previously loaded file</p>
      <input type="file" accept=".har, application/json" onInput={upload} />
      <ul class={styles.list}>
        <For each={collections()}>{([name, time]) =>
          <li>
            <Link href={collectionUrl(name)} class={styles.collectionName}>{name}</Link>
            <p class={styles.subtitle}>Snapshot taken at {time.toLocaleString()}</p>
          </li>
        }</For>
      </ul>
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

    await insert(obj as Har, filename);
  } catch (e) {
    alert("Could not load the file");
    console.error(e);
  }
}

function collectionUrl(collectionName: string) {
  return `/collection/${encodeURIComponent(collectionName)}`;
}