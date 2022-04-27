import { Component, lazy } from 'solid-js';
import { Route, Routes } from 'solid-app-router';

import SwLoader from './SwLoader';

const Home = lazy(() => import('./pages/Home'));

const App: Component = () => {
  return (
    <SwLoader>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </SwLoader>
  );
};

export default App;
