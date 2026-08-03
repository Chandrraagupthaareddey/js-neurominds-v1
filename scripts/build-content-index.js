/**
 * JS Neurominds V1 — scripts/build-content-index.js
 * Recombines per-entry CMS files (content/<type>/*.json) back into the single
 * array files (content/<type>.json) that shared/mock-public-content.js imports.
 * Runs first in `validate` and `build` so the site always reflects the folders,
 * which the git-CMS edits. Folder is the source of truth; the array is derived.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = ['conditions', 'treatments', 'services', 'lab_packages', 'blogs', 'faqs', 'doctors', 'testimonials'];
const SORT = { faqs: 'order', testimonials: 'display_order' };

let total = 0;
for (const type of TYPES) {
  const dir = resolve(root, 'content', type);
  if (!existsSync(dir)) continue;
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const items = files.map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf8')));
  const key = SORT[type];
  if (key) items.sort((a, b) => (Number(a[key]) || 0) - (Number(b[key]) || 0));
  writeFileSync(resolve(root, 'content', type + '.json'), JSON.stringify(items, null, 2) + '\n');
  total += items.length;
}
console.log(`content index rebuilt — ${total} entries across ${TYPES.length} types`);
