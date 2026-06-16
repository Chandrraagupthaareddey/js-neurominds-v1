/**
 * JS Neurominds V1 — public-site/assets/js/config.js
 * Environment-aware runtime config. Reads Vite env vars (import.meta.env).
 *
 * Modes:
 *   VITE_API_MODE = mock  -> use shared mock content, no backend needed
 *   VITE_API_MODE = live  -> call the GAS Public API at VITE_PUBLIC_API_URL
 *   VITE_ENV      = local | dev | production
 *
 * Safe defaults: if nothing is set, localhost runs in mock mode so the site is
 * always testable without a backend. Production GAS URLs are never hardcoded.
 */
import { CLINIC, GA4 } from '../../../shared/constants.js';

const env = import.meta.env || {};
const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname);

const API_MODE = (env.VITE_API_MODE || (isLocalhost ? 'mock' : 'live')).toLowerCase();
const ENV = (env.VITE_ENV || (isLocalhost ? 'local' : 'production')).toLowerCase();

export const CONFIG = {
  API_MODE,
  ENV,
  USE_MOCK: API_MODE === 'mock',
  PUBLIC_API_URL: env.VITE_PUBLIC_API_URL || '',
  GA4_MEASUREMENT_ID: env.VITE_GA4_MEASUREMENT_ID || GA4.MEASUREMENT_ID,
  PWENS_BOOKING_URL: CLINIC.pwens_booking_url,
  CTA_PHONE: CLINIC.cta_phone,
  CALL_LINK: CLINIC.call_link,
  WHATSAPP_LINK: CLINIC.whatsapp_link
};

if (ENV === 'local') {
  console.info(`[JSNM] public-site · mode=${API_MODE} · env=${ENV}`);
}
