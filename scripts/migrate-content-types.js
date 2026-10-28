/**
 * JS Neurominds V1 — scripts/migrate-content-types.js
 * One-off (but idempotent) migration: converts Sheets-style encodings in the
 * per-entry content files to proper JSON types so the git CMS (Sveltia) can
 * edit them with real widgets:
 *   "YES"/"NO"             -> true/false
 *   "a;b;c"                -> ["a","b","c"]
 *   "q|a||q|a" (faqs)      -> [{ question, answer }]
 * The site reads both forms (shared/content-normalize.js), so running this is
 * safe at any time. Run: node scripts/migrate-content-types.js
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { yes, list, faqList } from '../shared/content-normalize.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const RULES = {
  conditions: { bool: ['is_emergency', 'is_featured'], list: ['symptoms', 'related_conditions'], faqs: ['faqs'] },
  treatments: { bool: [], list: ['conditions_treated'], faqs: [] },
  doctors: { bool: ['support_booking_enabled', 'direct_booking_enabled', 'online_consultation_enabled', 'clinic_visit_enabled'], list: ['conditions_handled'], faqs: [] },
  services: { bool: [], list: [], faqs: [] },
  lab_packages: { bool: [], list: [], faqs: [] },
  blogs: { bool: [], list: ['tags'], faqs: [] },
  faqs: { bool: [], list: [], faqs: [] },
  testimonials: { bool: [], list: [], faqs: [] }
};

const isYesNo = (v) => typeof v === 'string' && /^(yes|no|true|false|y|n)$/i.test(v.trim());

let changed = 0;
for (const [type, rule] of Object.entries(RULES)) {
  const dir = resolve(root, 'content', type);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const p = resolve(dir, f);
    const before = readFileSync(p, 'utf8');
    const row = JSON.parse(before);
    for (const k of rule.bool) if (k in row && isYesNo(row[k])) row[k] = yes(row[k]);
    for (const k of rule.list) if (k in row && typeof row[k] === 'string') row[k] = list(row[k]);
    for (const k of rule.faqs) if (k in row && typeof row[k] === 'string') row[k] = faqList(row[k]);
    const after = JSON.stringify(row, null, 2) + '\n';
    if (after !== before) { writeFileSync(p, after); changed++; }
  }
}

// Social links file (single array file).
const socialPath = resolve(root, 'content', 'social_links.json');
if (existsSync(socialPath)) {
  const before = readFileSync(socialPath, 'utf8');
  const rows = JSON.parse(before).map((r) => {
    for (const k of ['is_enabled', 'open_in_new_tab']) if (k in r && isYesNo(r[k])) r[k] = yes(r[k]);
    return r;
  });
  const after = JSON.stringify(rows, null, 2) + '\n';
  if (after !== before) { writeFileSync(socialPath, after); changed++; }
}

console.log(`migrate-content-types: ${changed} file(s) updated`);
