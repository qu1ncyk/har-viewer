import { Link, useParams } from "solid-app-router";
import { Component, createResource, For, Show } from "solid-js";

import styles from "./Collection.module.css";
import { get } from "../db";
import { noun } from "../utils";

const Collection: Component = () => {
  const name = decodeURIComponent(useParams().name);
  const [pages] = createResource(name, get.pages);

  return (
    <>
      <h1>HAR viewer</h1>
      <Show when={!pages.loading} fallback={<p>Loading...</p>}>
        <p>Found {pages()?.length} {noun("page", pages()?.length !== 1)} in {name}</p>
        <ul class={styles.list}>
          <For each={pages()}>{([id, title]) =>
            <li>
              <Link href="" class={styles.pageName}>{title}</Link>
            </li>
          }</For>
        </ul>
      </Show>
    </>
  );
}

export default Collection;