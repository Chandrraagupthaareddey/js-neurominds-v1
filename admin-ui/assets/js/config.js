/**
 * JS Neurominds V1 — admin-ui/assets/js/config.js
 * Environment-aware admin config + authentication gate.
 *
 * Modes:
 *   VITE_API_MODE = mock -> local RBAC simulator + mock CMS data
 *   VITE_API_MODE = live -> call the GAS Admin CMS at VITE_ADMIN_API_URL
 *
 * AUTH GATE (security):
 *   AUTH_MODE = mock        -> email-picker login (LOCAL/DEV ONLY)
 *   AUTH_MODE = production  -> mock login disabled; real Google OAuth required
 *
 * Environment detection: localhost | dev | demo | production.
 * Mock login is permitted ONLY on localhost or dev. On demo/production the
 * email-picker must NOT grant access; until Google OAuth is configured the UI
 * shows a safe "access temporarily disabled" message and renders no dashboard.
 *
 * Phase 2 will implement: Google Sign-In -> ID token -> GAS verification ->
 * Users sheet lookup -> role assignment -> secure session. See docs/ADMIN_AUTH.md.
 */
import { GA4, BIGQUERY } from '../../../shared/constants.js';

const env = import.meta.env || {};
const host = location.hostname;
const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(host);

// --- Environment detection (explicit VITE_ENV wins; else infer from hostname) ---
function detectEnv() {
  const explicit = (env.VITE_ENV || '').toLowerCase();
  if (explicit) return explicit;
  if (isLocalhost) return 'local';
  if (/(^|\.)dev\./.test(host) || host.startsWith('dev-')) return 'dev';
  if (host.includes('demo')) return 'demo';
  return 'production';
}
const ENV = detectEnv();

const API_MODE = (env.VITE_API_MODE || (isLocalhost ? 'mock' : 'live')).toLowerCase();

// --- Auth mode + gate ---
// Default AUTH_MODE: mock on local/dev, production everywhere else.
const AUTH_MODE = (env.VITE_AUTH_MODE || (['local', 'dev'].includes(ENV) ? 'mock' : 'production')).toLowerCase();

// Mock login (email picker) is only ever allowed in local/dev with AUTH_MODE=mock.
const MOCK_LOGIN_ALLOWED = AUTH_MODE === 'mock' && ['local', 'dev'].includes(ENV);

// Real Google OAuth client id (set in deployed envs once configured in Phase 2).
const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID || '';

// In a deployed env with production auth but no OAuth configured yet, access is
// disabled (no dashboard, no data) and a safe message is shown.
const OAUTH_CONFIGURED = !!GOOGLE_CLIENT_ID;
const AUTH_DISABLED = !MOCK_LOGIN_ALLOWED && !OAUTH_CONFIGURED;

export const CONFIG = {
  API_MODE,
  ENV,
  AUTH_MODE,
  MOCK_LOGIN_ALLOWED,
  OAUTH_CONFIGURED,
  AUTH_DISABLED,
  GOOGLE_CLIENT_ID,
  USE_MOCK: API_MODE === 'mock',
  ADMIN_API_URL: env.VITE_ADMIN_API_URL || '',
  GA4_PROPERTY_ID: GA4.PROPERTY_ID,
  BIGQUERY_STATUS: BIGQUERY.STATUS,
  // PWeNS quick links for admin (public booking vs internal login).
  PWENS_PUBLIC_BOOKING_URL: 'https://jsneurominds.pwens.com/waselffollowuppage',
  PWENS_LOGIN_URL: 'https://jsneurominds.pwens.com/'
};

if (ENV === 'local') {
  console.info(`[JSNM] admin-ui · mode=${API_MODE} · env=${ENV} · auth=${AUTH_MODE} · mockLogin=${MOCK_LOGIN_ALLOWED}`);
}
