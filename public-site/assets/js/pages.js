/**
 * JS Neurominds V1 — public-site/assets/js/pages.js
 * Page hydration helpers. Each HTML page calls one function to fill its
 * data-driven sections. Markup comes from shared/render.js, the same module
 * the build uses to pre-render pages, so runtime and build output match.
 *
 * Pre-rendered sections carry data-prerendered="1": hydration then skips the
 * re-render (no flicker) and only wires behaviour + analytics.
 */
import { api, getSlugParam } from './api.js';
import { analytics } from './analytics.js';
import { esc, yes } from '../../../shared/content-normalize.js';
import {
  conditionCard, serviceCard, doctorHighlight, renderList, testimonialCards,
  googleReviewsBlock, faqListHtml, renderDetail, notFoundHtml, detailUrl, ROUTES, COPY_LISTS
} from '../../../shared/render.js';

const isPrerendered = (el) => !!(el && el.dataset && el.dataset.prerendered);

function skeletonCards(n, mount) {
  if (!mount || isPrerendered(mount)) return;
  mount.innerHTML = Array.from({ length: n }).map(() =>
    `<div class="card"><div class="skeleton skeleton--line w60"></div><div class="skeleton skeleton--line w80"></div><div class="skeleton skeleton--line w60"></div></div>`
  ).join('');
}

/* ---------------- SEO head helpers (runtime fallback for legacy ?slug= pages) ---------------- */
function setMeta(selector, attr, value) {
  if (!value) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    const m = selector.match(/\[(\w+(?::\w+)?)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function applySeo({ title, description, canonical }) {
  if (title) {
    document.title = title;
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[name="twitter:title"]', 'content', title);
  }
  if (description) {
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[name="twitter:description"]', 'content', description);
  }
  if (canonical) {
    setMeta('link[rel="canonical"]', 'href', canonical);
    setMeta('meta[property="og:url"]', 'content', canonical);
  }
}

/* ---------------- Home ---------------- */
export async function hydrateHome() {
  const condWrap = document.querySelector('#home-conditions');
  const svcWrap = document.querySelector('#home-services');
  const docWrap = document.querySelector('#home-doctor');
  skeletonCards(6, condWrap); skeletonCards(4, svcWrap);

  const [cond, docs, svcs] = await Promise.all([api.conditions(), api.doctors(), api.services()]);

  if (condWrap && !isPrerendered(condWrap)) {
    const featured = cond.data.filter((c) => yes(c.is_featured));
    const show = (featured.length ? featured : cond.data).slice(0, 6);
    condWrap.innerHTML = show.map((c) => conditionCard(c)).join('');
  }
  if (svcWrap && !isPrerendered(svcWrap)) {
    svcWrap.innerHTML = svcs.data.map((s) => serviceCard(s)).join('');
  }
  if (docWrap && !isPrerendered(docWrap) && docs.data[0]) {
    docWrap.innerHTML = doctorHighlight(docs.data[0]);
  }
}

/* ---------------- Lists ---------------- */
export async function hydrateList(kind) {
  const wrap = document.querySelector('#list-wrap');
  if (!wrap) return;
  const fns = {
    conditions: api.conditions, treatments: api.treatments, services: api.services,
    doctors: api.doctors, lab: api.labPackages, blog: api.blogs
  };
  if (!isPrerendered(wrap)) {
    skeletonCards(6, wrap);
    const res = await fns[kind]();
    wrap.innerHTML = renderList(kind, res.data || []);
  }
  if (kind === 'lab') analytics.labPageView();
}

/**
 * Full Conditions hub: shows ALL published conditions with search, category
 * filter, a live count, and a safe medical disclaimer. Home keeps featured-6.
 */
export async function hydrateConditionsHub() {
  const wrap = document.querySelector('#conditions-hub');
  if (!wrap) return;
  const toolbarHost = document.querySelector('#conditions-toolbar');
  skeletonCards(9, wrap);

  const res = await api.conditions();
  const all = (res.data || []).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const categories = ['All', ...Array.from(new Set(all.map((c) => c.category).filter(Boolean))).sort()];

  let term = '';
  let cat = 'All';

  if (toolbarHost) {
    toolbarHost.innerHTML = `
      <div class="hub-toolbar">
        <div class="hub-search"><input type="search" id="cond-search" placeholder="Search conditions…" aria-label="Search conditions" /></div>
        <span class="hub-count" id="cond-count" aria-live="polite"></span>
      </div>
      <div class="hub-toolbar" id="cond-cats" role="group" aria-label="Filter by category">
        ${categories.map((c) => `<button type="button" class="hub-filter ${c === 'All' ? 'active' : ''}" data-cat="${esc(c)}" aria-pressed="${c === 'All'}">${esc(c)}</button>`).join('')}
      </div>`;
  }

  const draw = () => {
    const rows = all.filter((c) => {
      if (cat !== 'All' && c.category !== cat) return false;
      if (term) {
        const hay = `${c.name} ${c.one_line_summary} ${c.category || ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    const countEl = document.querySelector('#cond-count');
    if (countEl) countEl.textContent = `${rows.length} of ${all.length} conditions`;
    if (!rows.length) {
      wrap.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🔍</div><p>No conditions match your search.</p></div>`;
      return;
    }
    wrap.innerHTML = rows.map((c) => conditionCard(c, { showCategory: true })).join('');
  };

  const searchEl = document.querySelector('#cond-search');
  if (searchEl) searchEl.addEventListener('input', (e) => { term = e.target.value.toLowerCase().trim(); draw(); });
  const catsEl = document.querySelector('#cond-cats');
  if (catsEl) catsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.hub-filter'); if (!btn) return;
    cat = btn.dataset.cat;
    catsEl.querySelectorAll('.hub-filter').forEach((b) => {
      const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    });
    draw();
  });
  // Pre-rendered grid is already the full list; only redraw when filtering.
  if (!isPrerendered(wrap)) draw();
  else { const countEl = document.querySelector('#cond-count'); if (countEl) countEl.textContent = `${all.length} of ${all.length} conditions`; }
}

/* ---------------- Trust modules: testimonials, reviews, map ---------------- */
export async function hydrateTestimonials(sel = '#testimonials-wrap', limit) {
  const wrap = document.querySelector(sel);
  if (!wrap || !api.testimonials) return;
  const res = await api.testimonials();
  let rows = res.data || [];
  if (limit) rows = rows.slice(0, limit);
  if (!rows.length) { if (!isPrerendered(wrap)) wrap.innerHTML = ''; return; }
  analytics.testimonialView(location.pathname.replace(/^\//, '').replace('.html', '') || 'home');
  if (!isPrerendered(wrap)) wrap.innerHTML = testimonialCards(rows);
}

export async function hydrateGoogleReviews(sel = '#reviews-wrap') {
  const host = document.querySelector(sel);
  if (!host || !api.googleReviews) return;
  if (!isPrerendered(host)) {
    const res = await api.googleReviews();
    host.innerHTML = googleReviewsBlock(res.data || {});
  }
  host.querySelectorAll('[data-review-link],[data-review-write]').forEach((a) =>
    a.addEventListener('click', () => analytics.googleReviewClick(a.dataset.reviewWrite !== undefined ? 'write' : 'view')));
}

export function hydrateMapCard(sel = '#map-card') {
  const host = document.querySelector(sel);
  if (!host) return;
  const cfg = (window.__JSNM__ && window.__JSNM__.cfg) || {};
  const embed = cfg.maps_embed_url
    ? `<iframe class="map-card__embed" src="${esc(cfg.maps_embed_url)}" title="Map to ${esc(cfg.clinic_name || 'clinic')}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen style="border:0;width:100%;min-height:260px;border-radius:var(--r-lg,16px)"></iframe>`
    : `<a href="${esc(cfg.maps_url || '#')}" target="_blank" rel="noopener" class="map-card__embed" style="display:grid;place-items:center;text-decoration:none;color:var(--ink-500)" data-map-link aria-label="Open ${esc(cfg.clinic_name || 'clinic')} on Google Maps">
        <span>🗺<br><span style="font-size:var(--fs-sm)">Open Google Maps</span></span>
      </a>`;
  host.innerHTML = `
    <div class="map-card">
      <div>
        <p class="eyebrow">Find us</p>
        <h3 style="margin-bottom:var(--sp-2)">${esc(cfg.clinic_name || 'JS Neurominds')}</h3>
        <p style="font-size:var(--fs-sm)">${esc(cfg.address || '')}</p>
        ${cfg.opening_hours_text ? `<p style="font-size:var(--fs-sm)"><strong>Hours:</strong> ${esc(cfg.opening_hours_text)}</p>` : ''}
        <div class="stack" style="margin-top:var(--sp-4)">
          <a class="btn btn--primary" href="${esc(cfg.maps_url || '#')}" target="_blank" rel="noopener" data-map-link>📍 Get directions</a>
          <a class="btn btn--ghost" href="${esc(cfg.call_link || '#')}">📞 Call the clinic</a>
        </div>
      </div>
      ${embed}
    </div>`;
  host.querySelectorAll('[data-map-link]').forEach((a) => a.addEventListener('click', () => analytics.mapClick('map_card')));
}

/* ---------------- Detail pages ---------------- */
export async function hydrateDetail(kind) {
  const slug = getSlugParam();
  const wrap = document.querySelector('#detail-wrap');
  if (!wrap) return;
  const pre = isPrerendered(wrap);
  if (!pre) {
    wrap.innerHTML = `<div class="skeleton skeleton--line w60" style="height:32px;margin-bottom:20px"></div><div class="skeleton skeleton--line w80"></div><div class="skeleton skeleton--line"></div><div class="skeleton skeleton--line w60"></div>`;
  }

  let res;
  if (kind === 'condition') { res = await api.condition(slug); analytics.conditionView(slug); }
  else if (kind === 'treatment') { res = await api.treatment(slug); analytics.treatmentView(slug); }
  else if (kind === 'doctor') { res = await api.doctor(slug); }
  else if (kind === 'blog') { res = await api.blog(slug); analytics.knowledgeView && analytics.knowledgeView(slug); }

  const d = res && res.data;
  if (!d) {
    if (!pre) wrap.innerHTML = notFoundHtml();
    applySeo({ title: 'Page not found | JS Neurominds' });
    return;
  }
  if (kind === 'doctor') analytics.doctorProfileView(d.doctor_id);

  if (!pre) {
    const flags = (window.__JSNM__ && window.__JSNM__.flags) || {};
    wrap.innerHTML = renderDetail(kind, d, flags);
    // Legacy ?slug= URL: point search engines at the pre-rendered canonical page.
    const base = (window.__JSNM__ && window.__JSNM__.cfg && window.__JSNM__.cfg.domain) || 'https://neurominds.in';
    applySeo({
      title: (d.seo_title || d.name || d.full_name || d.title || '') + (d.seo_title ? '' : ' | JS Neurominds'),
      description: d.seo_description || d.one_line_summary || d.excerpt || d.short_bio || '',
      canonical: base + detailUrl(kind, slug)
    });
  }
}

export async function hydrateFaq() {
  const wrap = document.querySelector('#faq-wrap');
  if (!wrap || isPrerendered(wrap)) return;
  const res = await api.faqs();
  wrap.innerHTML = faqListHtml(res.data || []);
}

/* ---------------- Editable page copy (data-copy) ---------------- */
/**
 * Fills elements marked data-copy="key" from /content/pages/<page>.json.
 * The build already does this server-side (vite plugin), so at runtime this
 * is only a safety net for the dev server / pages the build did not touch.
 */
export async function applyPageCopy(pageId) {
  const nodes = document.querySelectorAll('[data-copy]');
  const res = await api.page(pageId);
  const copy = res && res.data;
  if (!copy) return;
  nodes.forEach((el) => {
    if (el.dataset.copyApplied) return;
    const v = copy[el.dataset.copy];
    if (typeof v === 'string' && v) el.innerHTML = v;
  });
  Object.entries(COPY_LISTS).forEach(([id, [key, render]]) => {
    const host = document.getElementById(id);
    if (!host || host.dataset.copyApplied) return;
    if (Array.isArray(copy[key]) && copy[key].length) host.innerHTML = render(copy[key]);
  });
}

/** Back-compat alias (home lists are handled by applyPageCopy('home')). */
export async function applyHomeLists() { return Promise.resolve(); }

export { ROUTES, detailUrl };

document.addEventListener('toggle', (e) => {
  if (e.target.tagName === 'DETAILS' && e.target.open) {
    analytics.faqExpand(location.pathname.replace(/^\//, '').replace('.html', ''));
  }
}, true);
