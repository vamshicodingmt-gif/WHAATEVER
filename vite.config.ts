import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * WHAATEVER — 100% client-side rendered (CSR) single page application.
 *
 * There is no backend, no database and no server-side runtime. Everything the
 * app needs is compiled into `dist/` as plain static files, which is why it can
 * be dropped onto Vercel (or any static host / CDN) with zero configuration.
 *
 * This file intentionally imports ONLY from `vite` so that a production build
 * never depends on test tooling being installed (see `vitest.config.ts`).
 *
 * SPA fallback routing is handled by `vercel.json` -> `rewrites` so that deep
 * links such as /trending or /#post-<id> resolve to index.html.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    // Allow proxied preview hosts (Arena / E2B style) to reach the dev server.
    allowedHosts: true,
    cors: true,
    hmr: {
      clientPort: 443,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2018',
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          seo: ['react-helmet-async'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
