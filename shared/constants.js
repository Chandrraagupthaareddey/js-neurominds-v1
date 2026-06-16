/**
 * JS Neurominds V1 — shared/constants.js
 * Single source of truth for non-secret constants used across the public site,
 * admin UI, and validation scripts. No secrets here — only public identifiers
 * and fixed vocabulary. Secrets live in .env / GAS Script Properties.
 */

export const CLINIC = {
  clinic_name: 'JS Neurominds and Diagnostic Center',
  clinic_short: 'JS Neurominds',
  doctor_lead: 'Dr. Jayapriya T',
  display_phone: '085198 43626',
  cta_phone: '+91 8553665381',
  whatsapp_link: 'https://wa.me/918553665381',
  call_link: 'tel:+918553665381',
  maps_url: 'https://share.google/FINrIJ0bVg0GX5D08',
  address: 'Beside Suzuki showroom, Hero PVR Motors Building, 10-1060, Ramachandra Nagar, Chandragiri, Thondavada, Andhra Pradesh 517101',
  footer: 'Built and maintained by TCGR Technologies / tcgr.in',
  support_email: 'jsneurominds5@gmail.com',
  pwens_booking_url: 'https://jsneurominds.pwens.com/',
  domain: 'https://neurominds.in'
};

// GA4 — measurement ID is a public identifier (it ships in the page anyway).
// Account/property/stream IDs are used server-side by the GA4 Data API.
export const GA4 = {
  MEASUREMENT_ID: 'G-WKLHEDHC5D',
  ACCOUNT_ID: '398033815',
  PROPERTY_ID: '541725914',
  STREAM_ID: '15078146542',
  STREAM_URL: 'https://neurominds.in'
};

// BigQuery — sandbox/optional reporting layer only. Never streamed to in V1.
export const BIGQUERY = {
  PROJECT_ID: 'jsnm-analytics',
  REPORTING_DATASET_ID: 'jsnm_reporting',
  LOCATION: 'US',
  CODE_REGION: 'us-central1',
  STATUS: 'sandbox_v1_optional',
  STREAMING_EXPORT: false,
  GA4_BIGQUERY_DATASET_ID_FUTURE: 'analytics_541725914',
  TABLES: [
    'system_config', 'ga4_daily_traffic_summary', 'ga4_event_summary',
    'ga4_lead_attribution_summary', 'admin_dashboard_cache',
    'bq_job_audit', 'privacy_guardrails'
  ]
};

// GA4 event names (allowlist). UI may only emit these.
export const GA4_EVENTS = [
  'call_click', 'whatsapp_click', 'support_booking_click', 'support_booking_form_open',
  'support_booking_submit', 'support_booking_error', 'pwens_booking_click',
  'doctor_calendar_click', 'doctor_profile_view', 'condition_view', 'treatment_view',
  'lab_page_view', 'lab_package_view', 'lab_request_submit', 'faq_expand', 'feedback_submit'
];

// GA4 parameters that may EVER be sent. Anything else is dropped (no PII).
export const GA4_ALLOWED_PARAMS = [
  'page_type', 'page_slug', 'cta_type', 'doctor_id', 'condition_slug',
  'treatment_slug', 'lab_package_id', 'callback_id', 'lab_request_id',
  'lead_id', 'source_hint'
];

// Fields that must NEVER reach GA4 / BigQuery (guardrail for validators/tests).
export const PII_BLOCKLIST = [
  'patient_name', 'name', 'mobile', 'mobile_number', 'whatsapp', 'whatsapp_number',
  'email', 'patient_email', 'address', 'symptoms', 'diagnosis', 'prescription',
  'medication', 'psychiatric_history', 'short_note', 'message', 'user_id'
];

// Operational status vocabularies.
export const CALLBACK_STATUSES = ['new', 'contacted', 'followup_required', 'converted', 'closed'];
export const LAB_STATUSES = ['new', 'verified', 'collected', 'completed', 'cancelled'];
export const FEEDBACK_STATUSES = ['pending', 'approved', 'rejected'];
export const CONTENT_STATUSES = ['draft', 'review', 'published', 'archived'];

// Concern categories (admin-configurable defaults).
export const CONCERN_CATEGORIES = [
  'Appointment booking', 'Anxiety/stress support', 'Sleep concern',
  'Child/teen concern', 'Addiction support', 'Follow-up consultation',
  'Online consultation', 'Lab/home collection enquiry', 'General enquiry',
  'Prefer to discuss on call'
];

// Default seed users (emails only; roles in permissions.js).
export const DEFAULT_USERS = [
  { email: 'tcgr.8553665381@gmail.com', role_key: 'super_admin', name: 'TCGR Super Admin' },
  { email: 'jsneurominds5@gmail.com', role_key: 'admin', name: 'Clinic Admin' },
  { email: 'jayapriya13@gmail.com', role_key: 'admin', name: 'Dr. Jayapriya' }
];
