import { useNavigate, useParams } from "@solidjs/router";
import { Component, createResource, For, Show } from "solid-js";
import { icons } from "feather-icons";

import styles from "./Collection.module.css";
import { get, deleteCollection } from "../db";
import { noun } from "../utils";
import Feather from "../Feather";
import { refetch } from "./Home";

const Collection: Component = () => {
  const encodedName = useParams().name;
  const name = decodeURIComponent(encodedName);
  const [pages] = createResource(name, get.pages);
  const navigate = useNavigate();

  return (
    <>
      <h1>HAR viewer</h1>
      <a href="/" class={styles.back}>
        <Feather icon={icons.x} />
      </a>
      <Show when={!pages.loading} fallback={<p>Loading...</p>}>
        <div>
          <span>Found {pages()?.length} {noun("page", pages()?.length !== 1)} in {name}</span>
          <button class={styles.delete} onClick={() => {
            deleteCollection(name);
            navigate("/");
            refetch();
          }}>
            <Feather icon={icons["trash-2"]} />
          </button>
        </div>
        <ul class={styles.list}>
          <For each={pages()}>{(page) =>
            <li>
              {/* the `Link` component removes trailing slashes, which should stay */}
              <a
                rel="external"
                href={`/viewer/${encodedName}/${page.url}`}
                class={styles.pageName}
              >
                {page.title}
              </a>
            </li>
          }</For>
        </ul>
      </Show>
    </>
  );
}

export default Collection;
