/**
 * JS Neurominds V1 — scripts/vite-plugin-content.js
 * Vite plugin: bakes CMS content into the top-level HTML pages at build time
 * (and in the dev server), via scripts/lib/html-transform.js:
 *   - editable copy (data-copy) from content/pages/*.json
 *   - pre-rendered lists/cards/FAQs/testimonials
 *   - SEO head (title, description, canonical, OG, JSON-LD) from content
 *   - clean internal links
 * Pre-rendered detail pages (scripts/build-pages.js) are left untouched.
 */
import { transformTopLevelPage, pageIdFromFile } from './lib/html-transform.js';
import { PAGES } from '../shared/content.js';

const KNOWN = new Set([...Object.keys(PAGES), 'privacy', 'terms', 'medical-disclaimer', 'condition', 'treatment', 'doctor', 'knowledge-detail', '404']);

export default function jsnmContentPlugin() {
  return {
    name: 'jsnm-content',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const file = ctx.filename || ctx.path || '';
        // Only top-level pages (public-site/*.html). Generated detail pages live in sub-folders.
        const rel = file.replace(/\\/g, '/');
        const m = rel.match(/public-site\/([a-z0-9-]+)\.html$/) || (ctx.path && ctx.path.match(/^\/([a-z0-9-]*)\.html$/));
        if (!m) return html;
        const pageId = pageIdFromFile(m[1] || 'index');
        if (!KNOWN.has(pageId)) return html;
        return transformTopLevelPage(html, pageId);
      }
    }
  };
}
