import { Component } from "solid-js";
import Feather from "../Feather";
import { icons } from "feather-icons";

import styles from "./Viewer.module.css";

const Viewer: Component = () => {
  return (
    <div class={styles.topBar}>
      <button class={styles.iconButton}>
        <Feather icon={icons.x} />
      </button>
      <button class={styles.iconButton}>
        <Feather icon={icons["arrow-left"]} />
      </button>
      <button class={styles.iconButton}>
        <Feather icon={icons["arrow-right"]} />
      </button>
      <button class={styles.iconButton}>
        <Feather icon={icons["refresh-cw"]} />
      </button>
      <form id="url-bar" onSubmit={submitHandler} />
      <input class={styles.input} form="url-bar" type="url" />
    </div>
  );
}

export default Viewer;

function submitHandler(e: SubmitEvent) {
  e.preventDefault();
}