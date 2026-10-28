/**
 * JS Neurominds V1 — shared/shell.js
 * Pure HTML-string renderers for the site shell: emergency bar, header,
 * footer and floating buttons. Used by the BUILD (scripts/lib/html-transform.js
 * pre-renders the shell into every page so nothing jumps when JS loads — CLS ≈ 0)
 * and by the browser (public-site/assets/js/app.js only wires behaviour, or
 * renders the shell itself if a page was not pre-rendered).
 */
import { yes, esc } from './content-normalize.js';
import { ROUTES } from './render.js';

const LOGO = '/assets/brand/logo.png';

export function navHref(route) {
  return route === '/' ? '/' : String(route || '/').replace(/\.html$/, '');
}

export function isCurrent(route, path) {
  const clean = String(path || '/').replace(/\.html$/, '').replace(/\/index$/, '/');
  const href = navHref(route);
  if (href === '/') return clean === '/';
  return clean === href || clean.startsWith(href + '/');
}

export const SOCIAL_ICONS = {
  instagram: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.5 0-4.74.07-.9.04-1.38.19-1.7.32-.43.16-.73.36-1.05.68-.32.32-.52.62-.68 1.05-.13.32-.28.8-.32 1.7C3.24 8.5 3.24 8.86 3.24 12s0 3.5.07 4.74c.04.9.19 1.38.32 1.7.16.43.36.73.68 1.05.32.32.62.52 1.05.68.32.13.8.28 1.7.32 1.24.07 1.6.07 4.74.07s3.5 0 4.74-.07c.9-.04 1.38-.19 1.7-.32.43-.16.73-.36 1.05-.68.32-.32.52-.62.68-1.05.13-.32.28-.8.32-1.7.07-1.24.07-1.6.07-4.74s0-3.5-.07-4.74c-.04-.9-.19-1.38-.32-1.7a2.8 2.8 0 0 0-.68-1.05 2.8 2.8 0 0 0-1.05-.68c-.32-.13-.8-.28-1.7-.32C15.5 4 15.14 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 16.94 4.94 4.94 0 0 1 12 7.06Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.13-2.04a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.9-.8-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35ZM12 2.04a9.9 9.9 0 0 0-8.46 15.05L2.05 22l5.04-1.32A9.9 9.9 0 1 0 12 2.04Zm0 1.8a8.1 8.1 0 0 1 6.84 12.43l-.2.32.74 2.7-2.77-.73-.31.18A8.1 8.1 0 1 1 12 3.84Z"/></svg>',
  google: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M12 11v2.8h4a4 4 0 1 1-1.2-5.1l1.9-1.9A6.7 6.7 0 1 0 18.7 12c0-.45-.05-.9-.13-1.32H12Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12 31 31 0 0 0 23 7.5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.64h.05c.53-1 1.83-2.05 3.76-2.05C20.5 8.59 22 10.2 22 13.5V21h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V21H9V9Z"/></svg>'
};

export const SMALL_LOGO = { webp: '/assets/brand/logo-96.webp', png: '/assets/brand/logo-96.png' };
function brandMark(cfg, forFooter) {
  const custom = cfg && (forFooter ? cfg.footer_logo_url : cfg.logo_url);
  // The default 512px logo is served as a 96px WebP (≈3 KB instead of 200 KB) for the 44px header mark.
  const useSmall = !custom || custom === LOGO || custom === '/assets/brand/logo.webp';
  const img = useSmall
    ? `<picture><source srcset="${SMALL_LOGO.webp}" type="image/webp" /><img src="${SMALL_LOGO.png}" alt="" width="44" height="44" loading="eager" decoding="async" fetchpriority="${forFooter ? 'low' : 'high'}" /></picture>`
    : `<img src="${custom}" alt="" width="44" height="44" loading="${forFooter ? 'lazy' : 'eager'}" decoding="async" />`;
  return `
    <span class="brand__logo" aria-hidden="true">${img}</span>
    <span class="brand__name">${cfg.clinic_short}<span>${cfg.tagline || 'Psychiatry &amp; Diagnostics'}</span></span>`;
}

export function themeToggleHtml(mode) {
  // Static markup; app.js attaches behaviour. "mode" is only known in the browser.
  const icons = { system: '🖥', light: '☀', dark: '🌙' };
  const labels = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };
  const m = icons[mode] ? mode : 'system';
  return `<button class="theme-toggle" type="button" aria-label="${labels[m]}" title="${labels[m]}" data-theme-toggle>${icons[m]}</button>`;
}

export function emergencyBarHtml(cfg) {
  const text = (cfg && cfg.emergency_bar_text) || '<strong>In a crisis?</strong> <a href="/emergency">Get emergency help</a> — this website is not an emergency service.';
  return `<div class="emergency-bar" data-prerendered="1">${text}</div>`;
}

export function headerHtml(cfg, nav, currentPath) {
  const links = (nav || []).map((n) =>
    `<a href="${navHref(n.route)}"${isCurrent(n.route, currentPath) ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`
  ).join('');
  return `
    <header class="site-header" data-prerendered="1">
      <div class="container">
        <a class="brand" href="/" aria-label="${cfg.clinic_name} home">
          ${brandMark(cfg, false)}
        </a>
        <nav class="nav" aria-label="Primary">
          ${links}
          <span class="theme-slot" data-theme-slot>${themeToggleHtml()}</span>
          <a class="btn btn--primary nav__cta" href="${ROUTES.booking}">${cfg.nav_cta_label || 'Book now'}</a>
        </nav>
        <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">☰</button>
      </div>
      <nav class="mobile-nav" aria-label="Mobile">
        ${links}
        <span class="theme-slot" data-theme-slot-mobile>${themeToggleHtml()}</span>
        <a class="btn btn--primary btn--block" href="${ROUTES.booking}">${cfg.nav_cta_label || 'Book now'}</a>
      </nav>
    </header>
  `;
}

function renderFooterSocial(social) {
  if (!social || !social.length) return '';
  const items = social.map((s) => {
    const ico = SOCIAL_ICONS[s.platform] || SOCIAL_ICONS.google;
    const tab = yes(s.open_in_new_tab) ? ' target="_blank" rel="noopener"' : '';
    return `<a class="social-link" href="${s.url}"${tab} aria-label="${s.aria_label || s.label}" data-platform="${s.platform}" title="${s.label}">${ico}</a>`;
  }).join('');
  return `<div class="footer-social" aria-label="Social media">${items}</div>`;
}

export function footerHtml(cfg, social, flags) {
  flags = flags || {};
  const labLink = yes(flags.public_lab_tests_enabled) ? `<li><a href="${ROUTES.lab}">Lab Tests</a></li>` : '';
  const knowledgeLink = flags.public_knowledge_enabled === false ? '' : `<li><a href="${ROUTES.knowledge}">Knowledge</a></li>`;
  const testimonialsLink = flags.public_testimonials_enabled === false ? '' : `<li><a href="${ROUTES.testimonials}">Testimonials</a></li>`;
  const callbackOn = yes(flags.public_callback_enabled);
  return `
    <footer class="site-footer" data-prerendered="1">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="brand" href="/" style="margin-bottom:var(--sp-4)">
              ${brandMark(cfg, true)}
            </a>
            <p class="footer-contact">${cfg.address}</p>
            <p class="footer-contact">Phone: <a href="${cfg.call_link}">${cfg.display_phone}</a></p>
            ${cfg.opening_hours_text ? `<p class="footer-contact">Hours: ${cfg.opening_hours_text}</p>` : ''}
            ${cfg.email_support ? `<p class="footer-contact">Email: <a href="mailto:${cfg.email_support}">${cfg.email_support}</a></p>` : ''}
            ${renderFooterSocial(social)}
          </div>
          <div>
            <p class="footer-heading">Care</p>
            <ul class="footer-links">
              <li><a href="${ROUTES.doctors}">Doctors</a></li>
              <li><a href="${ROUTES.conditions}">Conditions</a></li>
              <li><a href="${ROUTES.treatments}">Treatments</a></li>
              <li><a href="${ROUTES.services}">Services</a></li>
              ${labLink}
              ${knowledgeLink}
            </ul>
          </div>
          <div>
            <p class="footer-heading">Clinic</p>
            <ul class="footer-links">
              <li><a href="${ROUTES.about}">About</a></li>
              ${testimonialsLink}
              <li><a href="${ROUTES.contact}">Contact</a></li>
              <li><a href="${ROUTES.faq}">FAQ</a></li>
              <li><a href="${ROUTES.emergency}">Emergency help</a></li>
            </ul>
          </div>
          <div>
            <p class="footer-heading">Get started</p>
            <p class="footer-contact">${callbackOn ? 'Request a clinic callback or book a confirmed appointment online.' : 'Book a confirmed appointment online in minutes.'}</p>
            <div class="footer-cta">
              ${callbackOn ? `<a class="btn btn--ghost btn--block footer-cta__ghost" href="${ROUTES.booking}#callback">Request Clinic Callback</a>` : ''}
              <a class="btn btn--primary btn--block" href="${ROUTES.booking}#confirmed">Book Confirmed Appointment</a>
            </div>
            <a class="footer-map" href="${cfg.maps_url}" target="_blank" rel="noopener" data-map-link>📍 Get directions on Google Maps</a>
          </div>
        </div>
        <div class="footer-legal">
          <a href="${ROUTES.privacy}">Privacy</a> · <a href="${ROUTES.terms}">Terms</a> · <a href="${ROUTES.disclaimer}">Medical disclaimer</a>
        </div>
        <div class="footer-bottom">
          <span>© <span data-year>${new Date().getFullYear()}</span> ${cfg.clinic_name}. All rights reserved.</span>
          <span>${cfg.footer || 'Built and maintained by <a href="https://tcgr.in/" target="_blank" rel="noopener">tcgr.in</a>'}</span>
        </div>
      </div>
    </footer>
  `;
}

function fabIcon(kind) {
  if (kind === 'whatsapp') return SOCIAL_ICONS.whatsapp;
  if (kind === 'call') return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1A17 17 0 0 1 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.46.57 3.58.12.35.03.75-.24 1.02l-2.23 2.2Z"/></svg>';
  return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 1.6.9 3.4 2 5 .9 1.3 2 2.6 2.5 4 .2.6.5 1 .9 1.3.4.3.9.4 1.6.4s1.2-.1 1.6-.4c.4-.3.7-.7.9-1.3.5-1.4 1.6-2.7 2.5-4 1.1-1.6 2-3.4 2-5a7 7 0 0 0-7-7Zm0 4.5A2.5 2.5 0 1 1 12 11.5 2.5 2.5 0 0 1 12 6.5Z"/></svg>';
}

/** Enabled floating buttons in display order (defaults to Call + WhatsApp from clinic config). */
export function fabList(cfg, fabs) {
  return (fabs && fabs.length ? fabs : [
    { kind: 'call', label: 'Call Clinic', value: cfg.call_link, device_visibility: 'all' },
    { kind: 'whatsapp', label: 'WhatsApp Clinic', value: cfg.whatsapp_link, device_visibility: 'all' }
  ]).filter((c) => c.is_enabled === undefined || yes(c.is_enabled));
}

export function fabsHtml(cfg, fabs) {
  const list = fabList(cfg, fabs);
  const right = list.filter((c) => c.kind !== 'feedback').map((c) => {
    const dv = c.device_visibility || 'all';
    let href = c.value || '';
    if (c.kind === 'whatsapp' && c.whatsapp_text && href.indexOf('?text=') === -1) {
      href += (href.indexOf('?') === -1 ? '?' : '&') + 'text=' + encodeURIComponent(c.whatsapp_text);
    }
    return `<a class="fab fab--${esc(c.kind)} dv-${esc(dv)}" href="${esc(href || '#')}" ${c.kind === 'whatsapp' ? 'target="_blank" rel="noopener"' : ''} aria-label="${esc(c.label)}" title="${esc(c.label)}" data-fab="${esc(c.kind)}">${fabIcon(c.kind)}</a>`;
  }).join('');
  const enquire = list.find((c) => c.kind === 'feedback');
  const left = enquire
    ? `<div class="fab-stack fab-stack--left" data-prerendered="1"><button class="fab fab--feedback" id="open-feedback" aria-label="${esc(enquire.label || 'Share feedback')}">★ ${esc(enquire.label || 'Feedback')}</button></div>`
    : '';
  return `<div class="fab-stack fab-stack--right" aria-label="Quick contact" data-prerendered="1">${right}</div>${left}`;
}

/** Whole shell for the build: [top, bottom] fragments. */
export function shellHtml({ cfg, nav, social, flags, fabs, currentPath }) {
  flags = flags || {};
  const top = (flags.emergency_bar_enabled === false ? '' : emergencyBarHtml(cfg)) + headerHtml(cfg, nav, currentPath);
  const bottom = footerHtml(cfg, social, flags) + (flags.floating_cta_enabled !== false ? fabsHtml(cfg, fabs) : '');
  return [top, bottom];
}
