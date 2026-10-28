/**
 * JS Neurominds V1 — shared/render.js
 * Pure HTML-string renderers shared by the browser (pages.js hydration) and the
 * build (scripts/build-pages.js pre-rendering). No DOM access here, so the same
 * markup is produced at build time (for SEO + instant first paint) and at
 * runtime (for the legacy ?slug= pages and dev server).
 */
import { esc, yes, list, faqList, approved, byOrder } from './content-normalize.js';
import { markdownToHtml } from './markdown.js';

/* ---------------- Routes (clean URLs; Cloudflare Pages serves x.html at /x) ---------------- */
export const ROUTES = {
  home: '/', about: '/about', doctors: '/doctors', conditions: '/conditions',
  treatments: '/treatments', services: '/services', lab: '/lab', knowledge: '/knowledge',
  faq: '/faq', contact: '/contact', booking: '/booking', emergency: '/emergency',
  privacy: '/privacy', terms: '/terms', disclaimer: '/medical-disclaimer', testimonials: '/testimonials'
};

/** Detail page URL for a content kind + slug (pre-rendered at build time). */
export function detailUrl(kind, slug) {
  const dir = { condition: 'conditions', treatment: 'treatments', doctor: 'doctors', blog: 'knowledge', knowledge: 'knowledge', lab_package: 'lab' }[kind] || kind;
  return `/${dir}/${encodeURIComponent(slug)}`;
}

/** Legacy fallback (query-string detail pages still work). */
export function legacyDetailUrl(kind, slug) {
  const file = { condition: 'condition', treatment: 'treatment', doctor: 'doctor', blog: 'knowledge-detail', knowledge: 'knowledge-detail' }[kind] || kind;
  return `/${file}?slug=${encodeURIComponent(slug)}`;
}

/* ---------------- Small shared bits ---------------- */
export const ICONS = {
  depression: '🌧', anxiety: '🌀', 'sleep-problems': '🌙', addiction: '🔗',
  'child-teen-concerns': '🧸', 'self-harm-thoughts': '🤍',
  'psychiatry-consultation': '🩺', 'online-consultation': '💻',
  'general-medicine-walkin': '🚶', 'first-aid-support': '➕',
  'counselling-psychotherapy': '💬', 'medication-management': '💊', 'de-addiction-support': '🔗'
};
export const iconFor = (slug, fallback) => ICONS[slug] || fallback || '🩺';

export function initials(name) {
  return String(name || '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export const STAR = (n) => {
  const k = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
  return '★'.repeat(k) + '☆'.repeat(5 - k);
};

export function doctorAvatar(d, size = 84) {
  const url = (d && (d.photo_url || d.profile_photo_link)) || '';
  if (url) {
    return `<img class="doctor-card__photo" src="${esc(url)}" alt="${esc(d.full_name)}" width="${size}" height="${size}" loading="lazy" decoding="async" />`;
  }
  return `<div class="doctor-card__avatar">${esc(initials(d.full_name))}</div>`;
}

export function ctaPair(flags) {
  flags = flags || {};
  const callback = yes(flags.public_callback_enabled)
    ? `<a class="btn btn--ghost" href="${ROUTES.booking}#callback">Request Clinic Callback</a>`
    : '';
  return `
    <div class="hero__cta" style="margin-top:var(--sp-6)">
      <a class="btn btn--primary" href="${ROUTES.booking}#confirmed">Book confirmed appointment</a>
      ${callback}
    </div>`;
}

export function faqItem(f) {
  return `
    <details class="accordion">
      <summary>${esc(f.question)}</summary>
      <div class="accordion__body">${esc(f.answer)}</div>
    </details>`;
}

/* ---------------- Cards ---------------- */
export function conditionCard(c, { showCategory = false } = {}) {
  const urgent = yes(c.is_emergency) ? '<span class="tag" style="background:var(--err-bg);color:var(--err);border-color:#e8b3a6">Urgent</span>' : '';
  const cat = showCategory && c.category ? `<div class="chip-row"><span class="chip">${esc(c.category)}</span>${urgent}</div>` : '';
  return `
      <a class="card card--link" href="${detailUrl('condition', c.slug)}">
        <div class="card__icon">${iconFor(c.slug)}</div>
        ${cat}
        <h3>${esc(c.name)}</h3>
        <p>${esc(c.one_line_summary)}</p>
        <span class="card__link">Learn more</span>
      </a>`;
}

export function serviceCard(s) {
  return `
      <div class="card">
        <div class="card__icon">${iconFor(s.slug)}</div>
        <h3 style="font-size:var(--fs-md)">${esc(s.name)}</h3>
        <p>${esc(s.summary)}</p>
      </div>`;
}

export function doctorHighlight(d) {
  return `
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
          <a class="btn btn--ghost" href="${detailUrl('doctor', d.slug)}">View full profile</a>
        </div>
      </div>`;
}

export function doctorListCard(item) {
  const photo = (item.photo_url || item.profile_photo_link)
    ? `<img class="doctor-card__photo" src="${esc(item.photo_url || item.profile_photo_link)}" alt="${esc(item.full_name)}" width="96" height="96" loading="lazy" decoding="async" />`
    : `<div class="card__icon">${esc(initials(item.full_name))}</div>`;
  const modes = [];
  if (yes(item.online_consultation_enabled)) modes.push('Online');
  if (yes(item.clinic_visit_enabled)) modes.push('In-clinic');
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
            <a class="btn btn--ghost btn--sm" href="${detailUrl('doctor', item.slug)}">View full profile</a>
          </div>
        </div>`;
}

export function genericListCard(kind, item, cfg) {
  const icon = iconFor(item.slug, kind === 'lab' ? '🧪' : '📄');
  const extra = kind === 'lab' && item.turnaround ? `<span class="chip">${esc(item.turnaround)}</span>` : '';
  const inner = `
      <div class="card__icon">${icon}</div>
      <h3>${esc(item[cfg.title])}</h3>
      <p>${esc(item[cfg.sub])}</p>
      ${extra ? `<div class="chip-row">${extra}</div>` : ''}
      ${cfg.href ? `<span class="card__link">View</span>` : ''}`;
  return cfg.href
    ? `<a class="card card--link" href="${detailUrl(cfg.href, item.slug)}">${inner}</a>`
    : `<div class="card">${inner}</div>`;
}

export const LIST_KINDS = {
  conditions: { href: 'condition', title: 'name', sub: 'one_line_summary' },
  treatments: { href: 'treatment', title: 'name', sub: 'one_line_summary' },
  services:   { href: '', title: 'name', sub: 'summary' },
  doctors:    { href: 'doctor', title: 'full_name', sub: 'specialization' },
  lab:        { href: '', title: 'name', sub: 'summary' },
  blog:       { href: 'blog', title: 'title', sub: 'excerpt' }
};

export function renderList(kind, rows) {
  if (!rows || !rows.length) {
    return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">📭</div><p>Nothing here yet. Please check back soon.</p></div>`;
  }
  const cfg = LIST_KINDS[kind];
  return rows.map((item) => kind === 'doctors' ? doctorListCard(item) : genericListCard(kind, item, cfg)).join('');
}

export function testimonialCards(rows) {
  return (rows || []).map((t) => `
    <div class="testimonial-card">
      <div class="testimonial-card__stars" aria-label="${esc(t.rating)} out of 5">${STAR(t.rating)}</div>
      <p class="testimonial-card__quote">${esc(t.quote)}</p>
      <div class="testimonial-card__meta">
        <span class="testimonial-card__avatar">${esc(initials(t.author_display))}</span>
        <span>${esc(t.author_display)}${t.area ? ' · ' + esc(t.area) : ''}</span>
      </div>
    </div>`).join('');
}

export function googleReviewsBlock(data) {
  data = data || {};
  const s = data.summary || {};
  const reviews = approved(data.reviews || []);
  const summary = `
    <div class="reviews-summary" data-reveal>
      <div>
        <div class="reviews-summary__score">${esc(s.rating || '—')}</div>
        <div class="reviews-summary__stars">${STAR(s.rating || 0)}</div>
      </div>
      <div>
        <div class="reviews-summary__google">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#4285f4" aria-hidden="true"><path d="M12 11v2.8h4a4 4 0 1 1-1.2-5.1l1.9-1.9A6.7 6.7 0 1 0 18.7 12c0-.45-.05-.9-.13-1.32H12Z"/></svg>
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
  return summary + cards + `
    <p class="hint" style="margin-top:var(--sp-4)">Reviews reflect individual experiences and are not a guarantee of specific medical outcomes.</p>`;
}

export function faqListHtml(rows) {
  return (rows || []).slice().sort(byOrder('order')).map((f) => faqItem({ question: f.question, answer: f.answer })).join('');
}

/* ---------------- Detail pages ---------------- */
export function renderConditionOrTreatment(kind, d, flags) {
  const faqs = faqList(d.faqs);
  const symptoms = list(d.symptoms);
  const related = list(d.related_conditions);
  const treated = list(d.conditions_treated);
  const listRoute = kind === 'condition' ? ROUTES.conditions : ROUTES.treatments;
  return `
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>/</span> <a href="${listRoute}">${kind === 'condition' ? 'Conditions' : 'Treatments'}</a> <span>/</span> ${esc(d.name)}</nav>
      <article class="prose">
        <p class="eyebrow">${kind === 'condition' ? 'Condition' : 'Treatment'}${d.category ? ' · ' + esc(d.category) : ''}</p>
        <h1>${esc(d.name)}</h1>
        <p class="lede">${esc(d.one_line_summary)}</p>
        ${yes(d.is_emergency) ? `<div class="notice notice--err"><div><strong>If you are in immediate danger, please use our <a href="${ROUTES.emergency}">Emergency Help</a> page now.</strong></div></div>` : ''}
        ${symptoms.length ? `<h2>Common signs</h2><ul>${symptoms.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
        ${d.when_to_consult ? `<h2>When to consult</h2><p>${esc(d.when_to_consult)}</p>` : ''}
        ${d.treatment_approach ? `<h2>How we help</h2><p>${esc(d.treatment_approach)}</p>` : ''}
        ${d.overview ? `<h2>Overview</h2><p>${esc(d.overview)}</p>` : ''}
        ${d.what_to_expect ? `<h2>What to expect</h2><p>${esc(d.what_to_expect)}</p>` : ''}
        ${treated.length ? `<h2>Conditions this helps with</h2><div class="chip-row">${treated.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
        ${related.length ? `<h2>Related concerns</h2><div class="chip-row">${related.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
        <p class="hint">Reviewed by our clinical team. This information is for general awareness and is not a diagnosis.</p>
        ${faqs.length ? `<hr class="divider"/><h2>Frequently asked</h2>${faqs.map((f) => faqItem(f)).join('')}` : ''}
        ${ctaPair(flags)}
      </article>`;
}

export function renderDoctor(d, flags) {
  const modes = [];
  if (yes(d.clinic_visit_enabled)) modes.push('Clinic visit');
  if (yes(d.online_consultation_enabled)) modes.push('Online');
  const consult = d.consultation_type || modes.join(', ');
  const handled = list(d.conditions_handled, ',').length > 1 ? list(d.conditions_handled, ',') : list(d.conditions_handled);
  return `
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>/</span> <a href="${ROUTES.doctors}">Doctors</a> <span>/</span> ${esc(d.full_name)}</nav>
      <div class="card doctor-card" style="margin-bottom:var(--sp-6)">
        ${doctorAvatar(d)}
        <div>
          <h1 style="font-size:var(--fs-2xl); margin-bottom:var(--sp-2)">${esc(d.full_name)}</h1>
          <div class="chip-row">
            <span class="tag">${esc(d.qualification)}</span>
            ${d.experience_years ? `<span class="chip">${esc(d.experience_years)} years</span>` : ''}
          </div>
          <p style="margin-top:var(--sp-3)">${esc(d.specialization)}</p>
        </div>
      </div>
      <article class="prose">
        <p class="lede">${esc(d.short_bio)}</p>
        <div class="grid grid--2" style="margin:var(--sp-5) 0">
          <div class="card"><h4>Languages</h4><p class="mb-0">${esc(d.languages)}</p></div>
          <div class="card"><h4>Consultation</h4><p class="mb-0">${esc(consult)}</p></div>
        </div>
        ${handled.length ? `<h2>Areas of care</h2><div class="chip-row">${handled.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : ''}
        ${ctaPair(flags)}
      </article>`;
}

export function renderBlog(d) {
  const date = d.published_at || d.date || '';
  return `
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>/</span> <a href="${ROUTES.knowledge}">Knowledge</a> <span>/</span> ${esc(d.title)}</nav>
      <article class="prose">
        ${d.category ? `<span class="tag tag--lav">${esc(d.category)}</span>` : ''}
        <h1 style="margin-top:var(--sp-3)">${esc(d.title)}</h1>
        <p class="lede">${esc(d.excerpt)}</p>
        <p class="hint">${d.author ? 'By ' + esc(d.author) : ''}${date ? (d.author ? ' · ' : '') + esc(date) : ''}</p>
        <hr class="divider"/>
        ${markdownToHtml(d.body)}
      </article>`;
}

export function renderDetail(kind, d, flags) {
  if (kind === 'condition' || kind === 'treatment') return renderConditionOrTreatment(kind, d, flags);
  if (kind === 'doctor') return renderDoctor(d, flags);
  if (kind === 'blog' || kind === 'knowledge') return renderBlog(d);
  return '';
}

export function notFoundHtml() {
  return `<div class="empty-state"><div class="empty-state__icon">🔍</div><h3>Page not found</h3><p>We couldn't find what you're looking for.</p><a class="btn btn--ghost" href="/">Back to home</a></div>`;
}

/* ---------------- Editable copy lists (home trust strip, assurance strip, emergency steps) ---------------- */
export function trustItemsHtml(items) {
  return (items || []).map((t) => `<div class="hero__trust-item"><b>${esc(t.value)}</b><span>${esc(t.label)}</span></div>`).join('');
}
export function assuranceItemsHtml(items) {
  return (items || []).map((t) => `<div class="assurance__item"><span class="ico">${esc(t.icon || '✓')}</span> ${esc(t.text)}</div>`).join('');
}
export function stepsHtml(items) {
  return (items || []).map((t) => `<li>${esc(t)}</li>`).join('');
}
/** id → [copy key, renderer]; used by both the build and runtime applyPageCopy(). */
export const COPY_LISTS = {
  'hero-trust': ['trust_items', trustItemsHtml],
  'home-assurance': ['assurance_items', assuranceItemsHtml],
  'lab-assurance': ['assurance_items', assuranceItemsHtml],
  'emergency-steps': ['steps', stepsHtml]
};
