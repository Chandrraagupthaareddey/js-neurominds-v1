/**
 * JS Neurominds V1 — scripts/clean-dist.js
 * Removes build output + generated SEO stubs so each build starts clean.
 */
import { rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  'dist', 'dist-admin', 'public-site/p', 'public-site/sitemap.xml', 'public-site/robots.txt',
  // pre-rendered detail pages (scripts/build-pages.js)
  'public-site/conditions', 'public-site/treatments', 'public-site/doctors', 'public-site/knowledge', 'public-site/lab'
];

for (const t of targets) {
  const p = resolve(root, t);
  if (existsSync(p)) { rmSync(p, { recursive: true, force: true }); console.log('cleaned', t); }
}
console.log('clean complete');
