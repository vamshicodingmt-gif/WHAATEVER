import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

/**
 * Vitest setup for WHAATEVER.
 *
 * jsdom does not implement a handful of browser APIs the app gracefully
 * degrades around, so they are stubbed here rather than being removed from the
 * production code — the app still exercises its real fallback paths.
 */

// CI runners and sandboxes are heavily contended. The app's real render path
// includes a hydration pass plus a debounced localStorage flush, so async
// utilities get a generous ceiling to keep the suite deterministic under load
// instead of flaking on slow machines.
configure({
  asyncUtilTimeout: 8_000,
  asyncWrapper: async (callback) => {
    const result = await callback();
    // Let React flush any effects scheduled during the awaited assertion.
    await new Promise((resolve) => setTimeout(resolve, 0));
    return result;
  },
});

// jsdom has no layout engine, so smooth scrolling is a no-op.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
Element.prototype.scrollIntoView = vi.fn();

// Clipboard + share APIs only exist in secure browser contexts.
Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
