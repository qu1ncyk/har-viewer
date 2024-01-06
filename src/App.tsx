import { Component, lazy } from "solid-js";
import { Route, Router } from "@solidjs/router";

import SwLoader from "./SwLoader";

const Home = lazy(() => import("./pages/Home"));
const Collection = lazy(() => import("./pages/Collection"));
const Viewer = lazy(() => import("./pages/Viewer"));

const App: Component = () => {
  return (
    <Router root={SwLoader}>
      <Route path="/" component={Home} />
      <Route path="/collection/:name" component={Collection} />
      <Route path="/viewer/:name/*url" component={Viewer} />
    </Router>
  );
};

export default App;
