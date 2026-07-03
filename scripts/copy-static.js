/**
 * JS Neurominds V1 — scripts/copy-static.js
 * Vite (MPA) only emits the HTML entries listed in rollupOptions.input and the
 * JS/CSS they import. The generated SEO stubs (public-site/p/**), the sitemap,
 * the brand asset folder, and the web manifest are static files that must also
 * ship. This step mirrors them into dist/ after the Vite build so Cloudflare
 * Pages serves them at their canonical paths.
 *
 * Idempotent: it only copies; it never edits source. Runs after `vite build`.
 */
import { cpSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2] === 'admin' ? 'admin' : 'public';

const src = resolve(root, target === 'admin' ? 'admin-ui' : 'public-site');
const dist = resolve(root, target === 'admin' ? 'dist-admin' : 'dist');

if (!existsSync(dist)) mkdirSync(dist, { recursive: true });

// path-in-source -> required: warn if a required item is missing.
const items = target === 'admin'
  ? [
      { rel: 'assets/brand', required: true }
    ]
  : [
      { rel: 'p', required: false },                 // SEO stubs (skipped when no stubs)
      { rel: 'sitemap.xml', required: true },
      { rel: 'assets/brand', required: true },
      { rel: 'assets/img', required: false },
      { rel: 'site.webmanifest', required: true },
      { rel: 'robots.txt', required: false }
    ];

let copied = 0;
const missing = [];
for (const it of items) {
  const from = resolve(src, it.rel);
  if (!existsSync(from)) { if (it.required) missing.push(it.rel); continue; }
  cpSync(from, resolve(dist, it.rel), { recursive: true });
  copied++;
}

console.log(`copy-static(${target}): mirrored ${copied} static path(s) into ${target === 'admin' ? 'dist-admin' : 'dist'}/`);
if (missing.length) {
  console.warn('copy-static: WARNING missing required static files: ' + missing.join(', '));
}
