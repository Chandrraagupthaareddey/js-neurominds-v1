/**
 * JS Neurominds V1 — scripts/inline-css.js
 * Post-build: inline the (small, ~9 KB gz) Vite CSS bundle into every HTML
 * page in dist/ so first paint needs only the HTML — one fewer round-trip on
 * slow mobile networks (removes the "render-blocking request"). The .css file
 * is kept for any page that still references it. Runs after `vite build`.
 */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
if (!existsSync(dist)) { console.log('inline-css: no dist/ — skipped'); process.exit(0); }

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) { if (n !== 'admin' && n !== 'assets') walk(p, out); }
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

const cssCache = new Map();
let pages = 0, inlined = 0;
for (const file of walk(dist)) {
  let html = readFileSync(file, 'utf8');
  const before = html;
  html = html.replace(/<link rel="stylesheet"([^>]*?)href="(\/assets\/[^"]+\.css)"[^>]*>/g, (m, attrs, href) => {
    const p = join(dist, href);
    if (!existsSync(p)) return m;
    if (!cssCache.has(href)) cssCache.set(href, readFileSync(p, 'utf8').replace(/<\/style/gi, '<\\/style'));
    inlined++;
    return `<style data-inlined="${href}">${cssCache.get(href)}</style>`;
  });
  if (html !== before) { writeFileSync(file, html); pages++; }
}
console.log(`inline-css: inlined ${inlined} stylesheet reference(s) across ${pages} page(s)`);
