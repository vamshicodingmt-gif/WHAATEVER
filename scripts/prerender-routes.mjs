#!/usr/bin/env node
/**
 * WHAATEVER — route prerendering.
 *
 * Deep links must never 404, and relying solely on a hosting-level SPA rewrite
 * has proven fragile (the rewrite was not applied on the production deployment,
 * so /trending and /about returned Vercel's 404 page while /, /robots.txt and
 * /sitemap.xml worked fine).
 *
 * This post-build step removes that dependency: for every indexable route in
 * `public/sitemap.xml` it writes a REAL HTML file into `dist/`
 * (`dist/trending.html`, `dist/about.html`, …). With `cleanUrls: true` in
 * `vercel.json`, Vercel serves `/trending` straight from `trending.html` as a
 * plain static file — no rewrite required.
 *
 * Single source of truth: the sitemap. Add a route there and it is covered.
 * The client-side router still takes over inside the page, so each file is the
 * same app shell; only the URL differs.
 *
 * Usage: runs automatically as part of `npm run build`.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const SITEMAP = resolve(ROOT, 'public', 'sitemap.xml');
const ORIGIN = 'https://whaatever.vercel.app';

const indexPath = resolve(DIST, 'index.html');

if (!existsSync(indexPath)) {
  console.error('✖ prerender-routes: dist/index.html is missing — run `vite build` first.');
  process.exit(1);
}

if (!existsSync(SITEMAP)) {
  console.error('✖ prerender-routes: public/sitemap.xml is missing.');
  process.exit(1);
}

const shell = readFileSync(indexPath, 'utf8');
const sitemap = readFileSync(SITEMAP, 'utf8');

/** Every <loc> in the sitemap, reduced to a site-relative path. */
const routes = [
  ...new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(([, url]) => url.trim().replace(ORIGIN, ''))
      .map((path) => path.replace(/\/+$/, ''))
      .filter((path) => path.length > 0 && path !== '/'),
  ),
];

if (routes.length === 0) {
  console.error('✖ prerender-routes: no routes found in sitemap.xml.');
  process.exit(1);
}

let written = 0;

for (const route of routes) {
  // Defensive: never escape dist/, and only handle simple path segments.
  if (!/^\/[A-Za-z0-9\-_/]+$/.test(route)) {
    console.warn(`  ⚠ skipped unsupported route: ${route}`);
    continue;
  }

  const segments = route.split('/').filter(Boolean);
  const target = join(DIST, `${segments.join('/')}.html`);

  if (!target.startsWith(DIST)) {
    console.warn(`  ⚠ skipped unsafe path: ${route}`);
    continue;
  }

  mkdirSync(dirname(target), { recursive: true });

  // The shell already carries the full SEO payload for the homepage; route-level
  // metadata is applied client-side per route by SEOHead.
  writeFileSync(target, shell, 'utf8');
  written += 1;
  console.log(`  prerendered ${route.padEnd(12)} → dist/${segments.join('/')}.html`);
}

console.log(`✔ prerender-routes: ${written} static route file(s) written (no SPA rewrite required)`);
