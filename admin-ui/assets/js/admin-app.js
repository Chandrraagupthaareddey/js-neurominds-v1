/**
 * JS Neurominds V1 — admin-ui/assets/js/admin-app.js
 * Admin SPA bootstrap + router. Login view (Google Identity Services) →
 * portal shell with a role-filtered sidebar. Section modules render into the
 * content area.
 *
 * Audit changes (Batch A):
 *   JP-031 — preview-mode bypass, env-driven mock login and the in-app role
 *            switcher were removed. A developer picker exists only under the
 *            Vite dev server (dev-login.js, dynamically imported behind
 *            import.meta.env.DEV, excluded from production builds).
 *   JP-001 / JP-029 — API failures are typed (ApiError) and rendered with
 *            specific, actionable copy instead of a TypeError message.
 */
import { CONFIG } from './config.js';
import { signInWithGoogleProfile, signOut, getSession, allowedSections } from './auth.js';
import { api } from './api.js';
import { describeApiError } from './api-envelope.js';
import { renderDashboard } from './dashboard.js';
import { renderCallbackDesk } from './callback-desk.js';
import { renderLabDesk } from './lab-desk.js';
import { renderContentReview } from './content-review.js';
import { renderDoctors } from './doctors.js';
import { renderServices } from './services.js';
import { renderSeo } from './seo.js';
import { renderSystemHealth } from './system-health.js';
import { renderRunbook } from './runbook.js';
import { renderSimple } from './sections-misc.js';
import {
  renderSocialLinks, renderFooterSettings, renderBrandSettings, renderNavigation,
  renderFeatureFlags, renderTestimonialsAdmin, renderReviewsAdmin
} from './website-content.js';

const root = () => document.getElementById('app-root');

const SECTIONS = {
  dashboard: { label: 'Dashboard', icon: '▦', group: 'Overview', render: renderDashboard },
  booking:   { label: 'Booking', icon: '◷', group: 'Operations', render: (e) => renderSimple(e, 'booking') },
  callback:  { label: 'Callback Desk', icon: '☎', group: 'Operations', render: renderCallbackDesk, countKey: 'callbacks_new' },
  lab:       { label: 'Lab Requests', icon: '⚗', group: 'Operations', render: renderLabDesk, countKey: 'lab_new' },
  feedback:  { label: 'Feedback', icon: '★', group: 'Operations', render: (e) => renderSimple(e, 'feedback') },
  marketing: { label: 'Marketing', icon: '📈', group: 'Insights', render: (e) => renderSimple(e, 'marketing') },
  seo:       { label: 'SEO', icon: '⌖', group: 'Insights', render: renderSeo },
  content:   { label: 'Content Review', icon: '✎', group: 'Content', render: renderContentReview },
  doctors:   { label: 'Doctors', icon: '⚕', group: 'Content', render: renderDoctors },
  services:  { label: 'Services & Lab', icon: '⚙', group: 'Content', render: renderServices },
  media:     { label: 'Media Library', icon: '⊞', group: 'Content', render: (e) => renderSimple(e, 'media') },
  testimonials: { label: 'Testimonials', icon: '“', group: 'Website', render: renderTestimonialsAdmin },
  reviews:   { label: 'Google Reviews', icon: '★', group: 'Website', render: renderReviewsAdmin },
  navigation:{ label: 'Navigation', icon: '☰', group: 'Website', render: renderNavigation },
  social:    { label: 'Social Links', icon: '🔗', group: 'Website', render: renderSocialLinks },
  footer:    { label: 'Footer Settings', icon: '▭', group: 'Website', render: renderFooterSettings },
  brand:     { label: 'Brand Settings', icon: '◈', group: 'Website', render: renderBrandSettings },
  flags:     { label: 'Feature Flags', icon: '⚑', group: 'Website', render: renderFeatureFlags },
  health:    { label: 'System Health', icon: '♥', group: 'System', render: renderSystemHealth },
  backup:    { label: 'Backup Registry', icon: '⛁', group: 'System', render: (e) => renderSimple(e, 'backup') },
  settings:  { label: 'Settings', icon: '⚙', group: 'System', render: (e) => renderSimple(e, 'settings') },
  runbook:   { label: 'Runbook', icon: '📖', group: 'Help', render: renderRunbook }
};
const GROUP_ORDER = ['Overview', 'Operations', 'Insights', 'Content', 'Website', 'System', 'Help'];

let currentSection = 'dashboard';
let navCounts = {};

export function boot() {
  // SECURITY GATE: in deployed envs without configured Google OAuth, do not
  // render the dashboard, navigation, or any admin data. There is no preview
  // or environment-variable bypass of this gate (JP-031).
  if (CONFIG.AUTH_DISABLED) { renderAuthDisabled(); return; }
  const session = getSession();
  if (!session) renderLogin();
  else renderShell();
}

/* Safe lockout screen — shown when mock login is not allowed and OAuth is not
   yet configured (e.g. demo/production before Phase 2 auth is wired). */
function renderAuthDisabled() {
  root().innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="brand__mark"><img src="/assets/brand/logo.png" alt="JS Neurominds" width="52" height="52" /></div>
        <h2>JS Neurominds</h2>
        <p class="muted" style="margin-top:0">Admin Portal</p>
        <div class="access-denied" style="margin-top:1.5rem">
          <strong>Admin access is restricted.</strong><br>
          Google authentication will be enabled before live admin use.
        </div>
      </div>
    </div>`;
}

/* ---------------- Login ---------------- */
async function renderLogin(denied) {
  // Real Google OAuth path (VITE_GOOGLE_CLIENT_ID set).
  if (CONFIG.OAUTH_CONFIGURED) { renderOAuthLogin(denied); return; }

  // Developer sign-in: dev server only. `import.meta.env.DEV` is a build-time
  // constant, so this branch and the dynamically imported module are removed
  // from every `vite build` output. Not reachable via any environment variable.
  if (import.meta.env.DEV && CONFIG.DEV_LOGIN_ALLOWED) {
    const { renderDevLogin } = await import('./dev-login.js');
    renderDevLogin(root(), { onSignedIn: renderShell, denied });
    return;
  }
  renderAuthDisabled();
}

/* Real Google OAuth login — Google Identity Services (GIS).
   Loads accounts.google.com/gsi/client, renders Google's official button,
   decodes the returned ID token client-side, enforces the email allowlist,
   and creates the standard session. Server-side token verification in GAS is
   the planned hardening step before trusting writes from untrusted clients. */

function decodeJwt(token) {
  try {
    const payload = String(token).split('.')[1];
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

let gisLoading = null;
function loadGis() {
  if (window.google && window.google.accounts) return Promise.resolve();
  if (gisLoading) return gisLoading;
  gisLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = res;
    s.onerror = () => rej(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
  return gisLoading;
}

function showLoginError(msg) {
  const box = document.getElementById('login-error');
  if (box) { box.style.display = 'block'; box.innerHTML = msg; }
}

function onGoogleCredential(response) {
  const profile = decodeJwt(response && response.credential);
  if (!profile || !profile.email) {
    showLoginError('<strong>Sign-in failed.</strong> Could not read the Google account. Please try again.');
    return;
  }
  const res = signInWithGoogleProfile(
    { email: profile.email, name: profile.name, picture: profile.picture },
    CONFIG.ALLOWED_ADMIN_EMAILS
  );
  if (res.ok) renderShell();
  else showLoginError(`<strong>Access denied.</strong> <b>${res.email}</b> is not on the authorized admin list.`);
}

async function initGoogleSignIn() {
  try {
    await loadGis();
    window.google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: onGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true
    });
    const slot = document.getElementById('g-signin');
    if (slot) {
      window.google.accounts.id.renderButton(slot, {
        type: 'standard', theme: 'outline', size: 'large',
        text: 'signin_with', shape: 'pill', logo_alignment: 'left', width: 280
      });
    }
    window.google.accounts.id.prompt(); // One Tap where available
  } catch (e) {
    showLoginError('<strong>Could not load Google sign-in.</strong> Check the network and reload.');
  }
}

function renderOAuthLogin(denied) {
  root().innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="brand__mark"><img src="/assets/brand/logo.png" alt="JS Neurominds" width="52" height="52" /></div>
        <h2>JS Neurominds</h2>
        <p class="muted" style="margin-top:0">Admin Portal · sign in with Google</p>
        <div id="g-signin" style="margin-top:1.5rem; display:flex; justify-content:center"></div>
        <p class="muted" style="font-size:12px; margin-top:1rem">Only authorized clinic accounts can access this portal.</p>
        <div class="access-denied" id="login-error" style="display:${denied ? 'block' : 'none'}">
          ${denied ? `<strong>Access denied.</strong> <b>${denied}</b> is not authorized.` : ''}
        </div>
      </div>
    </div>`;
  initGoogleSignIn();
}

/* ---------------- Shell ---------------- */
async function renderShell() {
  const session = getSession();
  let sections = allowedSections();
  if (!sections.includes(currentSection)) currentSection = 'dashboard';

  // fetch nav counts (new callbacks / lab) for badges; a failing backend must
  // not prevent the shell from rendering (the section view explains the error).
  try { const d = await api.dashboard(); navCounts = (d.data && d.data.kpis) || {}; } catch (e) { navCounts = {}; }

  root().innerHTML = `
    <div class="app">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar__brand">
          <span class="mk"><img src="/assets/brand/logo.png" alt="JS Neurominds" width="38" height="38" /></span>
          <span><b>JS Neurominds</b><span>Admin Portal</span></span>
        </div>
        <nav id="nav">${renderNav(sections)}</nav>
      </aside>
      <div class="main">
        <header class="topbar">
          <div class="flex center gap">
            <button class="menu-btn" id="menu-btn" aria-label="Toggle menu">☰</button>
            <h1 id="section-title">${SECTIONS[currentSection].label}</h1>
          </div>
          <div class="topbar__right">
            <div class="pwens-links" title="PWeNS booking partner">
              <a class="btn btn--ghost btn--sm" href="${CONFIG.PWENS_PUBLIC_BOOKING_URL}" target="_blank" rel="noopener">PWeNS Booking</a>
              <a class="btn btn--ghost btn--sm" href="${CONFIG.PWENS_LOGIN_URL}" target="_blank" rel="noopener">PWeNS Login</a>
            </div>
            <span class="userchip">
              <span class="userchip__avatar">${initials(session.name)}</span>
              <span>${session.name}</span>
            </span>
            <button class="btn btn--ghost btn--sm" id="signout-btn">Sign out</button>
          </div>
        </header>
        <main class="content" id="content"></main>
      </div>
    </div>
    <div class="drawer-backdrop" id="drawer-backdrop"></div>`;

  bindNav();
  document.getElementById('signout-btn').addEventListener('click', () => { signOut(); boot(); });
  document.getElementById('menu-btn').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  renderSection(currentSection);
}

function renderNav(sections) {
  const groups = {}; GROUP_ORDER.forEach((g) => (groups[g] = []));
  sections.forEach((key) => { const s = SECTIONS[key]; if (s) groups[s.group].push({ key, ...s }); });
  return GROUP_ORDER.filter((g) => groups[g].length).map((g) => `
    <div class="nav-group">
      <div class="nav-group__label">${g}</div>
      ${groups[g].map((s) => {
        const count = s.countKey && navCounts[s.countKey] ? `<span class="count">${navCounts[s.countKey]}</span>` : '';
        return `<div class="nav-item ${s.key === currentSection ? 'active' : ''}" data-section="${s.key}">
          <span class="ico">${s.icon}</span><span>${s.label}</span>${count}
        </div>`;
      }).join('')}
    </div>`).join('');
}

function bindNav() {
  document.querySelectorAll('.nav-item[data-section]').forEach((item) => {
    item.addEventListener('click', () => {
      const key = item.dataset.section;
      if (key === currentSection) return;
      currentSection = key;
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.section === key));
      document.getElementById('section-title').textContent = SECTIONS[key].label;
      document.getElementById('sidebar').classList.remove('open');
      renderSection(key);
    });
  });
}

async function renderSection(key) {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="panel"><div class="panel__body">
    <div class="skeleton skeleton--line w60"></div><div class="skeleton skeleton--line w80"></div><div class="skeleton skeleton--line"></div>
  </div></div>`;
  try { await SECTIONS[key].render(content); }
  catch (err) {
    console.error('[admin] section failed:', key, err);
    content.innerHTML = renderSectionError(err);
  }
}

/** Specific, non-technical error panel for a failed section (JP-001/JP-029). */
export function renderSectionError(err) {
  const d = describeApiError(err);
  return `<div class="panel"><div class="panel__body">
    <span class="badge error">Error</span>
    <h3 style="margin:.75rem 0 .25rem">${escapeHtml(d.title)}</h3>
    <p style="margin:0">${escapeHtml(d.body)}</p>
    <p class="muted" style="font-size:12px;margin-top:.75rem">Code: ${escapeHtml(d.code)}</p>
  </div></div>`;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}

function initials(name) {
  return String(name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

/* Shared drawer helper for detail views */
export function openDrawer(title, bodyHtml, footHtml) {
  closeDrawer();
  const backdrop = document.getElementById('drawer-backdrop');
  const drawer = document.createElement('aside');
  drawer.className = 'drawer'; drawer.id = 'drawer';
  drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true');
  drawer.innerHTML = `
    <div class="drawer__head"><h3>${title}</h3><button class="drawer__close" id="drawer-close" aria-label="Close">✕</button></div>
    <div class="drawer__body">${bodyHtml}</div>
    ${footHtml ? `<div class="drawer__foot">${footHtml}</div>` : ''}`;
  document.body.appendChild(drawer);
  requestAnimationFrame(() => { backdrop.classList.add('open'); drawer.classList.add('open'); });
  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer, { once: true });
  document.addEventListener('keydown', escClose);
  return drawer;
}
function escClose(e) { if (e.key === 'Escape') closeDrawer(); }
export function closeDrawer() {
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  if (backdrop) backdrop.classList.remove('open');
  if (drawer) { drawer.classList.remove('open'); setTimeout(() => drawer.remove(), 300); }
  document.removeEventListener('keydown', escClose);
}
