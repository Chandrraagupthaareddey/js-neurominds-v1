/**
 * JS Neurominds V1 — scripts/lib/html-transform.js
 * Build-time HTML transforms shared by the Vite plugin (top-level pages) and
 * scripts/build-pages.js (pre-rendered detail pages). Pure string functions —
 * no DOM library needed, keeping the toolchain dependency-free.
 *
 *  - fillCopy():        <el data-copy="key">fallback</el> ← content/pages/<page>.json
 *  - prerenderMounts(): fills #home-conditions, #list-wrap, #faq-wrap, … with the
 *                       same markup the browser would render (shared/render.js)
 *  - applyHead():       title / description / canonical / Open Graph / Twitter /
 *                       JSON-LD, all from content, all clean URLs
 */
import {
  CLINIC_CONFIG, DOCTORS, CONDITIONS, TREATMENTS, SERVICES, LAB_PACKAGES, BLOGS, FAQS,
  TESTIMONIALS, GOOGLE_REVIEWS, FEATURE_FLAGS, SEO, PAGES
} from '../../shared/content.js';
import { yes, published, approved, byOrder, esc } from '../../shared/content-normalize.js';
import {
  conditionCard, serviceCard, doctorHighlight, renderList, testimonialCards,
  googleReviewsBlock, faqListHtml, ROUTES, COPY_LISTS
} from '../../shared/render.js';
import { shellHtml } from '../../shared/shell.js';
import { CLINIC_CONFIG as CLINIC, NAVIGATION, SOCIAL_LINKS, FLOATING_CTA } from '../../shared/content.js';
import { enabledSorted, byOrder as sortBy } from '../../shared/content-normalize.js';

export const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;450;500;600;700&display=swap';
export const DOMAIN = (CLINIC_CONFIG.domain || 'https://neurominds.in').replace(/\/$/, '');

/* ---------------- data-copy ---------------- */
/**
 * Replace the inner HTML of the element whose opening tag matches `openRe`
 * (a RegExp with the `g` flag that captures [1]=tag name, [2]=attributes).
 * Walks forward counting nested same-name tags so a <div> containing <div>s
 * is replaced as a whole (a non-greedy regex would stop at the first child).
 */
export function replaceElementInner(html, openRe, replacer) {
  let out = '';
  let last = 0;
  let m;
  openRe.lastIndex = 0;
  while ((m = openRe.exec(html))) {
    const tag = m[1];
    const openEnd = m.index + m[0].length;
    const tokRe = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    tokRe.lastIndex = openEnd;
    let depth = 1; let t; let closeStart = -1; let closeEnd = -1;
    while ((t = tokRe.exec(html))) {
      if (t[1] === '/') { depth--; if (depth === 0) { closeStart = t.index; closeEnd = t.index + t[0].length; break; } }
      else if (!/\/>$/.test(t[0])) depth++;
    }
    if (closeStart === -1) break; // malformed; leave untouched
    const inner = html.slice(openEnd, closeStart);
    const r = replacer({ tag, attrs: m[2], inner, match: m });
    if (r == null) continue;
    out += html.slice(last, m.index) + r;
    last = closeEnd;
    openRe.lastIndex = closeEnd;
  }
  return out + html.slice(last);
}

export function fillCopy(html, copy) {
  if (!copy) return html;
  // List-type copy (trust strip, assurance strip, steps): replace the element's children.
  for (const [id, [key, render]] of Object.entries(COPY_LISTS)) {
    if (!Array.isArray(copy[key]) || !copy[key].length) continue;
    html = replaceElementInner(html, new RegExp(`<(div|ul)([^>]*\\sid="${id}"[^>]*)>`, 'g'),
      ({ tag, attrs }) => `<${tag}${attrs.replace(/\sdata-copy-applied="1"/, '')} data-copy-applied="1">${render(copy[key])}</${tag}>`);
  }
  // Text copy: <el data-copy="key">fallback</el>
  return replaceElementInner(html, /<([a-zA-Z][\w-]*)((?:[^>]*?)\sdata-copy="[^"]+"[^>]*)>/g, ({ tag, attrs }) => {
    const key = (attrs.match(/\sdata-copy="([^"]+)"/) || [])[1];
    const v = copy[key];
    if (typeof v !== 'string' || !v) return null;
    return `<${tag}${attrs.replace(/\sdata-copy-applied="1"/, '')} data-copy-applied="1">${v}</${tag}>`;
  });
}

/* ---------------- mount pre-rendering ---------------- */
function replaceMount(html, id, inner, extraAttrs = '') {
  // Only replaces an EMPTY mount: <tag id="x" ...></tag>
  const re = new RegExp(`<(div|section|ul)([^>]*\\sid="${id}"[^>]*)>\\s*</\\1>`);
  return html.replace(re, (m, tag, attrs) => `<${tag}${attrs} data-prerendered="1"${extraAttrs}>${inner}</${tag}>`);
}

export function prerenderMounts(html, pageId) {
  const flags = FEATURE_FLAGS;
  const conditions = published(CONDITIONS);
  const services = published(SERVICES);
  const doctors = published(DOCTORS);

  if (pageId === 'home') {
    const featured = conditions.filter((c) => yes(c.is_featured));
    const show = (featured.length ? featured : conditions).slice(0, 6);
    html = replaceMount(html, 'home-conditions', show.map((c) => conditionCard(c)).join(''));
    html = replaceMount(html, 'home-services', services.map((s) => serviceCard(s)).join(''));
    if (doctors[0]) html = replaceMount(html, 'home-doctor', doctorHighlight(doctors[0]));
    // Lab section visibility is a flag, not JS.
    if (yes(flags.public_lab_tests_enabled)) html = html.replace(/(<section[^>]*id="home-lab-section"[^>]*)\shidden/, '$1');
  }

  const listKind = (html.match(/id="list-wrap"[^>]*data-list="([a-z]+)"/) || [])[1]
    || { treatments: 'treatments', services: 'services', doctors: 'doctors', knowledge: 'blog', lab: 'lab' }[pageId];
  if (listKind) {
    const rows = {
      conditions, treatments: published(TREATMENTS), services, doctors,
      lab: published(LAB_PACKAGES), blog: published(BLOGS)
    }[listKind] || [];
    html = replaceMount(html, 'list-wrap', renderList(listKind, rows));
  }

  if (pageId === 'conditions') {
    const all = conditions.slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
    html = replaceMount(html, 'conditions-hub', all.map((c) => conditionCard(c, { showCategory: true })).join(''));
  }

  if (pageId === 'faq') {
    html = replaceMount(html, 'faq-wrap', faqListHtml(published(FAQS)));
  }

  if (pageId === 'testimonials') {
    const rows = approved(TESTIMONIALS).slice().sort(byOrder('display_order'));
    html = replaceMount(html, 'testimonials-wrap', testimonialCards(rows));
    if (yes(flags.public_reviews_enabled)) {
      html = replaceMount(html, 'reviews-wrap', googleReviewsBlock({ summary: GOOGLE_REVIEWS.summary, reviews: GOOGLE_REVIEWS.reviews }));
    }
  }
  return html;
}

/* ---------------- <head> ---------------- */
function setTag(html, re, replacement, insertBeforeHeadClose) {
  if (re.test(html)) return html.replace(re, replacement);
  if (insertBeforeHeadClose) return html.replace(/<\/head>/i, `  ${replacement}\n</head>`);
  return html;
}

export function organizationJsonLd() {
  const cfg = CLINIC_CONFIG;
  const sameAs = (SEO.same_as || []).filter(Boolean);
  const ld = {
    '@context': 'https://schema.org',
    '@type': ['MedicalClinic', 'LocalBusiness'],
    '@id': DOMAIN + '/#clinic',
    name: cfg.clinic_name,
    url: DOMAIN + '/',
    logo: DOMAIN + (cfg.logo_url || '/assets/brand/logo.png'),
    image: DOMAIN + (cfg.social_preview_url || SEO.social_preview_url || '/assets/brand/social-preview.png'),
    telephone: cfg.cta_phone,
    email: cfg.email_support,
    address: { '@type': 'PostalAddress', streetAddress: cfg.address, addressLocality: 'Chandragiri', addressRegion: 'Andhra Pradesh', postalCode: '517101', addressCountry: 'IN' },
    medicalSpecialty: 'Psychiatric',
    priceRange: SEO.price_range || undefined,
    openingHours: SEO.opening_hours && SEO.opening_hours.length ? SEO.opening_hours : undefined,
    hasMap: cfg.maps_url,
    sameAs: sameAs.length ? sameAs : undefined
  };
  if (SEO.geo_latitude && SEO.geo_longitude) {
    ld.geo = { '@type': 'GeoCoordinates', latitude: Number(SEO.geo_latitude), longitude: Number(SEO.geo_longitude) };
  }
  const lead = published(DOCTORS)[0];
  if (lead) {
    ld.employee = { '@type': 'Physician', name: lead.full_name, medicalSpecialty: 'Psychiatric', url: DOMAIN + `/doctors/${lead.slug}` };
  }
  return JSON.parse(JSON.stringify(ld)); // drop undefined
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: DOMAIN + it.url }))
  };
}

export function faqJsonLd(faqs) {
  if (!faqs || !faqs.length) return null;
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } }))
  };
}

const ldScript = (obj) => obj ? `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>` : '';

/**
 * Apply head metadata. `meta` = { title, description, canonicalPath, type, jsonLd: [] }
 */
export function applyHead(html, meta) {
  const title = meta.title ? esc(meta.title) : null;
  const desc = meta.description ? esc(meta.description) : null;
  const canonical = meta.canonicalPath != null ? DOMAIN + meta.canonicalPath : null;
  const image = DOMAIN + (SEO.social_preview_url || '/assets/brand/social-preview.png');

  if (title) {
    html = setTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`, true);
    html = setTag(html, /<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`, true);
    html = setTag(html, /<meta name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}" />`, true);
  }
  if (desc) {
    html = setTag(html, /<meta name="description"[^>]*>/i, `<meta name="description" content="${desc}" />`, true);
    html = setTag(html, /<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${desc}" />`, true);
    html = setTag(html, /<meta name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${desc}" />`, true);
  }
  if (canonical) {
    html = setTag(html, /<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`, true);
    html = setTag(html, /<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`, true);
  }
  html = setTag(html, /<meta property="og:type"[^>]*>/i, `<meta property="og:type" content="${meta.type || 'website'}" />`, true);
  html = setTag(html, /<meta property="og:site_name"[^>]*>/i, `<meta property="og:site_name" content="${esc(SEO.site_name || CLINIC_CONFIG.clinic_name)}" />`, true);
  html = setTag(html, /<meta property="og:locale"[^>]*>/i, `<meta property="og:locale" content="en_IN" />`, true);
  html = setTag(html, /<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${image}" />`, true);
  html = setTag(html, /<meta name="twitter:card"[^>]*>/i, `<meta name="twitter:card" content="summary_large_image" />`, true);
  html = setTag(html, /<meta name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${image}" />`, true);
  // Fonts: one <link> in <head>, preloaded as a non-render-blocking stylesheet.
  if (!/fonts\.googleapis\.com\/css2/.test(html)) {
    html = html.replace(/<\/head>/i, `  <link rel="preload" as="style" href="${FONTS_URL}" />\n  <link rel="stylesheet" href="${FONTS_URL}" media="print" onload="this.media='all'" />\n  <noscript><link rel="stylesheet" href="${FONTS_URL}" /></noscript>\n</head>`);
  }
  if (!/<meta name="robots"/i.test(html)) {
    html = html.replace(/<\/head>/i, `  <meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />\n</head>`);
  }
  if (SEO.google_site_verification && !/google-site-verification/.test(html)) {
    html = html.replace(/<\/head>/i, `  <meta name="google-site-verification" content="${esc(SEO.google_site_verification)}" />\n</head>`);
  }
  if (SEO.bing_site_verification && !/msvalidate\.01/.test(html)) {
    html = html.replace(/<\/head>/i, `  <meta name="msvalidate.01" content="${esc(SEO.bing_site_verification)}" />\n</head>`);
  }
  // JSON-LD (remove any previous build-injected blocks first for idempotency).
  html = html.replace(/\s*<script type="application\/ld\+json" data-jsnm>[\s\S]*?<\/script>/g, '');
  const blocks = (meta.jsonLd || []).filter(Boolean).map((o) => ldScript(o).replace('<script type="application/ld+json">', '<script type="application/ld+json" data-jsnm>'));
  if (blocks.length) html = html.replace(/<\/head>/i, `  ${blocks.join('\n  ')}\n</head>`);
  return html;
}

/* ---------------- site shell (header / footer / floating buttons) ---------------- */
function visibleNav(flags) {
  return NAVIGATION.filter((n) => {
    if (n.route === '/lab' && !yes(flags.public_lab_tests_enabled)) return false;
    if (n.route === '/knowledge' && !yes(flags.public_knowledge_enabled)) return false;
    if (n.route === '/testimonials' && flags.public_testimonials_enabled === false) return false;
    if (n.is_enabled === false) return false;
    return true;
  }).slice().sort(sortBy('order'));
}

/** Pre-render emergency bar + header after <body>, footer + floating buttons before the first module script. */
export function injectShell(html, currentPath) {
  if (/class="site-header"/.test(html)) return html;
  const [top, bottom] = shellHtml({
    cfg: CLINIC, nav: visibleNav(FEATURE_FLAGS), social: enabledSorted(SOCIAL_LINKS, 'url'),
    flags: FEATURE_FLAGS, fabs: enabledSorted(FLOATING_CTA), currentPath: currentPath || '/'
  });
  html = html.replace(/(<body[^>]*>)/i, `$1\n${top}`);
  // Place footer/fabs after </main> (before any sticky bars/scripts) so the DOM order matches the JS fallback.
  if (/<\/main>/i.test(html)) html = html.replace(/<\/main>/i, `</main>\n${bottom}`);
  else html = html.replace(/<script type="module"/i, `${bottom}\n<script type="module"`);
  return html;
}

/* ---------------- top-level page pipeline (used by the Vite plugin) ---------------- */
const PAGE_PATH = {
  home: '/', about: ROUTES.about, booking: ROUTES.booking, contact: ROUTES.contact, emergency: ROUTES.emergency,
  conditions: ROUTES.conditions, treatments: ROUTES.treatments, services: ROUTES.services, doctors: ROUTES.doctors,
  knowledge: ROUTES.knowledge, faq: ROUTES.faq, lab: ROUTES.lab, testimonials: ROUTES.testimonials,
  privacy: ROUTES.privacy, terms: ROUTES.terms, 'medical-disclaimer': ROUTES.disclaimer,
  condition: '/condition', treatment: '/treatment', doctor: '/doctor', 'knowledge-detail': '/knowledge-detail', '404': null
};

export function pageIdFromFile(fileName) {
  const base = fileName.replace(/^.*[\\/]/, '').replace(/\.html$/, '');
  return base === 'index' ? 'home' : base;
}

export function transformTopLevelPage(html, pageId) {
  const copy = PAGES[pageId];
  html = fillCopy(html, copy);
  html = prerenderMounts(html, pageId);
  const path = PAGE_PATH[pageId];
  const legacyDetail = ['condition', 'treatment', 'doctor', 'knowledge-detail'].includes(pageId);
  const jsonLd = [];
  if (pageId === 'home') jsonLd.push(organizationJsonLd());
  else if (path && !legacyDetail) jsonLd.push(breadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: (copy && copy.title) || pageId, url: path }]));
  if (pageId === 'faq') jsonLd.push(faqJsonLd(published(FAQS)));
  html = applyHead(html, {
    title: copy && copy.seo_title,
    description: copy && copy.seo_description,
    canonicalPath: legacyDetail ? null : path,
    noindex: legacyDetail, // ?slug= shells: the pre-rendered /conditions/<slug> pages are canonical
    jsonLd
  });
  if (legacyDetail) html = html.replace(/\s*<link rel="canonical"[^>]*>/i, '').replace(/\s*<meta property="og:url"[^>]*>/i, '');
  html = injectShell(html, path == null ? '' : path);
  // Clean internal links (/about.html -> /about, /index.html -> /).
  html = html.replace(/href="\/index\.html(#[^"]*)?"/g, 'href="/$1"').replace(/href="\/([a-z0-9-]+)\.html(#[^"]*)?"/g, 'href="/$1$2"');
  return html;
}
