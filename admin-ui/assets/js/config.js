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

// Real Google OAuth client id — set once configured (Phase 2 / before live use).
const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID || '';
const OAUTH_CONFIGURED = !!GOOGLE_CLIENT_ID;

// Developer-only escape hatch. Must be the literal string 'true'. Never set in
// any committed env file, so every build/preview defaults to restricted access.
const MOCK_LOGIN_ALLOWED = String(env.VITE_ENABLE_MOCK_LOGIN) === 'true' && !OAUTH_CONFIGURED;

// When neither real OAuth nor the developer opt-in is present, the portal is
// restricted: it renders only the clean access page — no dashboard, no data.
const AUTH_DISABLED = !OAUTH_CONFIGURED && !MOCK_LOGIN_ALLOWED;

export const CONFIG = {
  API_MODE,
  USE_MOCK: API_MODE === 'mock',
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
