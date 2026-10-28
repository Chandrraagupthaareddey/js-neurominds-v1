/**
 * JS Neurominds V1 — public-site/assets/js/submission-status.js
 * Single source of truth for "can an online form actually be saved right now?"
 *
 * Background (audit JP-003 / JP-004): the production site has been built in mock
 * mode, so the enquiry, callback and lab forms returned a fabricated success
 * message while nothing was stored. This module makes that state explicit:
 *   - the mock API never returns success for a write (see mock-api.js);
 *   - forms show an honest "submission unavailable" notice up front;
 *   - every failure path offers only the clinic's verified contact options.
 *
 * Verified contact options come from shared/constants.js (CLINIC.call_link and
 * CLINIC.whatsapp_link). The Floating CTA WhatsApp number is NOT used here
 * because it differs from the clinic number and is pending confirmation (JP-025).
 */
import { CONFIG } from './config.js';

export const SUBMISSION_UNAVAILABLE_CODE = 'SUBMISSION_UNAVAILABLE';
export const SUBMISSION_UNAVAILABLE_MESSAGE =
  'Online submission is not available at the moment.';

/** True only when a real write backend is configured. Mock mode never persists. */
export function isSubmissionBackendAvailable(config = CONFIG) {
  if (!config) return false;
  if (config.USE_MOCK) return false;
  return typeof config.PUBLIC_API_URL === 'string' && config.PUBLIC_API_URL.trim().length > 0;
}

/** Envelope returned by the mock API (and usable by any layer) for a write that cannot be stored. */
export function unavailableEnvelope() {
  return { success: false, code: SUBMISSION_UNAVAILABLE_CODE, data: null, error: SUBMISSION_UNAVAILABLE_MESSAGE };
}

/** Classify an API result/error so the UI can pick the right wording. */
export function isUnavailable(resOrErr) {
  if (!resOrErr) return false;
  if (resOrErr.code === SUBMISSION_UNAVAILABLE_CODE) return true;
  return String(resOrErr.message || resOrErr.error || '') === SUBMISSION_UNAVAILABLE_MESSAGE;
}

const esc = (s) => String(s == null ? '' : s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

/**
 * HTML for the verified contact options. `config` defaults to runtime CONFIG;
 * accepts an override for tests.
 */
export function contactOptionsHtml(config = CONFIG) {
  const call = esc(config.CALL_LINK || '');
  const wa = esc(config.WHATSAPP_LINK || '');
  const phone = esc(config.CTA_PHONE || '');
  const parts = [];
  if (call) parts.push(`<a class="btn btn--primary" href="${call}">Call ${phone || 'the clinic'}</a>`);
  if (wa) parts.push(`<a class="btn btn--ghost" href="${wa}" target="_blank" rel="noopener">WhatsApp the clinic</a>`);
  return `<div class="contact-options" style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem">${parts.join('')}</div>`;
}

/**
 * Notice shown above a form when nothing can be saved.
 * `what` is a short noun phrase, e.g. "feedback", "callback requests".
 */
export function unavailableNoticeHtml(what, config = CONFIG) {
  return `
    <div class="notice notice--warn submission-unavailable" role="status">
      <div>
        <strong>${esc(SUBMISSION_UNAVAILABLE_MESSAGE)}</strong>
        <p style="margin:.35rem 0 0">We are not able to receive ${esc(what)} through this website right now,
        so nothing you enter here will reach the clinic. Please use one of these options instead:</p>
        ${contactOptionsHtml(config)}
      </div>
    </div>`;
}

/** Message for a failed submit (unavailable backend or any other error). */
export function failureHtml(resOrErr, config = CONFIG) {
  const lead = isUnavailable(resOrErr)
    ? `<strong>${esc(SUBMISSION_UNAVAILABLE_MESSAGE)}</strong> Your details were <u>not</u> sent.`
    : '<strong>Sorry, we could not send your request.</strong> Your details were <u>not</u> saved.';
  return `<div>${lead} Please contact the clinic directly:</div>${contactOptionsHtml(config)}`;
}
