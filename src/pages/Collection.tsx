import { Link, useParams } from "solid-app-router";
import { Component, createResource, For, Show } from "solid-js";
import { icons } from "feather-icons";

import styles from "./Collection.module.css";
import { get } from "../db";
import { noun } from "../utils";
import Feather from "../Feather";

const Collection: Component = () => {
  const encodedName = useParams().name;
  const name = decodeURIComponent(encodedName);
  const [pages] = createResource(name, get.pages);

  return (
    <>
      <h1>HAR viewer</h1>
      <Link href="/" class={styles.back}>
        <Feather icon={icons.x} />
      </Link>
      <Show when={!pages.loading} fallback={<p>Loading...</p>}>
        <p>Found {pages()?.length} {noun("page", pages()?.length !== 1)} in {name}</p>
        <ul class={styles.list}>
          <For each={pages()}>{(page) =>
            <li>
              <Link href={`/viewer/${encodedName}/${page.url}`} class={styles.pageName}>{page.title}</Link>
            </li>
          }</For>
        </ul>
      </Show>
    </>
  );
}

export default Collection;