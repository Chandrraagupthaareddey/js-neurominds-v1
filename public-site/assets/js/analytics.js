/**
 * JS Neurominds V1 — public-site/assets/js/analytics.js
 * GA4 event wrapper. Enforces an allowlist of parameters so PII / clinical
 * data can never be sent. In local dev (mock), events are logged to console.
 */
import { CONFIG } from './config.js';

// Only these parameter keys may ever be sent to GA4.
const ALLOWED_PARAMS = new Set([
  'page_type', 'page_slug', 'cta_type', 'doctor_id', 'condition_slug',
  'treatment_slug', 'lab_package_id', 'callback_id', 'lab_request_id',
  'lead_id', 'source_hint'
]);

// Known event names (kept in sync with the brief).
export const EVENTS = [
  'call_click', 'whatsapp_click', 'support_booking_click', 'support_booking_form_open',
  'support_booking_submit', 'support_booking_error', 'pwens_booking_click',
  'doctor_calendar_click', 'doctor_profile_view', 'condition_view', 'treatment_view',
  'lab_page_view', 'lab_package_view', 'lab_request_submit', 'faq_expand', 'feedback_submit'
];

let ready = false;

export function initAnalytics() {
  // Only load real GA4 in live mode with a measurement ID. In mock/local mode,
  // events are logged to the console so they remain testable without GA4.
  if (CONFIG.USE_MOCK || CONFIG.ENV === 'local' || !CONFIG.GA4_MEASUREMENT_ID) {
    ready = false;
    return;
  }
  const id = CONFIG.GA4_MEASUREMENT_ID;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // No user_id for public visitors/patients in V1.
  window.gtag('config', id, { send_page_view: true, anonymize_ip: true });
  ready = true;
}

function clean(params) {
  const out = {};
  Object.keys(params || {}).forEach((k) => {
    if (ALLOWED_PARAMS.has(k) && params[k] != null && params[k] !== '') out[k] = String(params[k]);
  });
  return out;
}

export function track(eventName, params = {}) {
  const safe = clean(params);
  if (!ready) {
    console.info('[ga4:mock]', eventName, safe);
    return;
  }
  window.gtag('event', eventName, safe);
}

// Convenience trackers used across the site.
export const analytics = {
  callClick: (cta_type) => track('call_click', { cta_type }),
  whatsappClick: (cta_type) => track('whatsapp_click', { cta_type }),
  supportBookingClick: (cta_type) => track('support_booking_click', { cta_type }),
  supportBookingFormOpen: () => track('support_booking_form_open', {}),
  supportBookingSubmit: (callback_id) => track('support_booking_submit', { callback_id }),
  supportBookingError: () => track('support_booking_error', {}),
  pwensBookingClick: (doctor_id) => track('pwens_booking_click', { cta_type: 'confirmed', doctor_id }),
  doctorProfileView: (doctor_id) => track('doctor_profile_view', { doctor_id }),
  conditionView: (condition_slug) => track('condition_view', { condition_slug }),
  treatmentView: (treatment_slug) => track('treatment_view', { treatment_slug }),
  labPageView: () => track('lab_page_view', { page_type: 'lab' }),
  labPackageView: (lab_package_id) => track('lab_package_view', { lab_package_id }),
  labRequestSubmit: (lab_request_id) => track('lab_request_submit', { lab_request_id }),
  faqExpand: (page_slug) => track('faq_expand', { page_slug }),
  feedbackSubmit: () => track('feedback_submit', {})
};
