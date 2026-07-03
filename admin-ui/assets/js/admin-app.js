/**
 * JS Neurominds V1 — admin-ui/assets/js/admin-app.js
 * Admin SPA bootstrap + router. Login view (Google sign-in simulator) →
 * portal shell with a role-filtered sidebar. Includes an in-app role switcher
 * (RBAC simulator) and an environment indicator. Section modules render into
 * the content area.
 */
import { CONFIG } from './config.js';
import { signInAs, signOut, getSession, setRole, knownUsers, allowedSections, startPreviewSession } from './auth.js';
import { ROLE_LABELS, ROLES } from '../../../shared/permissions.js';
import { api } from './api.js';
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
  // PREVIEW MODE (VITE_ADMIN_PREVIEW=true): bypass ONLY the auth gate. Seed a
  // real super_admin session and load the existing dashboard with full
  // functionality. Routing/sections/RBAC are unchanged from production.
  if (CONFIG.PREVIEW) {
    if (!getSession()) startPreviewSession();
    renderShell();
    return;
  }
  // SECURITY GATE: in deployed envs without configured Google OAuth, do not
  // render the dashboard, navigation, or any admin data.
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
function renderLogin(denied) {
  // Real Google OAuth path (VITE_GOOGLE_CLIENT_ID set).
  if (CONFIG.OAUTH_CONFIGURED) { renderOAuthLogin(denied); return; }

  // Developer-only simulated sign-in. Reached ONLY when VITE_ENABLE_MOCK_LOGIN
  // === 'true' on a developer machine; never in a normal build or preview.
  const users = knownUsers();
  root().innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="brand__mark"><img src="/assets/brand/logo.png" alt="JS Neurominds" width="52" height="52" /></div>
        <h2>JS Neurominds</h2>
        <p class="muted" style="margin-top:0">Admin Portal</p>
        <div class="field" style="text-align:left; margin-top:1.25rem">
          <label for="login-email">Developer sign-in</label>
          <select id="login-email">
            ${users.map((u) => `<option value="${u.email}">${u.email} — ${ROLE_LABELS[u.role_key]}</option>`).join('')}
          </select>
        </div>
        <button class="google-btn" id="login-btn"><span class="google-g"></span> Continue</button>
        ${denied ? `<div class="access-denied"><strong>Access denied.</strong> <b>${denied}</b> is not authorized.</div>` : ''}
      </div>
    </div>`;
  document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const res = signInAs(email);
    if (res.ok) renderShell(); else renderLogin(res.email);
  });
}

/* Real Google OAuth login (Phase 2). The button placeholder is shown; the
   Google Identity Services flow + GAS ID-token verification land in Phase 2. */
function renderOAuthLogin(denied) {
  root().innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="brand__mark"><img src="/assets/brand/logo.png" alt="JS Neurominds" width="52" height="52" /></div>
        <h2>JS Neurominds</h2>
        <p class="muted" style="margin-top:0">Admin Portal · sign in with Google</p>
        <div id="g-signin" style="margin-top:1.5rem"></div>
        <button class="google-btn" id="login-btn"><span class="google-g"></span> Sign in with Google</button>
        <p class="muted" style="font-size:12px; margin-top:1rem">Only authorized clinic accounts can access this portal.</p>
        ${denied ? `<div class="access-denied"><strong>Access denied.</strong> <b>${denied}</b> is not authorized.</div>` : ''}
      </div>
    </div>`;
  // Phase 2: initialize Google Identity Services with CONFIG.GOOGLE_CLIENT_ID,
  // exchange the ID token with the GAS Admin CMS, and create a session.
  const btn = document.getElementById('login-btn');
  if (btn) btn.addEventListener('click', () => {
    alert('Google sign-in is configured server-side in Phase 2.');
  });
}

/* ---------------- Shell ---------------- */
async function renderShell() {
  const session = getSession();
  let sections = allowedSections();
  if (!sections.includes(currentSection)) currentSection = 'dashboard';

  // fetch nav counts (new callbacks / lab) for badges
  try { const d = await api.dashboard(); navCounts = d.data.kpis || {}; } catch (e) { navCounts = {}; }

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
            ${(CONFIG.MOCK_LOGIN_ALLOWED || CONFIG.PREVIEW) ? `
            <div class="role-switch" title="Preview access by role">
              <label for="role-sel">Role</label>
              <select id="role-sel">
                ${ROLES.map((r) => `<option value="${r}" ${r === session.role ? 'selected' : ''}>${ROLE_LABELS[r]}</option>`).join('')}
              </select>
            </div>` : ''}
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
  const roleSel = document.getElementById('role-sel');
  if (roleSel) roleSel.addEventListener('change', (e) => {
    setRole(e.target.value);
    renderShell(); // re-render with new permissions
  });
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
    console.error(err);
    content.innerHTML = `<div class="panel"><div class="panel__body"><span class="badge error">Error</span><p style="margin-top:.75rem">Could not load this section. ${err.message}</p></div></div>`;
  }
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
