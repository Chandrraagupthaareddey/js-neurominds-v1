/**
 * JS Neurominds V1 — admin-ui/assets/js/config.js
 * Simple, production-first admin config.
 *
 * Access rule (kept intentionally simple for a small clinic):
 *   - Real Google OAuth (VITE_GOOGLE_CLIENT_ID set)  -> Google sign-in.
 *   - Otherwise                                       -> clean restricted-access page.
 *
 * The simulated email-picker login is DEVELOPER-ONLY and never appears unless a
 * developer explicitly opts in with VITE_ENABLE_MOCK_LOGIN=true on their own
 * machine. It is OFF for every build and every preview (including prod:admin),
 * so demo/production never expose a fake login or role switcher.
 *
 * Phase 2 wires the real flow: Google Sign-In -> ID token -> GAS verification ->
 * Users sheet lookup -> role -> secure session.
 */
import { GA4, BIGQUERY } from '../../../shared/constants.js';

const env = import.meta.env || {};

const API_MODE = (env.VITE_API_MODE || 'mock').toLowerCase();

// Real Google OAuth client id — set once configured (before live use).
const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID || '';
const OAUTH_CONFIGURED = !!GOOGLE_CLIENT_ID;

// PREVIEW MODE: highest-priority access mode. When VITE_ADMIN_PREVIEW=true the
// admin bypasses ONLY the authentication gate and loads the real dashboard with
// full functionality (create/update/delete/publish/save all intact). Routing,
// sections, and RBAC behave exactly as production. Set to false + configure
// VITE_GOOGLE_CLIENT_ID to switch to real Google OAuth — no code change needed.
const PREVIEW = String(env.VITE_ADMIN_PREVIEW) === 'true';

// Developer-only escape hatch (legacy dev picker). Never set in committed env.
const MOCK_LOGIN_ALLOWED = String(env.VITE_ENABLE_MOCK_LOGIN) === 'true' && !PREVIEW && !OAUTH_CONFIGURED;

// The portal is restricted (clean access page, no dashboard, no data) ONLY when
// none of: preview mode, real OAuth, or the dev opt-in is present.
const AUTH_DISABLED = !PREVIEW && !OAUTH_CONFIGURED && !MOCK_LOGIN_ALLOWED;

export const CONFIG = {
  API_MODE,
  USE_MOCK: API_MODE === 'mock',
  PREVIEW,
  GOOGLE_CLIENT_ID,
  OAUTH_CONFIGURED,
  MOCK_LOGIN_ALLOWED,
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
