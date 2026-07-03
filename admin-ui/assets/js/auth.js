/**
 * JS Neurominds V1 — admin-ui/assets/js/auth.js
 * Local auth + RBAC simulator. In production, GAS validates
 * Session.getActiveUser().getEmail() against the Users tab and enforces roles
 * on every request. Here we simulate that flow so the UI is fully testable:
 *   - "Sign in with Google" lets you pick a known user (or an unknown one to
 *     see the Access Denied screen).
 *   - The role determines which sections and actions are available.
 */
import { MOCK_USERS } from '../../../shared/mock-public-content.js';

// Role -> allowed section keys. Mirrors Role_Permissions in the CMS.
export const ROLE_SECTIONS = {
  super_admin: ['dashboard','booking','callback','lab','marketing','seo','content','doctors','services','media','testimonials','reviews','navigation','social','footer','brand','flags','feedback','health','backup','settings','runbook'],
  admin:       ['dashboard','booking','callback','lab','seo','content','doctors','services','media','testimonials','reviews','navigation','social','footer','brand','flags','feedback','health','runbook'],
  lab_team:    ['dashboard','lab','runbook'],
  content_editor: ['dashboard','content','testimonials','runbook'],
  marketing:   ['dashboard','marketing','seo','testimonials','reviews','social','runbook']
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin', admin: 'Admin', lab_team: 'Lab Team',
  content_editor: 'Content Editor', marketing: 'Marketing'
};

// Actions gated beyond section visibility (write/destructive).
export const ROLE_ACTIONS = {
  super_admin: new Set(['publish','sync','manage_users','delete','edit_settings','close_request','edit_content']),
  admin:       new Set(['publish','sync','close_request','edit_content']),
  lab_team:    new Set(['update_lab']),
  content_editor: new Set(['edit_content']),
  marketing:   new Set([])
};

const SESSION_KEY = '__jsnm_admin_session__';
let session = null; // in-memory only; no browser storage used

export function getSession() { return session; }

export function signInAs(email) {
  const user = MOCK_USERS.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.status !== 'active') {
    return { ok: false, email, reason: 'not_authorized' };
  }
  session = { email: user.email, name: user.name, role: user.role_key };
  return { ok: true, session };
}

export function signOut() { session = null; }

/**
 * Real Google Identity Services sign-in. Receives the decoded Google profile
 * ({email, name, picture}) and the configured allowlist. Enforces the
 * allowlist, maps role (first allowed email -> super_admin, others -> admin,
 * unless a matching Users entry says otherwise), and creates the SAME session
 * shape as signInAs() so the rest of the admin is untouched.
 */
export function signInWithGoogleProfile(profile, allowedEmails = []) {
  const email = String(profile && profile.email || '').trim().toLowerCase();
  if (!email) return { ok: false, email: '', reason: 'no_email' };

  const allowed = allowedEmails.map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  if (!allowed.length || allowed.indexOf(email) === -1) {
    return { ok: false, email, reason: 'not_authorized' };
  }

  // Prefer the Users entry when present (keeps curated names/roles)...
  const known = MOCK_USERS.find((u) => u.email.toLowerCase() === email && u.status === 'active');
  if (known) {
    session = { email: known.email, name: known.name, role: known.role_key, google: true };
    return { ok: true, session };
  }

  // ...else build the session from the verified Google profile directly.
  const role = allowed[0] === email ? 'super_admin' : 'admin';
  session = {
    email,
    name: (profile.name || email.split('@')[0]),
    role,
    picture: profile.picture || '',
    google: true
  };
  return { ok: true, session };
}

/**
 * Preview Mode session. Seeds a real super_admin session so the existing shell,
 * RBAC, and all CRUD/publish actions work identically to production — the ONLY
 * difference is that no credential was verified. Used when VITE_ADMIN_PREVIEW=true.
 * Reuses the same session shape as signInAs(); no duplicated logic.
 */
export function startPreviewSession() {
  const preferred = MOCK_USERS.find((u) => u.role_key === 'super_admin' && u.status === 'active')
    || MOCK_USERS.find((u) => u.status === 'active');
  session = preferred
    ? { email: preferred.email, name: preferred.name, role: preferred.role_key, preview: true }
    : { email: 'preview@jsneurominds', name: 'Preview Admin', role: 'super_admin', preview: true };
  return session;
}

/** RBAC simulator: change the current session's role in place (local only). */
export function setRole(roleKey) {
  if (session && ROLE_SECTIONS[roleKey]) {
    session.role = roleKey;
  }
  return session;
}

export function can(action) {
  if (!session) return false;
  return (ROLE_ACTIONS[session.role] || new Set()).has(action);
}

export function allowedSections() {
  if (!session) return [];
  return ROLE_SECTIONS[session.role] || [];
}

export function knownUsers() { return MOCK_USERS; }
