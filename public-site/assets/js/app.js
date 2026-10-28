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
import { emergencyBarHtml, headerHtml, footerHtml, fabsHtml } from '../../../shared/shell.js';

const $ = (sel, root = document) => root.querySelector(sel);

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

// Clean URLs: Cloudflare Pages (and Vite dev/preview) serve /about for about.html.

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

function wireThemeToggle(btn) {
  if (!btn || btn.dataset.wired) return;
  btn.dataset.wired = '1';
  const order = ['system', 'light', 'dark'];
  const icons = { system: '🖥', light: '☀', dark: '🌙' };
  const labels = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' };
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
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => { if (b !== btn) b.dispatchEvent(new CustomEvent('jsnm:repaint')); });
    paint();
  });
  btn.addEventListener('jsnm:repaint', paint);
}

/* ---------------- Shell: use the pre-rendered markup when present, else render it ---------------- */
function ensure(selector, html, place) {
  let node = document.querySelector(selector);
  if (node) return node;
  if (!html) return null;
  node = el(html);
  place(node);
  return node;
}

function wireHeader(header) {
  if (!header || header.dataset.wired) return;
  header.dataset.wired = '1';
  header.querySelectorAll('[data-theme-toggle]').forEach(wireThemeToggle);
  const toggle = $('.nav-toggle', header);
  const mobile = $('.mobile-nav', header);
  if (toggle && mobile) {
    toggle.addEventListener('click', () => {
      const open = mobile.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '✕' : '☰';
    });
  }
}

function wireFooter(footer) {
  if (!footer || footer.dataset.wired) return;
  footer.dataset.wired = '1';
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
  // Keep the copyright year current even on a cached build.
  const year = footer.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
}

function wireFabs() {
  document.querySelectorAll('.fab[data-fab]').forEach((a) => {
    if (a.dataset.wired) return;
    a.dataset.wired = '1';
    a.addEventListener('click', () => {
      const k = a.dataset.fab;
      if (k === 'call') analytics.callClick('fab');
      else if (k === 'whatsapp') analytics.whatsappClick('fab');
    });
  });
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
  // Pre-rendered by the build (scripts/lib/html-transform.js) on every page; the
  // fallbacks below only run for pages that were not built (e.g. raw dev files).
  const header = ensure('.site-header', headerHtml(cfg, nav, currentPath), (n) => root.prepend(n));
  if (flags.emergency_bar_enabled !== false) ensure('.emergency-bar', emergencyBarHtml(cfg), (n) => root.prepend(n));
  wireHeader(header);

  const footerEl = ensure('.site-footer', footerHtml(cfg, social, flags), (n) => root.appendChild(n));
  wireFooter(footerEl);

  if (flags.floating_cta_enabled !== false) {
    if (!document.querySelector('.fab-stack')) {
      const wrap = document.createElement('div');
      wrap.innerHTML = fabsHtml(cfg, fabs);
      Array.from(wrap.children).forEach((n) => root.appendChild(n));
    }
    wireFabs();
    // Mobile overlap guard: hide floating actions while the footer is on
    // screen (the footer carries its own CTAs). CSS scopes the effect to
    // small viewports, so desktop is unaffected.
    if ('IntersectionObserver' in window && footerEl) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => document.body.classList.toggle('footer-in-view', e.isIntersecting));
      }, { threshold: 0.05 });
      io.observe(footerEl);
    }
  }

  document.dispatchEvent(new CustomEvent('jsnm:shell-ready', { detail: { cfg, social, flags, fabs } }));
  initUi();
  return cfg;
}
