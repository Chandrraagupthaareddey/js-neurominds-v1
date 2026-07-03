/**
 * JS Neurominds V1 — public-site/assets/js/pages.js
 * Page hydration helpers. Each HTML page calls one function to fill its
 * data-driven sections from the API. Includes skeleton loading states and
 * premium card markup. Keeps individual HTML files minimal.
 */
import { api, getSlugParam } from './api.js';
import { analytics } from './analytics.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const ICONS = {
  depression: '🌧', anxiety: '🌀', 'sleep-problems': '🌙', addiction: '🔗',
  'child-teen-concerns': '🧸', 'self-harm-thoughts': '🤍',
  'psychiatry-consultation': '🩺', 'online-consultation': '💻',
  'general-medicine-walkin': '🚶', 'first-aid-support': '➕',
  'counselling-psychotherapy': '💬', 'medication-management': '💊', 'de-addiction-support': '🔗'
};
const iconFor = (slug, fallback) => ICONS[slug] || fallback || '🩺';

function skeletonCards(n, mount) {
  if (!mount) return;
  mount.innerHTML = Array.from({ length: n }).map(() =>
    `<div class="card"><div class="skeleton skeleton--line w60"></div><div class="skeleton skeleton--line w80"></div><div class="skeleton skeleton--line w60"></div></div>`
  ).join('');
}

function ctaPair() {
  return `
    <div class="hero__cta" style="margin-top:var(--sp-6)">
      <a class="btn btn--primary" href="/booking.html">Request Clinic Callback</a>
      <a class="btn btn--ghost" href="/booking.html#confirmed">Book confirmed appointment</a>
    </div>`;
}

export async function hydrateHome() {
  const condWrap = document.querySelector('#home-conditions');
  const svcWrap = document.querySelector('#home-services');
  skeletonCards(6, condWrap); skeletonCards(4, svcWrap);

  const [cond, docs, svcs] = await Promise.all([api.conditions(), api.doctors(), api.services()]);

  if (condWrap) {
    const featured = cond.data.filter((c) => c.is_featured === 'YES');
    const show = (featured.length ? featured : cond.data).slice(0, 6);
    condWrap.innerHTML = show.map((c) => `
      <a class="card card--link" href="/condition.html?slug=${esc(c.slug)}">
        <div class="card__icon">${iconFor(c.slug)}</div>
        <h3>${esc(c.name)}</h3>
        <p>${esc(c.one_line_summary)}</p>
        <span class="card__link">Learn more</span>
      </a>`).join('');
  }
  if (svcWrap) {
    svcWrap.innerHTML = svcs.data.map((s) => `
      <div class="card">
        <div class="card__icon">${iconFor(s.slug)}</div>
        <h3 style="font-size:var(--fs-md)">${esc(s.name)}</h3>
        <p>${esc(s.summary)}</p>
      </div>`).join('');
  }
  const docWrap = document.querySelector('#home-doctor');
  if (docWrap && docs.data[0]) {
    const d = docs.data[0];
    docWrap.innerHTML = `
      <div class="card doctor-card">
        ${doctorAvatar(d)}
        <div>
          <h3 style="margin-bottom:var(--sp-2)">${esc(d.full_name)}</h3>
          <div class="chip-row">
            <span class="tag">${esc(d.qualification)}</span>
            <span class="chip">${esc(d.experience_years)} years</span>
            <span class="chip">${esc(d.languages)}</span>
          </div>
          <p style="margin-top:var(--sp-3)">${esc(d.short_bio)}</p>
          <a class="btn btn--ghost" href="/doctor.html?slug=${esc(d.slug)}">View full profile</a>
        </div>
      </div>`;
  }
}

export async function hydrateList(kind) {
  const wrap = document.querySelector('#list-wrap');
  if (!wrap) return;
  skeletonCards(6, wrap);
  const map = {
    conditions: { fn: api.conditions, href: 'condition', title: 'name', sub: 'one_line_summary' },
    treatments: { fn: api.treatments, href: 'treatment', title: 'name', sub: 'one_line_summary' },
    services:   { fn: api.services, href: '', title: 'name', sub: 'summary' },
    doctors:    { fn: api.doctors, href: 'doctor', title: 'full_name', sub: 'specialization' },
    lab:        { fn: api.labPackages, href: '', title: 'name', sub: 'summary' },
    blog:       { fn: api.blogs, href: 'knowledge-detail', title: 'title', sub: 'excerpt' }
  };
  const cfg = map[kind];
  const res = await cfg.fn();
  if (!res.data || !res.data.length) {
    wrap.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">📭</div><p>Nothing here yet. Please check back soon.</p></div>`;
    return;
  }
  wrap.innerHTML = res.data.map((item) => {
    // Doctors get a richer, dedicated card (photo, credentials, modes, CTA).
    if (kind === 'doctors') {
      const photo = (item.photo_url || item.profile_photo_link)
        ? `<img class="doctor-card__photo" src="${esc(item.photo_url || item.profile_photo_link)}" alt="${esc(item.full_name)}" width="96" height="96" loading="lazy" decoding="async" />`
        : `<div class="card__icon">${esc(initials(item.full_name))}</div>`;
      const modes = [];
      if (String(item.online_consultation_enabled).toUpperCase() === 'YES') modes.push('Online');
      if (String(item.clinic_visit_enabled).toUpperCase() === 'YES') modes.push('In-clinic');
      const modeChips = modes.map((m) => `<span class="chip">${m}</span>`).join('');
      return `
        <div class="card doctor-card doctor-card--list">
          ${photo}
          <div class="doctor-card__body">
            <h3>${esc(item.full_name)}</h3>
            ${item.qualification ? `<p class="doctor-card__qual">${esc(item.qualification)}</p>` : ''}
            <p class="doctor-card__spec">${esc(item.specialization || item.short_bio || '')}</p>
            <div class="chip-row">
              ${item.experience_years ? `<span class="chip">${esc(item.experience_years)} yrs</span>` : ''}
              ${item.languages ? `<span class="chip">${esc(item.languages)}</span>` : ''}
              ${modeChips}
            </div>
            <a class="btn btn--ghost btn--sm" href="/doctor.html?slug=${esc(item.slug)}">View full profile</a>
          </div>
        </div>`;
    }
    const icon = iconFor(item.slug, kind === 'lab' ? '🧪' : '📄');
    const extra = kind === 'lab' && item.turnaround ? `<span class="chip">${esc(item.turnaround)}</span>` : '';
    const inner = `
      <div class="card__icon">${icon}</div>
      <h3>${esc(item[cfg.title])}</h3>
      <p>${esc(item[cfg.sub])}</p>
      ${extra ? `<div class="chip-row">${extra}</div>` : ''}
      ${cfg.href ? `<span class="card__link">View</span>` : ''}`;
    return cfg.href
      ? `<a class="card card--link" href="/${cfg.href}.html?slug=${esc(item.slug)}">${inner}</a>`
      : `<div class="card">${inner}</div>`;
  }).join('');
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
        <span class="hub-count" id="cond-count"></span>
      </div>
      <div class="hub-toolbar" id="cond-cats">
        ${categories.map((c) => `<button class="hub-filter ${c === 'All' ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
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
    wrap.innerHTML = rows.map((c) => `
      <a class="card card--link" href="/condition.html?slug=${esc(c.slug)}">
        <div class="card__icon">${iconFor(c.slug)}</div>
        ${c.category ? `<div class="chip-row"><span class="chip">${esc(c.category)}</span>${c.is_emergency === 'YES' ? '<span class="tag" style="background:var(--err-bg);color:var(--err);border-color:#e8b3a6">Urgent</span>' : ''}</div>` : ''}
        <h3>${esc(c.name)}</h3>
        <p>${esc(c.one_line_summary)}</p>
        <span class="card__link">Learn more</span>
      </a>`).join('');
  };

  const searchEl = document.querySelector('#cond-search');
  if (searchEl) searchEl.addEventListener('input', (e) => { term = e.target.value.toLowerCase().trim(); draw(); });
  const catsEl = document.querySelector('#cond-cats');
  if (catsEl) catsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.hub-filter'); if (!btn) return;
    cat = btn.dataset.cat;
    catsEl.querySelectorAll('.hub-filter').forEach((b) => b.classList.toggle('active', b === btn));
    draw();
  });
  draw();
}

/* ---------------- Trust modules: testimonials, reviews, map ---------------- */
const STAR = (n) => '★★★★★☆☆☆☆☆'.slice(5 - Math.max(0, Math.min(5, n)), 10 - Math.max(0, Math.min(5, n)));

export async function hydrateTestimonials(sel = '#testimonials-wrap', limit) {
  const wrap = document.querySelector(sel);
  if (!wrap || !api.testimonials) return;
  const res = await api.testimonials();
  let rows = res.data || [];
  if (limit) rows = rows.slice(0, limit);
  if (!rows.length) { wrap.innerHTML = ''; return; }
  analytics.testimonialView(location.pathname.replace(/^\//, '').replace('.html', '') || 'home');
  wrap.innerHTML = rows.map((t) => `
    <div class="testimonial-card">
      <div class="testimonial-card__stars" aria-label="${t.rating} out of 5">${STAR(t.rating)}</div>
      <p class="testimonial-card__quote">${esc(t.quote)}</p>
      <div class="testimonial-card__meta">
        <span class="testimonial-card__avatar">${esc(initials(t.author_display))}</span>
        <span>${esc(t.author_display)}${t.area ? ' · ' + esc(t.area) : ''}</span>
      </div>
    </div>`).join('');
}

export async function hydrateGoogleReviews(sel = '#reviews-wrap') {
  const host = document.querySelector(sel);
  if (!host || !api.googleReviews) return;
  const res = await api.googleReviews();
  const data = res.data || {};
  const s = data.summary || {};
  const reviews = data.reviews || [];

  const summary = `
    <div class="reviews-summary" data-reveal>
      <div>
        <div class="reviews-summary__score">${esc(s.rating || '—')}</div>
        <div class="reviews-summary__stars">${STAR(Math.round(s.rating || 0))}</div>
      </div>
      <div>
        <div class="reviews-summary__google">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#4285f4"><path d="M12 11v2.8h4a4 4 0 1 1-1.2-5.1l1.9-1.9A6.7 6.7 0 1 0 18.7 12c0-.45-.05-.9-.13-1.32H12Z"/></svg>
          Google reviews
        </div>
        <p class="muted" style="margin:.25rem 0 0; font-size:var(--fs-sm); color:var(--ink-500)">Based on ${esc(s.review_count || reviews.length)} reviews</p>
      </div>
      <div class="reviews-summary__cta">
        <a class="btn btn--ghost" href="${esc(s.profile_url || '#')}" target="_blank" rel="noopener" data-review-link>View on Google</a>
        <a class="btn btn--primary" href="${esc(s.write_review_url || s.profile_url || '#')}" target="_blank" rel="noopener" data-review-write>Write a Google review</a>
      </div>
    </div>`;

  const cards = reviews.length ? `
    <div class="grid grid--3" style="margin-top:var(--sp-5)" data-reveal="2">
      ${reviews.map((r) => `
        <div class="review-card">
          <div class="review-card__head">
            <span class="review-card__avatar">${esc(initials(r.author_display))}</span>
            <div>
              <div class="review-card__name">${esc(r.author_display)}</div>
              <div class="review-card__time">${esc(r.relative_time || '')}</div>
            </div>
          </div>
          <div class="review-card__stars">${STAR(r.rating)}</div>
          <p class="review-card__text">${esc(r.text)}</p>
          ${r.review_url ? `<a class="review-card__link" href="${esc(r.review_url)}" target="_blank" rel="noopener" data-review-link>Read on Google →</a>` : ''}
        </div>`).join('')}
    </div>` : '';

  host.innerHTML = summary + cards + `
    <p class="hint" style="margin-top:var(--sp-4)">Reviews reflect individual experiences and are not a guarantee of specific medical outcomes.</p>`;

  host.querySelectorAll('[data-review-link],[data-review-write]').forEach((a) =>
    a.addEventListener('click', () => analytics.googleReviewClick(a.dataset.reviewWrite !== undefined ? 'write' : 'view')));
}

export function hydrateMapCard(sel = '#map-card') {
  const host = document.querySelector(sel);
  if (!host) return;
  const cfg = (window.__JSNM__ && window.__JSNM__.cfg) || {};
  host.innerHTML = `
    <div class="map-card">
      <div>
        <p class="eyebrow">Find us</p>
        <h3 style="margin-bottom:var(--sp-2)">${esc(cfg.clinic_name || 'JS Neurominds')}</h3>
        <p style="font-size:var(--fs-sm)">${esc(cfg.address || '')}</p>
        <div class="stack" style="margin-top:var(--sp-4)">
          <a class="btn btn--primary" href="${esc(cfg.maps_url || '#')}" target="_blank" rel="noopener" data-map-link>📍 Get directions</a>
          <a class="btn btn--ghost" href="${esc(cfg.call_link || '#')}">📞 Call the clinic</a>
        </div>
      </div>
      <a href="${esc(cfg.maps_url || '#')}" target="_blank" rel="noopener" class="map-card__embed" style="display:grid;place-items:center;text-decoration:none;color:var(--ink-500)" data-map-link aria-label="Open ${esc(cfg.clinic_name || 'clinic')} on Google Maps">
        <span>🗺<br><span style="font-size:var(--fs-sm)">Open Google Maps</span></span>
      </a>
    </div>`;
  host.querySelectorAll('[data-map-link]').forEach((a) => a.addEventListener('click', () => analytics.mapClick('map_card')));
}

export async function hydrateDetail(kind) {
  const slug = getSlugParam();
  const wrap = document.querySelector('#detail-wrap');
  if (!wrap) return;
  wrap.innerHTML = `<div class="skeleton skeleton--line w60" style="height:32px;margin-bottom:20px"></div><div class="skeleton skeleton--line w80"></div><div class="skeleton skeleton--line"></div><div class="skeleton skeleton--line w60"></div>`;

  let res;
  if (kind === 'condition') { res = await api.condition(slug); analytics.conditionView(slug); }
  else if (kind === 'treatment') { res = await api.treatment(slug); analytics.treatmentView(slug); }
  else if (kind === 'doctor') { res = await api.doctor(slug); }
  else if (kind === 'blog') { res = await api.blog(slug); }

  const d = res && res.data;
  if (!d) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🔍</div><h3>Page not found</h3><p>We couldn't find what you're looking for.</p><a class="btn btn--ghost" href="/">Back to home</a></div>`;
    return;
  }
  document.title = (d.seo_title || d.name || d.full_name || d.title) + '';

  if (kind === 'condition' || kind === 'treatment') {
    const faqs = parseFaqs(d.faqs);
    const symptoms = (d.symptoms || '').split(';').filter(Boolean);
    wrap.innerHTML = `
      <nav class="breadcrumb"><a href="/">Home</a> <span>/</span> <a href="/${kind}s.html">${kind === 'condition' ? 'Conditions' : 'Treatments'}</a> <span>/</span> ${esc(d.name)}</nav>
      <div class="prose">
        <p class="eyebrow">${kind === 'condition' ? 'Condition' : 'Treatment'}</p>
        <h1>${esc(d.name)}</h1>
        <p class="lede">${esc(d.one_line_summary)}</p>
        ${d.is_emergency === 'YES' ? `<div class="notice notice--err"><div><strong>If you are in immediate danger, please use our <a href="/emergency.html">Emergency Help</a> page now.</strong></div></div>` : ''}
        ${symptoms.length ? `<h3>Common signs</h3><ul>${symptoms.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
        ${d.when_to_consult ? `<h3>When to consult</h3><p>${esc(d.when_to_consult)}</p>` : ''}
        ${d.treatment_approach ? `<h3>How we help</h3><p>${esc(d.treatment_approach)}</p>` : ''}
        ${d.overview ? `<h3>Overview</h3><p>${esc(d.overview)}</p>` : ''}
        ${d.what_to_expect ? `<h3>What to expect</h3><p>${esc(d.what_to_expect)}</p>` : ''}
        <p class="hint">Reviewed by our clinical team.</p>
        ${faqs.length ? `<hr class="divider"/><h3>Frequently asked</h3>${faqs.map((f) => faqItem(f)).join('')}` : ''}
        ${ctaPair()}
      </div>`;
  } else if (kind === 'doctor') {
    analytics.doctorProfileView(d.doctor_id);
    wrap.innerHTML = `
      <nav class="breadcrumb"><a href="/">Home</a> <span>/</span> <a href="/doctors.html">Doctors</a> <span>/</span> ${esc(d.full_name)}</nav>
      <div class="card doctor-card" style="margin-bottom:var(--sp-6)">
        ${doctorAvatar(d)}
        <div>
          <h1 style="font-size:var(--fs-2xl); margin-bottom:var(--sp-2)">${esc(d.full_name)}</h1>
          <div class="chip-row">
            <span class="tag">${esc(d.qualification)}</span>
            <span class="chip">${esc(d.experience_years)} years</span>
          </div>
          <p style="margin-top:var(--sp-3)">${esc(d.specialization)}</p>
        </div>
      </div>
      <div class="prose">
        <p class="lede">${esc(d.short_bio)}</p>
        <div class="grid grid--2" style="margin:var(--sp-5) 0">
          <div class="card"><h4>Languages</h4><p class="mb-0">${esc(d.languages)}</p></div>
          <div class="card"><h4>Consultation</h4><p class="mb-0">${esc(d.consultation_type)}</p></div>
        </div>
        ${ctaPair()}
      </div>`;
  } else if (kind === 'blog') {
    wrap.innerHTML = `
      <nav class="breadcrumb"><a href="/">Home</a> <span>/</span> <a href="/knowledge.html">Knowledge</a> <span>/</span> ${esc(d.title)}</nav>
      <div class="prose">
        <span class="tag tag--lav">${esc(d.category)}</span>
        <h1 style="margin-top:var(--sp-3)">${esc(d.title)}</h1>
        <p class="lede">${esc(d.excerpt)}</p>
        <hr class="divider"/>
        ${esc(d.body).split('\n').map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>`;
  }
}

export async function hydrateFaq() {
  const wrap = document.querySelector('#faq-wrap');
  if (!wrap) return;
  const res = await api.faqs();
  wrap.innerHTML = res.data.map((f) => faqItem({ q: f.question, a: f.answer })).join('');
}

function faqItem(f) {
  return `
    <details class="accordion">
      <summary>${esc(f.q)}</summary>
      <div class="accordion__body">${esc(f.a)}</div>
    </details>`;
}

function parseFaqs(raw) {
  if (!raw) return [];
  return raw.split('||').map((pair) => {
    const [q, a] = pair.split('|');
    return q && a ? { q: q.trim(), a: a.trim() } : null;
  }).filter(Boolean);
}

function initials(name) {
  return String(name || '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/**
 * Doctor avatar: prefers a real photo (photo_url / profile_photo_link) with
 * lazy, responsive loading; falls back to an initials tile if no photo is set.
 * size: 'card' (84px) default. Admin can add the photo later — no code change.
 */
function doctorAvatar(d, size = 84) {
  const url = (d && (d.photo_url || d.profile_photo_link)) || '';
  if (url) {
    return `<img class="doctor-card__photo" src="${esc(url)}" alt="${esc(d.full_name)}" width="${size}" height="${size}" loading="lazy" decoding="async" />`;
  }
  return `<div class="doctor-card__avatar">${esc(initials(d.full_name))}</div>`;
}

document.addEventListener('toggle', (e) => {
  if (e.target.tagName === 'DETAILS' && e.target.open) {
    analytics.faqExpand(location.pathname.replace(/^\//, '').replace('.html', ''));
  }
}, true);
