/**
 * JS Neurominds V1 — shared/validators.js
 * Pure, dependency-free validation helpers shared by the UI (pre-submit checks)
 * and conceptually mirrored in GAS (authoritative server-side validation).
 * Also provides the GA4 PII guardrail used by analytics + tests.
 */
import { GA4_ALLOWED_PARAMS, PII_BLOCKLIST } from './constants.js';

export function isValidMobile(v) {
  const digits = String(v || '').replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(digits.slice(-10));
}

export function isValidEmail(v) {
  if (!v) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v));
}

export function isFutureOrToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return d >= today;
}

export function validateCallback(p) {
  const errors = [];
  if (!p || String(p.patient_name || '').trim().length < 2) errors.push('patient_name');
  if (!isValidMobile(p.mobile_number)) errors.push('mobile_number');
  if (!isValidEmail(p.patient_email)) errors.push('patient_email');
  if (!isFutureOrToday(p.preferred_call_date)) errors.push('preferred_call_date');
  if (!p.preferred_call_time_slot) errors.push('preferred_call_time_slot');
  if (!p.privacy_consent) errors.push('privacy_consent');
  return { valid: errors.length === 0, errors };
}

export function validateLabRequest(p) {
  const errors = [];
  if (!p || String(p.name || '').trim().length < 2) errors.push('name');
  if (!isValidMobile(p.mobile)) errors.push('mobile');
  if (!isValidEmail(p.email)) errors.push('email');
  if (!String(p.pickup_area || '').trim()) errors.push('pickup_area');
  if (!isFutureOrToday(p.preferred_pickup_date)) errors.push('preferred_pickup_date');
  if (!p.selected_package) errors.push('selected_package');
  if (!p.consent) errors.push('consent');
  return { valid: errors.length === 0, errors };
}

export function validateFeedback(p) {
  const errors = [];
  const r = Number(p && p.rating);
  if (!(r >= 1 && r <= 5)) errors.push('rating');
  if (String(p.message || '').length > 300) errors.push('message');
  return { valid: errors.length === 0, errors };
}

/**
 * GA4 guardrail: strip any param not on the allowlist, and hard-fail if a known
 * PII key is present. Returns { safe, droppedPII }.
 */
export function sanitizeGa4Params(params) {
  const safe = {};
  const droppedPII = [];
  Object.keys(params || {}).forEach((k) => {
    if (PII_BLOCKLIST.includes(k)) { droppedPII.push(k); return; }
    if (GA4_ALLOWED_PARAMS.includes(k) && params[k] != null && params[k] !== '') {
      safe[k] = String(params[k]);
    }
  });
  return { safe, droppedPII };
}

// Lightweight sanitizer for free-text stored in Sheets (defense in depth).
export function sanitizeText(v, max = 500) {
  return String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, max);
}
