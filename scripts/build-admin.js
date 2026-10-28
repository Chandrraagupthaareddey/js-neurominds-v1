/**
 * JS Neurominds V1 — scripts/build-admin.js
 * Builds the standalone admin (git-based CMS) output in dist-admin/ for the
 * admin.neurominds.in Cloudflare Pages project:
 *   admin/index.html + config.yml (+ _headers, robots.txt) + brand assets.
 * The same admin is also mirrored into dist/admin/ by the public build, so
 * either deployment layout works. No bundler needed — it is static.
 *
 * (The former Vite/Apps Script admin-ui is archived; build it with
 *  `npm run legacy:build:admin` if ever needed.)
 */
import { cpSync, existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'admin');
const out = resolve(root, 'dist-admin');

if (!existsSync(resolve(src, 'config.yml'))) { console.error('build-admin: admin/config.yml missing'); process.exit(1); }
const cfg = readFileSync(resolve(src, 'config.yml'), 'utf8');
if (/REPLACE_WITH/.test(cfg)) { console.error('build-admin: admin/config.yml still contains a REPLACE_WITH placeholder'); process.exit(1); }

if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(src, out, { recursive: true });
mkdirSync(resolve(out, 'assets'), { recursive: true });
cpSync(resolve(root, 'public-site/assets/brand'), resolve(out, 'assets/brand'), { recursive: true });
console.log('build-admin: dist-admin/ ready (index.html, config.yml, _headers, robots.txt, assets/brand)');
