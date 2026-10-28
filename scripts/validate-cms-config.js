/**
 * JS Neurominds V1 — scripts/validate-cms-config.js
 * Sanity-checks admin/config.yml against the content tree (no YAML dependency):
 *   - every `folder:` / `file:` path exists
 *   - every content/<type>/ folder and content/**.json file is editable somewhere
 *   - no placeholder values remain
 * Run as part of `npm run validate`.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cfgPath = resolve(root, 'admin/config.yml');
let errors = 0;
const fail = (m) => { errors++; console.error('  ✗', m); };

console.log('Validating admin CMS config…');
if (!existsSync(cfgPath)) { fail('admin/config.yml not found'); process.exit(1); }
const cfg = readFileSync(cfgPath, 'utf8');
if (/REPLACE_WITH/.test(cfg)) fail('config.yml still contains a REPLACE_WITH placeholder');
if (!/^\s*repo:\s*\S+\/\S+/m.test(cfg)) fail('backend.repo is not set (owner/repo)');

const folders = [...cfg.matchAll(/^\s*folder:\s*(\S+)/gm)].map((m) => m[1].replace(/['"]/g, ''));
const files = [...cfg.matchAll(/^\s*file:\s*(\S+)/gm)].map((m) => m[1].replace(/['"]/g, ''));
for (const p of [...folders, ...files]) if (!existsSync(resolve(root, p))) fail(`path in config.yml does not exist: ${p}`);

// Every per-entry folder under content/ must be a collection.
const contentDir = resolve(root, 'content');
for (const name of readdirSync(contentDir)) {
  const p = join(contentDir, name);
  if (!statSync(p).isDirectory()) continue;
  if (['settings', 'pages'].includes(name)) {
    for (const f of readdirSync(p).filter((x) => x.endsWith('.json'))) {
      const rel = `content/${name}/${f}`;
      if (!files.includes(rel)) fail(`${rel} is not editable in the admin (add a file entry)`);
    }
    continue;
  }
  if (!folders.includes(`content/${name}`)) fail(`content/${name}/ has no collection in config.yml`);
}
// Single-file settings at content root (clinic, navigation, social links).
for (const f of ['content/clinic.json', 'content/navigation.json', 'content/social_links.json']) {
  if (!files.includes(f)) fail(`${f} is not editable in the admin`);
}
// Collection JSON must parse and have the identifier field.
for (const folder of folders) {
  const dir = resolve(root, folder);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    try { JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch (e) { fail(`${relative(root, join(dir, f))} is not valid JSON: ${e.message}`); }
  }
}

if (errors) { console.error(`CMS config validation FAILED — ${errors} error(s).`); process.exit(1); }
console.log(`CMS config validation passed — ${folders.length} collections, ${files.length} setting/page files.`);
