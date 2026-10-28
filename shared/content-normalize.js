/**
 * JS Neurominds V1 — shared/content-normalize.js
 * Tolerant readers for CMS-edited content. Content JSON historically used
 * Sheets-style encodings ("YES"/"NO", "a;b;c", "q|a||q|a"). The git CMS writes
 * proper JSON types (booleans, arrays, objects). These helpers accept BOTH so
 * the site never breaks whichever form a file is in. Pure functions, no DOM —
 * shared by the browser bundle, the build scripts and the tests.
 */

/** true for true / "YES" / "yes" / "true" / 1. */
export function yes(v) {
  if (v === true || v === 1) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'yes' || s === 'true' || s === '1' || s === 'y';
  }
  return false;
}

/** Array from an array, or a ";"-separated string. Trims, drops empties. */
export function list(v, sep = ';') {
  if (Array.isArray(v)) return v.map((x) => String(x == null ? '' : x).trim()).filter(Boolean);
  if (v == null || v === '') return [];
  return String(v).split(sep).map((s) => s.trim()).filter(Boolean);
}

/**
 * FAQ list [{ question, answer }] from an array of objects (CMS) or the legacy
 * "question|answer||question|answer" string.
 */
export function faqList(v) {
  if (Array.isArray(v)) {
    return v.map((f) => ({
      question: String((f && (f.question ?? f.q)) || '').trim(),
      answer: String((f && (f.answer ?? f.a)) || '').trim()
    })).filter((f) => f.question && f.answer);
  }
  if (!v) return [];
  return String(v).split('||').map((pair) => {
    const idx = pair.indexOf('|');
    if (idx === -1) return null;
    const question = pair.slice(0, idx).trim();
    const answer = pair.slice(idx + 1).trim();
    return question && answer ? { question, answer } : null;
  }).filter(Boolean);
}

/** Number or fallback. */
export function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Sort by a numeric order key (stable, missing → end). */
export function byOrder(key) {
  return (a, b) => num(a && a[key], 1e9) - num(b && b[key], 1e9);
}

/** Published rows only (missing status counts as published). */
export function published(rows) {
  return (rows || []).filter((r) => !r.status || r.status === 'published');
}

/** Approved rows only (testimonials / reviews). */
export function approved(rows) {
  return (rows || []).filter((r) => r.status === 'approved');
}

/** Enabled rows (is_enabled true/"YES") with a non-empty url/value, sorted by display_order. */
export function enabledSorted(rows, requireKey) {
  return (rows || [])
    .filter((r) => yes(r.is_enabled) && (!requireKey || (r[requireKey] && String(r[requireKey]).trim())))
    .slice()
    .sort(byOrder('display_order'));
}

/** Minimal HTML escaping for text nodes/attributes. */
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Slugify a label for URLs. */
export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
