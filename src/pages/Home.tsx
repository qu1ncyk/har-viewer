import { Component } from "solid-js";
import type { Har } from "har-format";

import { readFile } from "../utils";
import { insert } from "../db";

const Home: Component = () => {
  return (
    <>
      <h1>HAR viewer</h1>
      <p>Upload a <code>.har</code> file or choose a previously loaded file</p>
      <input type="file" accept=".har, application/json" onInput={upload} />
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