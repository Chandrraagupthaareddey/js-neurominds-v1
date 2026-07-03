/**
 * JS Neurominds V1 — scripts/build-stubs.js
 * Generates lightweight, SEO-critical static stub pages and a sitemap.
 *
 * Source of content:
 *   - Local/mock (default): the shared mock content module.
 *   - Live: set STUBS_SOURCE=live and PUBLIC_API_URL=<gas /exec> to fetch
 *     approved content from the GAS Public API (used at Cloudflare build time).
 *
 * Stubs are written to public-site/p/<dir>/<slug>.html and are NOT committed
 * (see .gitignore). Each stub includes title, meta description, canonical,
 * Open Graph, Twitter card, JSON-LD, breadcrumb, a first answer paragraph, and
 * references the shared CSS — no inline content duplication.
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { STUB_TYPES } from '../shared/route-map.js';
import { CLINIC } from '../shared/constants.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outBase = resolve(root, 'public-site', 'p');
const DOMAIN = CLINIC.domain;
const SOURCE = process.env.STUBS_SOURCE || 'mock';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function loadContent() {
  if (SOURCE === 'live') {
    const base = process.env.PUBLIC_API_URL;
    if (!base) throw new Error('STUBS_SOURCE=live requires PUBLIC_API_URL');
    const get = async (action) => {
      const u = new URL(base); u.searchParams.set('action', action);
      const r = await fetch(u); const j = await r.json(); return j.data || [];
    };
    let flags = {};
    try { const fr = await fetch(new URL(base + '?action=featureFlags')); const fj = await fr.json(); flags = fj.data || {}; } catch (e) { flags = {}; }
    return {
      conditions: await get('conditions'), treatments: await get('treatments'),
      doctors: await get('doctors'), labPackages: await get('labPackages'), blogs: await get('blogs'), _flags: flags
    };
  }
  const m = await import('../shared/mock-public-content.js');
  return {
    conditions: m.CONDITIONS, treatments: m.TREATMENTS, doctors: m.DOCTORS,
    labPackages: m.LAB_PACKAGES, blogs: m.BLOGS, _flags: m.FEATURE_FLAGS || {}
  };
}

function titleOf(item) { return item.seo_title || item.name || item.full_name || item.title; }
function descOf(item) { return item.seo_description || item.one_line_summary || item.summary || item.excerpt || ''; }
function firstPara(item) { return item.one_line_summary || item.overview || item.short_bio || item.summary || item.excerpt || ''; }

function jsonLd(type, item, canonical) {
  const base = { '@context': 'https://schema.org' };
  if (type === 'doctor') {
    return { ...base, '@type': 'Physician', name: item.full_name, medicalSpecialty: 'Psychiatry',
      url: canonical, address: CLINIC.address };
  }
  if (type === 'blog' || type === 'knowledge') {
    return { ...base, '@type': 'Article', headline: item.title, author: { '@type': 'Organization', name: CLINIC.clinic_name }, url: canonical };
  }
  if (type === 'condition' || type === 'treatment') {
    return { ...base, '@type': 'MedicalWebPage', name: titleOf(item), description: descOf(item), url: canonical,
      about: { '@type': 'MedicalCondition', name: item.name } };
  }
  return { ...base, '@type': 'WebPage', name: titleOf(item), url: canonical };
}

function stubHtml(def, item) {
  const type = def.type;
  const detailFile = def.detail;
  const canonical = `${DOMAIN}/p/${type}/${item.slug}.html`;
  const detailUrl = `/${detailFile}.html?slug=${item.slug}`;
  const title = esc(titleOf(item));
  const desc = esc(descOf(item));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:url" content="${canonical}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="stylesheet" href="/assets/css/main.css" />
  <link rel="stylesheet" href="/assets/css/components.css" />
  <script type="application/ld+json">${JSON.stringify(jsonLd(type, item, canonical))}</script>
</head>
<body>
  <main id="main" class="section">
    <div class="container" style="max-width:760px">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a> / <a href="/${def.listFile}.html">${esc(def.label)}</a> / ${esc(item.name || item.full_name || item.title)}
      </nav>
      <h1>${esc(item.name || item.full_name || item.title)}</h1>
      <p class="lede">${esc(firstPara(item))}</p>
      <p><a class="btn btn--primary" href="${detailUrl}">Read more &amp; request a call back</a></p>
      <noscript><p>For the full experience, please enable JavaScript.</p></noscript>
    </div>
  </main>
</body>
</html>`;
}

const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

async function main() {
  console.log(`Building SEO stubs (source=${SOURCE})…`);
  const content = await loadContent();

  if (existsSync(outBase)) rmSync(outBase, { recursive: true, force: true });
  mkdirSync(outBase, { recursive: true });

  const sitemapUrls = [];
  let total = 0;

  const flags = content._flags || {};
  const labEnabled = flags.public_lab_tests_enabled === true;
  const knowledgeEnabled = flags.public_knowledge_enabled !== false;

  for (const def of STUB_TYPES) {
    // Respect feature flags: no Lab stubs when Lab is hidden; no Knowledge stubs when disabled.
    if (def.type === 'lab_package' && !labEnabled) { console.log('  lab_package: skipped (public_lab_tests_enabled=false)'); continue; }
    if (def.type === 'knowledge' && !knowledgeEnabled) { console.log('  knowledge: skipped (disabled)'); continue; }
    const rows = (content[def.api] || []).filter((r) => !r.status || r.status === 'published');
    if (!rows.length) continue;
    const dir = resolve(outBase, def.type);
    mkdirSync(dir, { recursive: true });
    for (const item of rows) {
      writeFileSync(resolve(dir, `${item.slug}.html`), stubHtml(def, item));
      sitemapUrls.push({ loc: `${DOMAIN}/p/${def.type}/${item.slug}.html`, priority: def.priority });
      total++;
    }
    console.log(`  ${def.type}: ${rows.length} stub(s)`);
  }

  // Sitemap (static pages + stubs). Lab/Knowledge static URLs respect flags.
  const staticPages = ['', 'about', 'doctors', 'conditions', 'treatments', 'services', 'testimonials', 'faq', 'contact'];
  if (labEnabled) staticPages.splice(6, 0, 'lab');
  if (knowledgeEnabled) staticPages.push('knowledge');
  const staticUrls = staticPages
    .map((p) => ({ loc: `${DOMAIN}/${p ? p + '.html' : ''}`, priority: p ? 0.6 : 1.0 }));
  const all = [...staticUrls, ...sitemapUrls];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map((u) => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
  writeFileSync(resolve(root, 'public-site', 'sitemap.xml'), sitemap);

  console.log(`Generated ${total} stub(s) + sitemap with ${all.length} URLs.`);
}

main().catch((e) => { console.error('build-stubs failed:', e.message); process.exit(1); });
