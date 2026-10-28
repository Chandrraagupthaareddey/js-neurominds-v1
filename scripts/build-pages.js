/**
 * JS Neurominds V1 — scripts/build-pages.js
 * Pre-renders one real HTML page per content entry (replaces the old thin
 * "SEO stubs"): /conditions/<slug>, /treatments/<slug>, /doctors/<slug>,
 * /knowledge/<slug> (+ /lab/<slug> when Lab is enabled). Each page is a copy
 * of the matching detail template (condition.html, …) with:
 *   - full content already in the HTML (title, description, canonical, OG,
 *     JSON-LD, breadcrumbs, the article itself)  → fast + indexable
 *   - <body data-slug data-kind> so the shared JS wires behaviour without
 *     re-rendering (no flicker)
 * The generated folders are gitignored and rebuilt on every deploy, so a CMS
 * commit → Cloudflare build → fresh pages, with no runtime API.
 *
 * Also writes sitemap.xml (clean URLs, lastmod from git) and robots.txt.
 * Runs before `vite build` (the generated files become Vite inputs).
 */
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { CONDITIONS, TREATMENTS, DOCTORS, LAB_PACKAGES, BLOGS, FEATURE_FLAGS, PAGES, SEO } from '../shared/content.js';
import { published, yes, faqList, esc } from '../shared/content-normalize.js';
import { renderDetail, ROUTES } from '../shared/render.js';
import { applyHead, breadcrumbJsonLd, faqJsonLd, DOMAIN } from './lib/html-transform.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = resolve(root, 'public-site');

// kind → { template, dir (URL + folder), list page, label, content rows, priority }
const KINDS = [
  { kind: 'condition', template: 'condition.html', dir: 'conditions', listRoute: ROUTES.conditions, label: 'Conditions', rows: () => published(CONDITIONS), priority: '0.8', contentDir: 'conditions' },
  { kind: 'treatment', template: 'treatment.html', dir: 'treatments', listRoute: ROUTES.treatments, label: 'Treatments', rows: () => published(TREATMENTS), priority: '0.8', contentDir: 'treatments' },
  { kind: 'doctor', template: 'doctor.html', dir: 'doctors', listRoute: ROUTES.doctors, label: 'Doctors', rows: () => published(DOCTORS), priority: '0.7', contentDir: 'doctors' },
  { kind: 'blog', template: 'knowledge-detail.html', dir: 'knowledge', listRoute: ROUTES.knowledge, label: 'Knowledge', rows: () => published(BLOGS), priority: '0.6', contentDir: 'blogs', enabled: () => FEATURE_FLAGS.public_knowledge_enabled !== false }
];
export const GENERATED_DIRS = KINDS.map((k) => k.dir).concat(['lab']);

const nameOf = (d) => d.name || d.full_name || d.title || '';
const titleOf = (d) => d.seo_title || `${nameOf(d)} | JS Neurominds, Tirupati`;
const descOf = (d) => d.seo_description || d.one_line_summary || d.excerpt || d.short_bio || d.summary || '';

function lastmodFor(relPath) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${relPath}"`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (out) return out.slice(0, 10);
  } catch (e) { /* no git at build (e.g. tarball) */ }
  try { return statSync(resolve(root, relPath)).mtime.toISOString().slice(0, 10); } catch (e) { return new Date().toISOString().slice(0, 10); }
}

function jsonLdFor(def, d, url) {
  const base = { '@context': 'https://schema.org', url, publisher: { '@id': DOMAIN + '/#clinic' } };
  if (def.kind === 'doctor') {
    return { ...base, '@type': 'Physician', name: d.full_name, description: d.short_bio, medicalSpecialty: 'Psychiatric',
      image: d.photo_url ? DOMAIN + d.photo_url : undefined, knowsLanguage: d.languages, worksFor: { '@id': DOMAIN + '/#clinic' } };
  }
  if (def.kind === 'blog') {
    return { ...base, '@type': 'Article', headline: d.title, description: d.excerpt, author: { '@type': 'Organization', name: d.author || 'JS Neurominds' },
      datePublished: d.published_at || undefined, dateModified: d.updated_at || d.published_at || undefined, mainEntityOfPage: url };
  }
  return { ...base, '@type': 'MedicalWebPage', name: titleOf(d), description: descOf(d),
    about: { '@type': def.kind === 'condition' ? 'MedicalCondition' : 'MedicalTherapy', name: d.name },
    lastReviewed: undefined, reviewedBy: { '@id': DOMAIN + '/#clinic' } };
}

function renderPage(template, def, d) {
  const path = `/${def.dir}/${d.slug}`;
  const url = DOMAIN + path;
  let html = template;
  // Body carries slug/kind for the shared JS; mount is pre-filled.
  html = html.replace(/<body([^>]*)>/i, `<body$1 data-slug="${esc(d.slug)}" data-kind="${def.kind}">`);
  html = html.replace(/<(div|section)([^>]*\sid="detail-wrap"[^>]*)>\s*<\/\1>/,
    (m, tag, attrs) => `<${tag}${attrs} data-prerendered="1">${renderDetail(def.kind, d, FEATURE_FLAGS)}</${tag}>`);
  const ld = [
    JSON.parse(JSON.stringify(jsonLdFor(def, d, url))),
    breadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: def.label, url: def.listRoute }, { name: nameOf(d), url: path }]),
    faqJsonLd(faqList(d.faqs))
  ];
  html = applyHead(html, { title: titleOf(d), description: descOf(d), canonicalPath: path, type: def.kind === 'blog' ? 'article' : 'website', jsonLd: ld });
  // Clean internal links in the template.
  html = html.replace(/href="\/index\.html(#[^"]*)?"/g, 'href="/$1"').replace(/href="\/([a-z0-9-]+)\.html(#[^"]*)?"/g, 'href="/$1$2"');
  return html;
}

export function buildPages() {
  const urls = []; // { loc, lastmod, priority }
  let total = 0;

  // Static pages first.
  const staticPages = [
    ['/', 'index.html', '1.0'], [ROUTES.about, 'about.html', '0.7'], [ROUTES.doctors, 'doctors.html', '0.8'],
    [ROUTES.conditions, 'conditions.html', '0.9'], [ROUTES.treatments, 'treatments.html', '0.8'], [ROUTES.services, 'services.html', '0.8'],
    [ROUTES.booking, 'booking.html', '0.9'], [ROUTES.testimonials, 'testimonials.html', '0.6'], [ROUTES.faq, 'faq.html', '0.6'],
    [ROUTES.contact, 'contact.html', '0.7'], [ROUTES.emergency, 'emergency.html', '0.5'],
    [ROUTES.privacy, 'privacy.html', '0.2'], [ROUTES.terms, 'terms.html', '0.2'], [ROUTES.disclaimer, 'medical-disclaimer.html', '0.2']
  ];
  if (yes(FEATURE_FLAGS.public_lab_tests_enabled)) staticPages.push([ROUTES.lab, 'lab.html', '0.7']);
  if (FEATURE_FLAGS.public_knowledge_enabled !== false) staticPages.push([ROUTES.knowledge, 'knowledge.html', '0.6']);
  if (FEATURE_FLAGS.public_testimonials_enabled === false) staticPages.splice(staticPages.findIndex((p) => p[1] === 'testimonials.html'), 1);
  for (const [loc, file, priority] of staticPages) {
    const pageId = file === 'index.html' ? 'home' : file.replace('.html', '');
    const copyFile = `content/pages/${pageId}.json`;
    urls.push({ loc: DOMAIN + loc, lastmod: lastmodFor(existsSync(resolve(root, copyFile)) ? copyFile : `public-site/${file}`), priority });
  }

  for (const def of KINDS) {
    const outDir = resolve(site, def.dir);
    if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
    if (def.enabled && !def.enabled()) { console.log(`  ${def.dir}: skipped (disabled by feature flag)`); continue; }
    const template = readFileSync(resolve(site, def.template), 'utf8');
    const rows = def.rows();
    if (!rows.length) continue;
    mkdirSync(outDir, { recursive: true });
    for (const d of rows) {
      if (!d.slug) continue;
      writeFileSync(resolve(outDir, `${d.slug}.html`), renderPage(template, def, d));
      urls.push({ loc: `${DOMAIN}/${def.dir}/${d.slug}`, lastmod: lastmodFor(`content/${def.contentDir}/${d.slug}.json`), priority: def.priority });
      total++;
    }
    console.log(`  ${def.dir}: ${rows.length} page(s)`);
  }
  // Lab packages have no detail template yet; the lab list page covers them.
  const labDir = resolve(site, 'lab');
  if (existsSync(labDir)) rmSync(labDir, { recursive: true, force: true });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
  writeFileSync(resolve(site, 'sitemap.xml'), sitemap);

  const robots = `# ${SEO.site_name || 'JS Neurominds'} — robots.txt (generated by scripts/build-pages.js)
User-agent: *
Allow: /
# Legacy query-string detail shells; the pre-rendered pages are canonical.
Disallow: /condition?
Disallow: /treatment?
Disallow: /doctor?
Disallow: /knowledge-detail?
Disallow: /condition.html
Disallow: /treatment.html
Disallow: /doctor.html
Disallow: /knowledge-detail.html
Disallow: /admin/

Sitemap: ${DOMAIN}/sitemap.xml
`;
  writeFileSync(resolve(site, 'robots.txt'), robots);

  console.log(`Pre-rendered ${total} detail page(s); sitemap has ${urls.length} URL(s); robots.txt written.`);
  return { total, urls: urls.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log('Building pre-rendered pages…');
  try { buildPages(); } catch (e) { console.error('build-pages failed:', e.stack || e.message); process.exit(1); }
}
