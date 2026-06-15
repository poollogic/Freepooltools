import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Motion is NOT mounted globally — only the routes that animate wrap themselves
// in <MotionProvider> (see src/components/MotionProvider.tsx), so the ~80KB
// motion chunk stays off the critical path of the calculator pages.
const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// If the route was prerendered, #root already contains rendered markup —
// hydrate in place to preserve it (instant LCP). Otherwise fall back to a
// fresh client render so SPA-only routes (404, etc.) still work.
const rootEl = document.getElementById('root')!;
if (rootEl.firstChild) {
  hydrateRoot(rootEl, tree);
} else {
  createRoot(rootEl).render(tree);
}
