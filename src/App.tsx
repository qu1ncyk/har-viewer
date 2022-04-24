import { Component, lazy } from 'solid-js';
import { Route, Routes } from 'solid-app-router';

const Home = lazy(() => import('./pages/Home'));

const App: Component = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
};

export default App;
