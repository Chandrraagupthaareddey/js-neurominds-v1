/**
 * JS Neurominds V1 — admin-ui/assets/js/api.js
 * Admin API surface. Routes to the local mock (RBAC simulator + mock CMS data)
 * or the deployed GAS Admin CMS. In live mode every call carries the action so
 * the GAS AdminRouter can dispatch and re-check the caller's role server-side.
 *
 * Every method is wrapped (api-envelope.js) so callers only ever receive a
 * { success:true, data } envelope; anything else throws ApiError (JP-001/JP-029).
 */
import { CONFIG } from './config.js';
import { adminApi as mock } from './mock-api.js';
import { wrapApi, ApiError } from './api-envelope.js';

async function realPost(action, payload = {}) {
  if (!CONFIG.ADMIN_API_URL) {
    throw new ApiError('Admin API URL is not configured for this build.', { code: 'NOT_CONFIGURED', action });
  }
  const res = await fetch(CONFIG.ADMIN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload })
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch (e) {
    throw new ApiError(`Non-JSON response (HTTP ${res.status}).`, { code: res.ok ? 'BAD_RESPONSE' : 'HTTP_ERROR', action, status: res.status });
  }
  if (!res.ok && (json == null || typeof json !== 'object')) {
    throw new ApiError(`HTTP ${res.status}`, { code: 'HTTP_ERROR', action, status: res.status });
  }
  return json;
}

const live = {
  config: () => realPost('config'),
  dashboard: () => realPost('dashboard'),
  callbacks: () => realPost('callbacks'),
  callbackChecklist: () => realPost('callbackChecklist'),
  callbackQuestions: () => realPost('callbackQuestions'),
  updateCallbackStatus: (id, status, note) => realPost('updateCallbackStatus', { id, status, note }),
  callbackHistory: (id) => realPost('callbackHistory', { id }),
  labRequests: () => realPost('labRequests'),
  updateLabStatus: (id, status) => realPost('updateLabStatus', { id, status }),
  content: () => realPost('content'),
  saveContentDraft: (tab, keyCol, keyVal, fields) => realPost('saveContentDraft', { tab, keyCol, keyVal, fields }),
  submitContentForReview: (tab, keyCol, keyVal) => realPost('submitContentForReview', { tab, keyCol, keyVal }),
  requestContentChanges: (tab, keyCol, keyVal) => realPost('requestContentChanges', { tab, keyCol, keyVal }),
  publishContent: (tab, keyCol, keyVal) => realPost('publishContent', { tab, keyCol, keyVal }),
  doctors: () => realPost('doctors'),
  feedback: () => realPost('feedback'),
  updateFeedbackStatus: (id, status) => realPost('updateFeedbackStatus', { id, status }),
  health: () => realPost('health'),
  publishHistory: () => realPost('publishHistory'),
  users: () => realPost('users'),
  syncContent: () => realPost('syncContent'),
  socialLinks: () => realPost('socialLinks'),
  testimonials: () => realPost('testimonials'),
  googleReviews: () => realPost('googleReviews'),
  featureFlags: () => realPost('featureFlags'),
  floatingCta: () => realPost('floatingCta'),
  navigationItems: () => realPost('navigationItems'),
  brandSettings: () => realPost('brandSettings'),
  footerSettings: () => realPost('footerSettings')
};

export const api = wrapApi(CONFIG.USE_MOCK ? mock : live);
