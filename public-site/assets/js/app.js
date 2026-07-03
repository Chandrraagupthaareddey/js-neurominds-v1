/**
 * JS Neurominds V1 — public-site/assets/js/app.js
 * Shared site shell. Renders header, nav, footer, floating action buttons,
 * the emergency bar, footer social icons, and a theme toggle — all from API
 * config, so contact details, navigation, brand, and social links stay
 * editable from the Admin CMS with no code change.
 *
 * Brand assets resolve to /assets/brand/* (swappable by the clinic later via
 * Brand Settings). The theme toggle (light/dark/system) persists to
 * localStorage under "jsnm_theme" and respects prefers-color-scheme.
 */
import { api } from './api.js';
import { initAnalytics, analytics } from './analytics.js';
import { initUi } from './ui.js';

const $ = (sel, root = document) => root.querySelector(sel);
const LOGO = '/assets/brand/logo.png';

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

function navHref(route) {
  return route === '/' ? '/index.html' : route + '.html';
}

/* ---------------- Theme (light / dark / system) ---------------- */
const THEME_KEY = 'jsnm_theme';
function getStoredTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { return 'system'; }
}
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
  try { localStorage.setItem(THEME_KEY, mode); } catch (e) { /* ignore */ }
}
// Apply as early as possible to avoid a flash.
applyTheme(getStoredTheme());

function themeToggle() {
  const order = ['system', 'light', 'dark'];
  const icons = { system: '🖥', light: '☀', dark: '🌙' };
  const labels = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };
  const btn = el(`<button class="theme-toggle" type="button" aria-label="Switch theme" title="Theme"></button>`);
  const paint = () => {
    const cur = getStoredTheme();
    btn.textContent = icons[cur] || '🖥';
    btn.setAttribute('aria-label', labels[cur] || 'Theme');
    btn.setAttribute('title', labels[cur] || 'Theme');
  };
  paint();
  btn.addEventListener('click', () => {
    const cur = getStoredTheme();
    const next = order[(order.indexOf(cur) + 1) % order.length];
    applyTheme(next);
    paint();
  });
  return btn;
}

/* ---------------- Header ---------------- */
function brandMark(cfg, forFooter) {
  const logo = (cfg && (forFooter ? cfg.footer_logo_url : cfg.logo_url)) || LOGO;
  return `
    <span class="brand__logo" aria-hidden="true"><img src="${logo}" alt="" width="44" height="44" loading="eager" decoding="async" /></span>
    <span class="brand__name">${cfg.clinic_short}<span>Psychiatry &amp; Diagnostics</span></span>`;
}

function renderHeader(cfg, nav, currentPath) {
  const links = nav.map((n) =>
    `<a href="${navHref(n.route)}"${isCurrent(n.route, currentPath) ? ' aria-current="page"' : ''}>${n.label}</a>`
  ).join('');

  const header = el(`
    <header class="site-header">
      <div class="container">
        <a class="brand" href="/index.html" aria-label="${cfg.clinic_name} home">
          ${brandMark(cfg, false)}
        </a>
        <nav class="nav" aria-label="Primary">
          ${links}
          <span class="theme-slot" data-theme-slot></span>
          <a class="btn btn--primary nav__cta" href="/booking.html">Book now</a>
        </nav>
        <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">☰</button>
      </div>
      <nav class="mobile-nav" aria-label="Mobile">
        ${links}
        <span class="theme-slot" data-theme-slot-mobile></span>
        <a class="btn btn--primary btn--block" href="/booking.html">Book now</a>
      </nav>
    </header>
  `);

  const slot = $('[data-theme-slot]', header);
  if (slot) slot.appendChild(themeToggle());
  const slotM = $('[data-theme-slot-mobile]', header);
  if (slotM) slotM.appendChild(themeToggle());

  const toggle = $('.nav-toggle', header);
  const mobile = $('.mobile-nav', header);
  toggle.addEventListener('click', () => {
    const open = mobile.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '✕' : '☰';
  });
  return header;
}

function isCurrent(route, path) {
  const file = navHref(route);
  return path.endsWith(file) || (route === '/' && (path === '/' || path.endsWith('/index.html')));
}

function renderEmergencyBar() {
  return el(`
    <div class="emergency-bar">
      <strong>In a crisis?</strong> <a href="/emergency.html">Get emergency help</a> — this website is not an emergency service.
    </div>
  `);
}

/* ---------------- Footer social icons ---------------- */
const SOCIAL_ICONS = {
  instagram: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.5 0-4.74.07-.9.04-1.38.19-1.7.32-.43.16-.73.36-1.05.68-.32.32-.52.62-.68 1.05-.13.32-.28.8-.32 1.7C3.24 8.5 3.24 8.86 3.24 12s0 3.5.07 4.74c.04.9.19 1.38.32 1.7.16.43.36.73.68 1.05.32.32.62.52 1.05.68.32.13.8.28 1.7.32 1.24.07 1.6.07 4.74.07s3.5 0 4.74-.07c.9-.04 1.38-.19 1.7-.32.43-.16.73-.36 1.05-.68.32-.32.52-.62.68-1.05.13-.32.28-.8.32-1.7.07-1.24.07-1.6.07-4.74s0-3.5-.07-4.74c-.04-.9-.19-1.38-.32-1.7a2.8 2.8 0 0 0-.68-1.05 2.8 2.8 0 0 0-1.05-.68c-.32-.13-.8-.28-1.7-.32C15.5 4 15.14 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 16.94 4.94 4.94 0 0 1 12 7.06Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.13-2.04a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.9-.8-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35ZM12 2.04a9.9 9.9 0 0 0-8.46 15.05L2.05 22l5.04-1.32A9.9 9.9 0 1 0 12 2.04Zm0 1.8a8.1 8.1 0 0 1 6.84 12.43l-.2.32.74 2.7-2.77-.73-.31.18A8.1 8.1 0 1 1 12 3.84Z"/></svg>',
  google: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M12 11v2.8h4a4 4 0 1 1-1.2-5.1l1.9-1.9A6.7 6.7 0 1 0 18.7 12c0-.45-.05-.9-.13-1.32H12Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12 31 31 0 0 0 23 7.5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.8v1.64h.05c.53-1 1.83-2.05 3.76-2.05C20.5 8.59 22 10.2 22 13.5V21h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V21H9V9Z"/></svg>'
};

function renderFooterSocial(social) {
  if (!social || !social.length) return '';
  const items = social.map((s) => {
    const ico = SOCIAL_ICONS[s.platform] || SOCIAL_ICONS.google;
    const tab = String(s.open_in_new_tab).toUpperCase() === 'YES' ? ' target="_blank" rel="noopener"' : '';
    return `<a class="social-link" href="${s.url}"${tab} aria-label="${s.aria_label || s.label}" data-platform="${s.platform}" title="${s.label}">${ico}</a>`;
  }).join('');
  return `<div class="footer-social" aria-label="Social media">${items}</div>`;
}

function renderFooter(cfg, social, flags) {
  flags = flags || {};
  const labLink = flags.public_lab_tests_enabled ? '<li><a href="/lab.html">Lab Tests</a></li>' : '';
  const knowledgeLink = flags.public_knowledge_enabled === false ? '' : '<li><a href="/knowledge.html">Knowledge</a></li>';
  const testimonialsLink = flags.public_testimonials_enabled === false ? '' : '<li><a href="/testimonials.html">Testimonials</a></li>';
  const footer = el(`
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="brand" href="/index.html" style="margin-bottom:var(--sp-4)">
              ${brandMark(cfg, true)}
            </a>
            <p class="footer-contact">${cfg.address}</p>
            <p class="footer-contact">Phone: <a href="${cfg.call_link}">${cfg.display_phone}</a></p>
            ${renderFooterSocial(social)}
          </div>
          <div>
            <h4>Care</h4>
            <ul class="footer-links">
              <li><a href="/doctors.html">Doctors</a></li>
              <li><a href="/conditions.html">Conditions</a></li>
              <li><a href="/treatments.html">Treatments</a></li>
              ${labLink}
              ${knowledgeLink}
            </ul>
          </div>
          <div>
            <h4>Clinic</h4>
            <ul class="footer-links">
              <li><a href="/about.html">About</a></li>
              ${testimonialsLink}
              <li><a href="/contact.html">Contact</a></li>
              <li><a href="/faq.html">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4>Get started</h4>
            <p class="footer-contact">Request a clinic callback or book a confirmed appointment online.</p>
            <div class="footer-cta">
              <a class="btn btn--primary btn--block" href="/booking.html">Request Clinic Callback</a>
              <a class="btn btn--ghost btn--block footer-cta__ghost" href="/booking.html#confirmed">Book Confirmed Appointment</a>
            </div>
            <a class="footer-map" href="${cfg.maps_url}" target="_blank" rel="noopener" data-map-link>📍 Get directions on Google Maps</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ${cfg.clinic_name}. All rights reserved.</span>
          <span>${cfg.footer}</span>
        </div>
      </div>
    </footer>
  `);

  // Track social + map clicks (non-PII).
  footer.querySelectorAll('.social-link').forEach((a) => {
    a.addEventListener('click', () => {
      const p = a.getAttribute('data-platform');
      if (p === 'instagram') analytics.instagramClick('footer');
      else if (p === 'whatsapp') analytics.whatsappClick('footer');
      else if (p === 'google') analytics.googleReviewClick('footer');
    });
  });
  const map = $('[data-map-link]', footer);
  if (map) map.addEventListener('click', () => analytics.mapClick('footer'));
  return footer;
}

function fabIcon(kind) {
  if (kind === 'whatsapp') return SOCIAL_ICONS.whatsapp;
  if (kind === 'call') return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor"><path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.58.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1A17 17 0 0 1 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.46.57 3.58.12.35.03.75-.24 1.02l-2.23 2.2Z"/></svg>';
  return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 1.6.9 3.4 2 5 .9 1.3 2 2.6 2.5 4 .2.6.5 1 .9 1.3.4.3.9.4 1.6.4s1.2-.1 1.6-.4c.4-.3.7-.7.9-1.3.5-1.4 1.6-2.7 2.5-4 1.1-1.6 2-3.4 2-5a7 7 0 0 0-7-7Zm0 4.5A2.5 2.5 0 1 1 12 11.5 2.5 2.5 0 0 1 12 6.5Z"/></svg>';
}

function renderFabs(cfg, fabs) {
  const list = (fabs && fabs.length ? fabs : [
    { kind: 'call', label: 'Call Clinic', value: cfg.call_link, device_visibility: 'all' },
    { kind: 'whatsapp', label: 'WhatsApp Clinic', value: cfg.whatsapp_link, device_visibility: 'all' }
  ]);

  const right = el(`<div class="fab-stack fab-stack--right" aria-label="Quick contact"></div>`);
  list.forEach((c) => {
    if (c.kind === 'feedback') return; // feedback rendered on the left
    const dv = c.device_visibility || 'all';
    let href = c.value || '';
    if (c.kind === 'whatsapp' && c.whatsapp_text && href.indexOf('?text=') === -1) {
      href += (href.indexOf('?') === -1 ? '?' : '&') + 'text=' + encodeURIComponent(c.whatsapp_text);
    }
    const a = el(`<a class="fab fab--${c.kind} dv-${dv}" href="${href || '#'}" ${c.kind === 'whatsapp' ? 'target="_blank" rel="noopener"' : ''} aria-label="${c.label}" title="${c.label}">${fabIcon(c.kind)}</a>`);
    a.addEventListener('click', () => {
      if (c.kind === 'call') analytics.callClick('fab');
      else if (c.kind === 'whatsapp') analytics.whatsappClick('fab');
    });
    right.appendChild(a);
  });

  // Enquire / feedback button on the left (kept for the feedback modal hook).
  const enquire = list.find((c) => c.kind === 'feedback');
  const left = el(`
    <div class="fab-stack fab-stack--left">
      <button class="fab fab--feedback" id="open-feedback" aria-label="${enquire ? enquire.label : 'Share feedback'}">★ ${enquire ? enquire.label : 'Feedback'}</button>
    </div>
  `);
  return [right, left];
}

export async function mountShell({ currentPath = location.pathname } = {}) {
  initAnalytics();
  const [cfgRes, navRes, socialRes, flagRes, fabRes] = await Promise.all([
    api.config(),
    api.navigation(),
    api.socialLinks ? api.socialLinks() : Promise.resolve({ data: [] }),
    api.featureFlags ? api.featureFlags() : Promise.resolve({ data: {} }),
    api.floatingCta ? api.floatingCta() : Promise.resolve({ data: [] })
  ]);
  const cfg = cfgRes.data;
  const nav = navRes.data;
  const social = (socialRes && socialRes.data) || [];
  const flags = (flagRes && flagRes.data) || {};
  const fabs = (fabRes && fabRes.data) || [];

  window.__JSNM__ = { cfg, social, flags, fabs };

  const root = document.body;
  root.prepend(renderEmergencyBar());
  root.children[0].after(renderHeader(cfg, nav, currentPath));
  root.appendChild(renderFooter(cfg, social, flags));
  if (flags.floating_cta_enabled !== false) {
    renderFabs(cfg, fabs).forEach((f) => root.appendChild(f));
  }

  document.dispatchEvent(new CustomEvent('jsnm:shell-ready', { detail: { cfg, social, flags, fabs } }));
  initUi();
  return cfg;
}
