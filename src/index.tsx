/* @refresh reload */
import { render } from "solid-js/web";
import { Router } from "solid-app-router";

import "./index.css";
import App from "./App";
import { register } from "./sw/register";

render(() =>
    <Router>
        <App />
    </Router>,
    document.getElementById("root") as HTMLElement
);

register()
    .then(() => fetch("/test-sw"))
    .then(x => x.text())
    .then(alert);