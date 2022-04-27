import { Component } from "solid-js";

import { readFile } from "../utils";

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
  let file = await readFile(event.currentTarget as HTMLInputElement);
  alert(file);
}