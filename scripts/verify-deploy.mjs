#!/usr/bin/env node
/**
 * WHAATEVER — deployment verification.
 *
 * Reproduces, locally, the exact checks that decide whether a Vercel deployment
 * works, so a broken deploy is caught here instead of in production:
 *
 *   1. `vercel.json` is validated with Vercel's OWN routing code
 *      (@vercel/routing-utils#getTransformedRoutes) — the same function the
 *      deploy pipeline runs. Invalid `rewrites` / `headers` sources are the
 *      single most common cause of a failed or 404-ing Vercel deploy.
 *   2. The rewritten routing table is simulated against `dist/` to prove that
 *      static assets resolve from the filesystem AND that deep links
 *      (/trending, /about, …) fall through to index.html instead of 404-ing.
 *   3. `dist/` is asserted to contain every crawler asset (robots.txt,
 *      sitemap.xml, manifest, icons, OG image) and every asset referenced by
 *      index.html.
 *   4. The prerendered SEO payload inside index.html is asserted (title,
 *      description, keywords, canonical, Open Graph, Twitter card, JSON-LD).
 *   5. sitemap.xml + robots.txt are cross-checked against the real routes and
 *      the canonical domain.
 *
 * Usage: npm run verify:deploy   (run `npm run build` first)
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const CONFIG_PATH = resolve(ROOT, 'vercel.json');
const ORIGIN = 'https://whaatever.vercel.app';

const failures = [];
const warnings = [];
const checks = [];

function pass(message) {
  checks.push({ ok: true, message });
  console.log(`  ✅ ${message}`);
}

function fail(message, detail) {
  checks.push({ ok: false, message });
  failures.push(detail ? `${message}\n     ↳ ${detail}` : message);
  console.log(`  ❌ ${message}${detail ? `\n     ↳ ${detail}` : ''}`);
}

function warn(message) {
  warnings.push(message);
  console.log(`  ⚠️  ${message}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/* ------------------------------------------------------------------ 1. dist */

console.log('\n[1/6] Build output (dist/)');

if (!existsSync(DIST)) {
  fail('dist/ is missing — run `npm run build` first.');
  report();
} else {
  pass('dist/ exists');

  const requiredFiles = [
    'index.html',
    'robots.txt',
    'sitemap.xml',
    'site.webmanifest',
    'favicon.svg',
    'og-image.png',
    'apple-touch-icon.png',
  ];

  // Deep links must exist as REAL static files, so they never depend on a
  // hosting-level SPA rewrite (which proved unreliable in production).
  const sitemapSource = readFileSync(resolve(DIST, 'sitemap.xml'), 'utf8');
  const sitemapPaths = [...sitemapSource.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, url]) => url.trim().replace(ORIGIN, '').replace(/\/+$/, ''))
    .filter((path) => path.length > 0 && path !== '/');

  for (const route of sitemapPaths) {
    requiredFiles.push(`${route.replace(/^\//, '')}.html`);
  }

  for (const file of requiredFiles) {
    const path = resolve(DIST, file);
    if (existsSync(path) && statSync(path).size > 0) {
      pass(`dist/${file} (${(statSync(path).size / 1024).toFixed(1)} KB)`);
    } else {
      fail(`dist/${file} is missing or empty — Vercel would serve a 404 for it.`);
    }
  }
}

/* -------------------------------------------------------------- 2. vercel.json */

console.log('\n[2/6] vercel.json validity (using Vercel\'s own routing code)');

const config = readJson(CONFIG_PATH);
let transformedRoutes = null;

try {
  const { getTransformedRoutes } = await import('@vercel/routing-utils');
  const result = getTransformedRoutes({
    cleanUrls: config.cleanUrls,
    trailingSlash: config.trailingSlash,
    rewrites: config.rewrites,
    redirects: config.redirects,
    headers: config.headers,
  });

  if (result.error) {
    fail('Vercel rejected the routing config', JSON.stringify(result.error, null, 2));
  } else {
    transformedRoutes = result.routes;
    pass(`vercel.json accepted — ${transformedRoutes.length} routing rules generated`);
  }
} catch (error) {
  warn(`@vercel/routing-utils unavailable (${error.message}); falling back to structural checks`);
}

if (config.framework !== 'vite') fail(`framework should be "vite" (found ${config.framework})`);
else pass('framework = vite');

if (config.outputDirectory !== 'dist') fail(`outputDirectory should be "dist" (found ${config.outputDirectory})`);
else pass('outputDirectory = dist');

if (config.buildCommand !== 'npm run build') fail(`buildCommand should be "npm run build"`);
else pass('buildCommand = npm run build');

const destinations = (config.rewrites ?? []).map((route) => route.destination);
if (!destinations.includes('/index.html')) {
  fail('No rewrite points at /index.html — every deep link (e.g. /trending) would 404 on Vercel');
} else {
  pass('SPA rewrite → /index.html present');
}

// Every rewrite/header source must be a plain path-to-regexp pattern.
const riskyPatterns = [...(config.rewrites ?? []), ...(config.headers ?? [])]
  .map((route) => route.source)
  .filter((source) => /\(\?[=!<]/.test(source));

if (riskyPatterns.length > 0) {
  warn(`Lookarounds in route sources can behave differently on Vercel: ${riskyPatterns.join(', ')}`);
} else {
  pass('No lookaround regexes in rewrites/headers sources');
}

/* ---------------------------------------------------------- 3. routing model */

console.log('\n[3/6] Request simulation against the real dist/ (filesystem → rewrite)');

/** Mirrors Vercel: serve the file if it exists, otherwise apply the SPA rewrite. */
function resolveRequest(pathname) {
  const clean = pathname.split('?')[0].split('#')[0];

  const candidates = [];
  if (clean === '/') {
    candidates.push('/index.html');
  } else if (extname(clean) !== '') {
    candidates.push(clean);
  } else {
    // cleanUrls: /about serves /about.html; directory-style: /about/index.html
    candidates.push(`${clean}.html`, `${clean}/index.html`);
  }

  for (const candidate of candidates) {
    if (existsSync(resolve(DIST, `.${candidate}`))) {
      return { status: 200, served: candidate, via: 'filesystem' };
    }
  }

  const hasSpaRewrite = (config.rewrites ?? []).some((route) => route.destination === '/index.html');
  if (hasSpaRewrite && existsSync(resolve(DIST, 'index.html'))) {
    return { status: 200, served: '/index.html', via: 'rewrite' };
  }

  return { status: 404, served: null, via: 'none' };
}

const deepLinks = ['/', '/trending', '/about', '/guidelines', '/privacy'];
for (const route of deepLinks) {
  const result = resolveRequest(route);
  const expectedPrerendered = route === '/' ? null : `${route}.html`;

  if (result.status !== 200) {
    fail(`GET ${route} → ${result.status}`, 'Deep links must resolve to the app shell');
    continue;
  }

  if (expectedPrerendered && result.served === expectedPrerendered) {
    pass(`GET ${route} → 200 ${result.served} (prerendered static file — no rewrite needed)`);
  } else if (result.served === '/index.html') {
    pass(`GET ${route} → 200 index.html (${result.via})`);
  } else {
    fail(`GET ${route} → 200 but served ${result.served}`, `Expected ${expectedPrerendered ?? '/index.html'}`);
  }
}

// Static assets must be served from disk, never rewritten to HTML.
const assetFiles = existsSync(resolve(DIST, 'assets'))
  ? (await import('node:fs')).readdirSync(resolve(DIST, 'assets'))
  : [];

if (assetFiles.length === 0) {
  fail('dist/assets/ is empty — the bundle was not emitted');
} else {
  for (const asset of assetFiles) {
    const result = resolveRequest(`/assets/${asset}`);
    if (result.status === 200 && result.served === `/assets/${asset}` && result.via === 'filesystem') {
      pass(`GET /assets/${asset} → 200 (filesystem)`);
    } else {
      fail(`GET /assets/${asset} → ${result.status} via ${result.via}`, 'Assets must not be rewritten to HTML');
    }
  }
}

for (const file of ['/robots.txt', '/sitemap.xml', '/og-image.png', '/favicon.svg', '/site.webmanifest']) {
  const result = resolveRequest(file);
  if (result.status === 200 && result.via === 'filesystem') pass(`GET ${file} → 200 (filesystem)`);
  else fail(`GET ${file} → ${result.status} via ${result.via}`);
}

/* ------------------------------------------------------------- 4. index.html */

console.log('\n[4/6] Prerendered SEO payload in index.html');

const html = readFileSync(resolve(DIST, 'index.html'), 'utf8');

const htmlAssertions = [
  ['<title> tag', /<title[^>]*>WHAATEVER \| The Ultimate Anonymous Posting &amp; Confession Platform<\/title>/],
  ['meta description', /name="description"[\s\S]{0,200}?content="Welcome to WHAATEVER at WHAATEVER\.VERCEL\.APP/],
  ['meta keywords', /name="keywords"[\s\S]{0,400}?content="WHAATEVER, WHAATEVER\.VERCEL\.APP, anonymous posting/],
  ['canonical link', /rel="canonical" href="https:\/\/whaatever\.vercel\.app\/"/],
  ['og:url', /property="og:url" content="https:\/\/whaatever\.vercel\.app\/"/],
  ['og:image', /property="og:image" content="https:\/\/whaatever\.vercel\.app\/og-image\.png"/],
  ['og:type', /property="og:type" content="website"/],
  ['twitter:card', /name="twitter:card" content="summary_large_image"/],
  ['JSON-LD structured data', /application\/ld\+json/],
  ['noscript SEO fallback', /<noscript>/],
  ['robots meta', /name="robots"/],
];

for (const [label, pattern] of htmlAssertions) {
  if (pattern.test(html)) pass(`${label} present`);
  else fail(`${label} missing from index.html`);
}

// Every locally referenced asset must exist in dist/.
const referenced = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)]
  .map((match) => match[1])
  .filter((href) => !href.startsWith('//'));

for (const href of referenced) {
  if (href === '/') continue;
  const onDisk = resolve(DIST, `.${href.split('?')[0]}`);
  if (existsSync(onDisk)) pass(`index.html references ${href} → exists`);
  else fail(`index.html references ${href} but it is not in dist/`, 'This would 404 in production');
}

/* ------------------------------------------------- 5. sitemap + robots checks */

console.log('\n[5/6] sitemap.xml + robots.txt cross-check');

const sitemap = readFileSync(resolve(DIST, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

if (sitemapUrls.length === 0) {
  fail('sitemap.xml contains no <loc> entries');
} else {
  pass(`sitemap.xml lists ${sitemapUrls.length} URLs`);
}

for (const url of sitemapUrls) {
  if (!url.startsWith(`${ORIGIN}/`)) {
    fail(`sitemap.xml URL is not on ${ORIGIN}: ${url}`);
    continue;
  }
  const path = url.slice(ORIGIN.length) || '/';
  const result = resolveRequest(path);
  if (result.status === 200) pass(`sitemap route ${path} is servable (${result.via})`);
  else fail(`sitemap route ${path} is not servable — search engines would index a 404`);
}

const robots = readFileSync(resolve(DIST, 'robots.txt'), 'utf8');
if (robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) pass('robots.txt points at the live sitemap');
else fail('robots.txt does not declare the sitemap URL');

if (/^User-agent: \*/m.test(robots) && /^Allow: \/$/m.test(robots)) pass('robots.txt allows crawling');
else fail('robots.txt does not allow crawling');

/* --------------------------------------------------------- 6. deploy guidance */

console.log('\n[6/6] Deployment preflight');

const pkg = readJson(resolve(ROOT, 'package.json'));

const buildScript = pkg.scripts?.build ?? '';

// The build must never depend on test/type tooling being installed on the build
// image (Vercel installs production dependencies first). Plain Node scripts are
// fine — they ship with Node itself.
if (/\b(tsc|vitest|jest|eslint)\b/.test(buildScript)) {
  fail(`build script depends on dev-only tooling: "${buildScript}"`, 'Vercel may not have it installed');
} else if (buildScript.includes('vite build')) {
  pass(`build script is deploy-safe: "${buildScript}"`);
} else {
  fail(`build script does not run vite build (found "${buildScript}")`);
}

if (buildScript.includes('prerender-routes.mjs')) {
  pass('build prerenders static route files for deep links');
} else {
  warn('build does not prerender route files — deep links depend entirely on the SPA rewrite');
}

if (existsSync(resolve(ROOT, 'node_modules'))) pass('node_modules present (dependencies installed)');
else warn('node_modules missing — run `npm install` before building/deploying');

try {
  const viteConfig = readFileSync(resolve(ROOT, 'vite.config.ts'), 'utf8');
  if (viteConfig.includes("from 'vitest")) {
    fail("vite.config.ts imports from 'vitest' — this can break the Vercel build");
  } else {
    pass('vite.config.ts imports only from vite');
  }
} catch {
  warn('vite.config.ts could not be read');
}

if (existsSync(resolve(ROOT, '.nvmrc'))) pass('.nvmrc pins the Node version for Vercel');
else warn('.nvmrc missing — Vercel will use its default Node version');

console.log(`\n  ℹ️  Vercel deploys the repository's PRODUCTION branch (main by default).`);
console.log(`     If main is not this branch, either merge the pull request first or set`);
console.log(`     Settings → Git → Production Branch to the branch you want live at ${ORIGIN}`);

/* -------------------------------------------------------------------- report */

function report() {
  const total = checks.length + failures.length;
  console.log('\n' + '─'.repeat(64));

  if (failures.length === 0) {
    console.log(`✅ DEPLOY-READY — ${checks.filter((check) => check.ok).length}/${total} checks passed`);
    if (warnings.length > 0) {
      console.log(`⚠️  ${warnings.length} warning(s):`);
      for (const message of warnings) console.log(`   • ${message}`);
    }
    console.log('─'.repeat(64) + '\n');
    process.exit(0);
  }

  console.log(`❌ ${failures.length} problem(s) found — this deployment would fail or break:`);
  for (const message of failures) console.log(`   • ${message}`);
  console.log('─'.repeat(64) + '\n');
  process.exit(1);
}

report();
