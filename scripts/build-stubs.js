/**
 * JS Neurominds V1 — scripts/build-stubs.js
 * Compatibility wrapper. The thin "SEO stubs" (/p/<type>/<slug>.html, which
 * only linked to a JS-rendered page) have been superseded by full pre-rendered
 * pages at /conditions/<slug>, /treatments/<slug>, /doctors/<slug>,
 * /knowledge/<slug> — see scripts/build-pages.js. This file is kept so any
 * existing command, doc or CI step that calls `node scripts/build-stubs.js`
 * keeps working and produces the new pages.
 */
import { buildPages } from './build-pages.js';

if (process.env.STUBS_SOURCE === 'live') {
  console.warn('build-stubs: STUBS_SOURCE=live is no longer used — content is read from /content JSON (git CMS), not the Apps Script API.');
}
console.log('build-stubs → build-pages (pre-rendered pages)…');
buildPages();
