import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import '@/index.css';

/**
 * WHAATEVER — client-side entry point.
 *
 * There is no server render step: the browser boots React, React hydrates the
 * feed from localStorage, and every route is resolved in the browser. That is
 * what makes WHAATEVER a genuine 100% client-side rendered (CSR) SPA.
 */
const container = document.getElementById('root');

if (!container) {
  throw new Error('WHAATEVER could not find the #root mount node in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
