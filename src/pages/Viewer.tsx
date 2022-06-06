import { Component, createEffect, createSignal } from "solid-js";
import { icons } from "feather-icons";
import { useParams, useLocation } from "solid-app-router";

import styles from "./Viewer.module.css";
import Feather from "../Feather";
import { viewerExtractUrl, viewExtractUrl } from "../utils";

const Viewer: Component = () => {
  const { name } = useParams();

  // `useParams()` removes some slashes, so I extract the url myself instead
  const { pathname } = useLocation();
  const [iframeSrc, setIframeSrc] = createSignal(viewerExtractUrl(pathname));

  /* When the url changes in the iframe window, the url in the input field and
     url should change, but the `src` attribute of the `iframe` should not. But
     when `src` changes, the input and url should change as well.

      input submit       iframe onload
            v                 v
     iframeSrc signal -> url signal
            v                   v
  iframe src attribute   input value & url bar
  */
  const [url, setUrl] = createSignal<string>();
  createEffect(() => setUrl(iframeSrc()));
  createEffect(() => {
    history.replaceState(null, "", `/viewer/${name}/${url()}`);
  });

  let input: HTMLInputElement | undefined;
  let iframe: HTMLIFrameElement | undefined;

  function submitHandler(e: SubmitEvent) {
    e.preventDefault();
    if (input)
      setIframeSrc(input.value);
  }

  function frameLoad(e: Event) {
    if (iframe?.contentWindow) {
      console.log(iframe);
      setUrl(viewExtractUrl(iframe.contentWindow.location.href));
    }
  }

  return (
    <div class={styles.container}>
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
        <input class={styles.input} form="url-bar" type="url" value={url()} ref={input} />
      </div>

      <iframe class={styles.frame} src={`/view/${name}/0mp_/${url()}`} onLoad={frameLoad} ref={iframe}></iframe>
    </div>
  );
}

export default Viewer;