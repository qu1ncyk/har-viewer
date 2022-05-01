import { Link, useParams } from "solid-app-router";
import { Component, createSignal, For, onMount } from "solid-js";

import styles from "./Collection.module.css";
import { get } from "../db";
import { noun } from "../utils";

const Collection: Component = () => {
  const name = decodeURIComponent(useParams().name);
  const [pages, setPages] = createSignal([] as [string, string][]);

  onMount(async () => {
    setPages(await get.pages(name));
  });

  return (
    <>
      <h1>HAR viewer</h1>
      <p>Found {pages().length} {noun("page", pages().length !== 1)} in {name}</p>
      <ul class={styles.list}>
        <For each={pages()}>{([id, title]) =>
          <li>
            <Link href="" class={styles.pageName}>{title}</Link>
          </li>
        }</For>
      </ul>
    </>
  );
}

export default Collection;