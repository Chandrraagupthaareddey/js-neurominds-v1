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
      <a class="btn btn--primary" href="/booking.html">Request private call back</a>
      <a class="btn btn--ghost" href="/booking.html#confirmed">Book confirmed appointment</a>
    </div>`;
}

export async function hydrateHome() {
  const condWrap = document.querySelector('#home-conditions');
  const svcWrap = document.querySelector('#home-services');
  skeletonCards(6, condWrap); skeletonCards(4, svcWrap);

  const [cond, docs, svcs] = await Promise.all([api.conditions(), api.doctors(), api.services()]);

  if (condWrap) {
    condWrap.innerHTML = cond.data.slice(0, 6).map((c) => `
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
        <div class="doctor-card__avatar">${esc(initials(d.full_name))}</div>
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
    blog:       { fn: api.blogs, href: 'blog-detail', title: 'title', sub: 'excerpt' }
  };
  const cfg = map[kind];
  const res = await cfg.fn();
  if (!res.data || !res.data.length) {
    wrap.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">📭</div><p>Nothing here yet. Please check back soon.</p></div>`;
    return;
  }
  wrap.innerHTML = res.data.map((item) => {
    const icon = iconFor(item.slug, kind === 'doctors' ? '🩺' : kind === 'lab' ? '🧪' : '📄');
    const extra = kind === 'lab' && item.turnaround ? `<span class="chip">${esc(item.turnaround)}</span>` : '';
    const inner = `
      <div class="card__icon">${kind === 'doctors' ? esc(initials(item.full_name)) : icon}</div>
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
        <div class="doctor-card__avatar">${esc(initials(d.full_name))}</div>
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
      <nav class="breadcrumb"><a href="/">Home</a> <span>/</span> <a href="/blog.html">Blog</a> <span>/</span> ${esc(d.title)}</nav>
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

document.addEventListener('toggle', (e) => {
  if (e.target.tagName === 'DETAILS' && e.target.open) {
    analytics.faqExpand(location.pathname.replace(/^\//, '').replace('.html', ''));
  }
}, true);
