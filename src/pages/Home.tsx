import { Component, createSignal, onMount } from "solid-js";

const Home: Component = () => {
  const [text, setText] = createSignal("");
  
  onMount(async () => {
    const response = await fetch("/test-sw");
    setText(await response.text());
  });

  return <div>home {text()}</div>;
}

export default Home;