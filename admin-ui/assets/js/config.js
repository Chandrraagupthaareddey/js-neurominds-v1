/**
 * JS Neurominds V1 — admin-ui/assets/js/config.js
 * Simple, production-first admin config.
 *
 * Access rule (kept intentionally simple for a small clinic):
 *   - Real Google OAuth (VITE_GOOGLE_CLIENT_ID set)  -> Google sign-in.
 *   - Otherwise                                       -> clean restricted-access page.
 *
 * Authentication bypasses (audit JP-031):
 *   The former VITE_ADMIN_PREVIEW "preview mode" and the env-var-driven mock
 *   login have been REMOVED. Both could be switched on in any deployed build by
 *   setting an environment variable, which made them production-accessible.
 *
 *   The only remaining developer sign-in lives in dev-login.js and is reachable
 *   solely when `import.meta.env.DEV` is true, i.e. under the Vite dev server.
 *   `vite build` replaces that constant with `false`, so the code path (and the
 *   dynamically imported module) is excluded from every production bundle. It
 *   cannot be enabled by configuration. tests/ asserts this.
 *
 * NOTE: the Google ID token is still only decoded client-side; server-side
 * verification is the subject of the Cloudflare Access migration (JP-002/JP-007).
 */
import { GA4, BIGQUERY } from '../../../shared/constants.js';

const env = import.meta.env || {};

const API_MODE = (env.VITE_API_MODE || 'mock').toLowerCase();

// Real Google OAuth client id — set once configured (before live use).
const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID || '';
const OAUTH_CONFIGURED = !!GOOGLE_CLIENT_ID;

// Comma-separated allowlist of admin emails (VITE_ALLOWED_ADMIN_EMAILS).
// The first email in the list is granted super_admin; the rest are admin.
const ALLOWED_ADMIN_EMAILS = (env.VITE_ALLOWED_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Developer-only sign-in: dev server only (import.meta.env.DEV is a build-time
// constant), never when real OAuth is configured, and still opt-in per machine.
const DEV_LOGIN_ALLOWED = env.DEV === true
  && !OAUTH_CONFIGURED
  && String(env.VITE_ENABLE_MOCK_LOGIN) === 'true';

// The portal is restricted (clean access page, no dashboard, no data) unless
// real OAuth is configured or the dev-server-only sign-in applies.
const AUTH_DISABLED = !OAUTH_CONFIGURED && !DEV_LOGIN_ALLOWED;

export const CONFIG = {
  API_MODE,
  USE_MOCK: API_MODE === 'mock',
  GOOGLE_CLIENT_ID,
  OAUTH_CONFIGURED,
  ALLOWED_ADMIN_EMAILS,
  DEV_LOGIN_ALLOWED,
  AUTH_DISABLED,
  ADMIN_API_URL: env.VITE_ADMIN_API_URL || '',
  GA4_PROPERTY_ID: GA4.PROPERTY_ID,
  BIGQUERY_STATUS: BIGQUERY.STATUS,
  // Whether real analytics are wired. False -> show a clean "not connected" note
  // instead of any sample numbers.
  ANALYTICS_CONNECTED: String(env.VITE_ANALYTICS_CONNECTED) === 'true',
  PWENS_PUBLIC_BOOKING_URL: 'https://jsneurominds.pwens.com/waselffollowuppage',
  PWENS_LOGIN_URL: 'https://jsneurominds.pwens.com/'
};
