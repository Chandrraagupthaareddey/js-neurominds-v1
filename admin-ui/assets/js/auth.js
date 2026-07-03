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
