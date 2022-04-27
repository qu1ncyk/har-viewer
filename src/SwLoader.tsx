import { Component, createSignal, Match, onMount, Switch } from "solid-js";

import styles from "./SwLoader.module.css";
import { register } from "./sw/register";

const Popup: Component = (props) => {
  const [error, setError] = createSignal("");
  const [loaded, setLoaded] = createSignal(false);

  onMount(async () => {
    try {
      await register();
      setLoaded(true);
    } catch (e: any) {
      setError(e.message);
    }
  });

  return (
    <Switch fallback={props.children}>
      <Match when={error() !== ""}>
        <div class={styles.error}>
          <p>Error: {error()}</p>
        </div>
      </Match>
      <Match when={!loaded()}>
        <div class={styles.container}>
          <p>Loading the service worker...</p>
        </div>
      </Match>
    </Switch>
  );
}

export default Popup;