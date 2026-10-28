/**
 * JS Neurominds V1 — admin-ui/assets/js/auth.js
 * Client-side session + RBAC gating for the admin UI.
 *
 * IMPORTANT (audit JP-007): this module only decides what the UI shows. It is
 * not a security boundary. The backend must verify identity and role on every
 * request; today the Apps Script backend cannot see the caller's identity at
 * all (JP-002), which is addressed by the Cloudflare Access migration.
 *
 * RBAC tables (audit JP-027): the role→section and role→action tables used to
 * be duplicated here and had drifted from shared/permissions.js. They are now
 * imported from the shared module, which is the single source of truth for
 * both the UI and the server.
 *
 * Removed (audit JP-031): startPreviewSession(), signInAs(), setRole() and
 * knownUsers() — the preview/mock bypass primitives. Developer sign-in now
 * lives in dev-login.js (dev server only) and goes through the same
 * signInWithGoogleProfile() allowlist path as the real flow.
 */
import { MOCK_USERS } from '../../../shared/mock-public-content.js';
import { ROLE_SECTIONS, ROLE_ACTIONS, ROLE_LABELS, roleCanDo } from '../../../shared/permissions.js';

export { ROLE_SECTIONS, ROLE_ACTIONS, ROLE_LABELS };

let session = null; // in-memory only; no browser storage used

export function getSession() { return session; }

export function signOut() { session = null; }

/**
 * Google Identity Services sign-in. Receives the decoded Google profile
 * ({email, name, picture}) and the configured allowlist. Enforces the
 * allowlist and maps the role (first allowed email -> super_admin, others ->
 * admin, unless a matching Users entry says otherwise).
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

  // ...else build the session from the Google profile directly.
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

export function can(action) {
  if (!session) return false;
  return roleCanDo(session.role, action);
}

export function allowedSections() {
  if (!session) return [];
  return ROLE_SECTIONS[session.role] || [];
}
