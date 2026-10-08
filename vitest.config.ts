import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Vitest configuration.
 *
 * Kept separate from `vite.config.ts` on purpose: the production build must be
 * able to run with `vite` alone (Vercel installs production dependencies first,
 * and a build that imports `vitest/config` would fail in that situation).
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
    // Generous ceilings so a contended CI runner cannot turn a slow render into
    // a red build. The suite normally finishes each test in well under 2s.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    teardownTimeout: 15_000,
  },
});
