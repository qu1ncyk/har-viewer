import { Component, lazy } from 'solid-js';
import { Route, Routes } from 'solid-app-router';

import SwLoader from './SwLoader';

const Home = lazy(() => import('./pages/Home'));
const Collection = lazy(() => import('./pages/Collection'));

const App: Component = () => {
  return (
    <SwLoader>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collection/:name" element={<Collection />} />
      </Routes>
    </SwLoader>
  );
};

export default App;
