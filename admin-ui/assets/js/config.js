/**
 * JS Neurominds V1 — admin-ui/assets/js/config.js
 * Environment-aware admin config. Same mode model as the public site.
 *   VITE_API_MODE = mock -> local RBAC simulator + mock CMS data
 *   VITE_API_MODE = live -> call the GAS Admin CMS at VITE_ADMIN_API_URL
 */
import { GA4, BIGQUERY } from '../../../shared/constants.js';

const env = import.meta.env || {};
const isLocalhost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(location.hostname);

const API_MODE = (env.VITE_API_MODE || (isLocalhost ? 'mock' : 'live')).toLowerCase();
const ENV = (env.VITE_ENV || (isLocalhost ? 'local' : 'production')).toLowerCase();

export const CONFIG = {
  API_MODE,
  ENV,
  USE_MOCK: API_MODE === 'mock',
  ADMIN_API_URL: env.VITE_ADMIN_API_URL || '',
  GA4_PROPERTY_ID: GA4.PROPERTY_ID,
  BIGQUERY_STATUS: BIGQUERY.STATUS
};

if (ENV === 'local') {
  console.info(`[JSNM] admin-ui · mode=${API_MODE} · env=${ENV}`);
}
