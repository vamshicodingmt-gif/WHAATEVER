import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/**
 * Vitest setup for WHAATEVER.
 *
 * jsdom does not implement a handful of browser APIs the app gracefully
 * degrades around, so they are stubbed here rather than being removed from the
 * production code — the app still exercises its real fallback paths.
 */

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
