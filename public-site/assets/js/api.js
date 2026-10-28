/**
 * JS Neurominds V1 — public-site/assets/js/api.js
 * Single API surface for the public site.
 *
 *   READS  → always static (content bundled at build time from /content JSON,
 *            which the admin CMS edits). No network, no Apps Script, no Sheets.
 *   WRITES → the small Apps Script "forms" web app (email + Sheet log) when
 *            VITE_PUBLIC_API_URL is configured; otherwise an honest
 *            "unavailable" envelope so the UI never fakes a success.
 *
 * UI code never branches on environment — it only calls `api.*`.
 */
import { CONFIG } from './config.js';
import { contentApi } from './mock-api.js';
import { unavailableEnvelope } from './submission-status.js';

const hasWriteBackend = () =>
  !CONFIG.USE_MOCK && typeof CONFIG.PUBLIC_API_URL === 'string' && CONFIG.PUBLIC_API_URL.trim().length > 0;

async function realPost(action, payload) {
  // text/plain avoids a CORS preflight against the Apps Script endpoint.
  const res = await fetch(CONFIG.PUBLIC_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload })
  });
  return res.json();
}

const write = (action) => async (payload) =>
  hasWriteBackend() ? realPost(action, payload) : contentApi[action] ? contentApi[action](payload) : unavailableEnvelope();

export const api = {
  ...contentApi,
  submitCallback: write('submitCallback'),
  submitLabRequest: write('submitLabRequest'),
  submitFeedback: write('submitFeedback')
};

/**
 * Slug for detail pages. Pre-rendered pages carry it on <body data-slug>;
 * the legacy ?slug= query string still works as a fallback.
 */
export function getSlugParam(name = 'slug') {
  const fromBody = document.body && document.body.dataset && document.body.dataset[name];
  if (fromBody) return fromBody;
  return new URLSearchParams(location.search).get(name) || '';
}
