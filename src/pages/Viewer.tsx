import { Component, createEffect, createSignal } from "solid-js";
import { icons } from "feather-icons";
import { useParams } from "@solidjs/router";

import styles from "./Viewer.module.css";
import Feather from "../Feather";
import { viewerExtractUrl, viewExtractUrl } from "../utils";

const Viewer: Component = () => {
  const { name } = useParams();

  // `useParams()` removes some slashes, so I extract the url myself instead
  const { pathname, search, hash } = new URL(location.href)
  const [iframeSrc, setIframeSrc] = createSignal(viewerExtractUrl(pathname + search + hash));

  /* When the url changes in the iframe window, the url in the input field and
     url should change, but the `src` attribute of the `iframe` should not. But
     when the form gets submitted, the `src` attribute and url should change.

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
      setUrl(viewExtractUrl(iframe.contentWindow.location.href));
    }
  }

  function frameAction(action: "back" | "forward" | "reload") {
    return () => {
      const frameWindow = iframe?.contentWindow;
      if (frameWindow) {
        switch (action) {
          case "back":
            frameWindow.history.back();
            break;
          case "forward":
            frameWindow.history.forward();
            break;
          case "reload":
            frameWindow.location.reload();
            break;
        }
      }
    };
  }

  const [topBarHidden, setTopBarHidden] = createSignal(false);

  return (
    <div class={styles.container} classList={{ [styles.topBarHidden]: topBarHidden() }}>
      <div class={styles.topBar}>
        <a href={`/collection/${name}`} class={styles.iconButton}>
          <Feather icon={icons.x} />
        </a>
        <button class={styles.iconButton} onClick={frameAction("back")}>
          <Feather icon={icons["arrow-left"]} />
        </button>
        <button class={styles.iconButton} onClick={frameAction("forward")}>
          <Feather icon={icons["arrow-right"]} />
        </button>
        <button class={styles.iconButton} onClick={frameAction("reload")}>
          <Feather icon={icons["refresh-cw"]} />
        </button>
        <form id="url-bar" onSubmit={submitHandler} />
        <input class={styles.input} form="url-bar" type="url" value={url()} ref={input} />
        <button class={styles.hideButton} onClick={() => setTopBarHidden(x => !x)}>
          <Feather icon={icons["chevron-up"]} />
        </button>
      </div>

      <iframe
        class={styles.frame}
        src={`/view/${name}/0mp_/${iframeSrc()}`}
        onLoad={frameLoad}
        ref={iframe}
      ></iframe>
    </div>
  );
}

export default Viewer;
