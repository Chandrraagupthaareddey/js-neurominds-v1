/**
 * JS Neurominds V1 — public-site/assets/js/app.js
 * Shared site shell. Renders header, nav, footer, floating action buttons,
 * and the emergency bar from API config — so contact details and navigation
 * stay editable from the Admin CMS with no code change.
 */
import { api } from './api.js';
import { initAnalytics, analytics } from './analytics.js';
import { initUi } from './ui.js';

const $ = (sel, root = document) => root.querySelector(sel);

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

function navHref(route) {
  return route === '/' ? '/index.html' : route + '.html';
}

function renderHeader(cfg, nav, currentPath) {
  const links = nav.map((n) =>
    `<a href="${navHref(n.route)}"${isCurrent(n.route, currentPath) ? ' aria-current="page"' : ''}>${n.label}</a>`
  ).join('');

  const header = el(`
    <header class="site-header">
      <div class="container">
        <a class="brand" href="/index.html" aria-label="${cfg.clinic_name} home">
          <span class="brand__mark" aria-hidden="true"></span>
          <span class="brand__name">${cfg.clinic_short}<span>Psychiatry &amp; Diagnostics</span></span>
        </a>
        <nav class="nav" aria-label="Primary">
          ${links}
          <a class="btn btn--primary nav__cta" href="/booking.html">Book now</a>
        </nav>
        <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">☰</button>
      </div>
      <nav class="mobile-nav" aria-label="Mobile">
        ${links}
        <a class="btn btn--primary btn--block" href="/booking.html">Book now</a>
      </nav>
    </header>
  `);

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

function renderFooter(cfg) {
  return el(`
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="brand" href="/index.html" style="margin-bottom:var(--sp-4)">
              <span class="brand__mark" aria-hidden="true"></span>
              <span class="brand__name">${cfg.clinic_short}<span>Psychiatry &amp; Diagnostics</span></span>
            </a>
            <p class="footer-contact">${cfg.address}</p>
            <p class="footer-contact">Phone: <a href="${cfg.call_link}">${cfg.display_phone}</a></p>
          </div>
          <div>
            <h4>Care</h4>
            <ul class="footer-links">
              <li><a href="/doctors.html">Doctors</a></li>
              <li><a href="/conditions.html">Conditions</a></li>
              <li><a href="/treatments.html">Treatments</a></li>
              <li><a href="/lab.html">Lab Tests</a></li>
            </ul>
          </div>
          <div>
            <h4>Clinic</h4>
            <ul class="footer-links">
              <li><a href="/about.html">About</a></li>
              <li><a href="/booking.html">Book</a></li>
              <li><a href="/contact.html">Contact</a></li>
              <li><a href="/faq.html">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4>Get started</h4>
            <p class="footer-contact">Request a private call back or book a confirmed appointment online.</p>
            <a class="btn btn--ghost" href="/booking.html" style="border-color:rgba(255,255,255,.3);color:#fff">Book now</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ${cfg.clinic_name}. All rights reserved.</span>
          <span>${cfg.footer}</span>
        </div>
      </div>
    </footer>
  `);
}

function renderFabs(cfg) {
  const right = el(`
    <div class="fab-stack fab-stack--right" aria-label="Quick contact">
      <a class="fab fab--call" href="${cfg.call_link}" aria-label="Call the clinic" title="Call">📞</a>
      <a class="fab fab--whatsapp" href="${cfg.whatsapp_link}" target="_blank" rel="noopener" aria-label="WhatsApp the clinic" title="WhatsApp">💬</a>
    </div>
  `);
  $('.fab--call', right).addEventListener('click', () => analytics.callClick('fab'));
  $('.fab--whatsapp', right).addEventListener('click', () => analytics.whatsappClick('fab'));

  const left = el(`
    <div class="fab-stack fab-stack--left">
      <button class="fab fab--feedback" id="open-feedback" aria-label="Share feedback">★ Feedback</button>
    </div>
  `);
  return [right, left];
}

export async function mountShell({ currentPath = location.pathname } = {}) {
  initAnalytics();
  const [cfgRes, navRes] = await Promise.all([api.config(), api.navigation()]);
  const cfg = cfgRes.data;
  const nav = navRes.data;

  window.__JSNM__ = { cfg };

  const root = document.body;
  root.prepend(renderEmergencyBar());
  root.children[0].after(renderHeader(cfg, nav, currentPath));
  root.appendChild(renderFooter(cfg));
  renderFabs(cfg).forEach((f) => root.appendChild(f));

  document.dispatchEvent(new CustomEvent('jsnm:shell-ready', { detail: { cfg } }));
  initUi();
  return cfg;
}
