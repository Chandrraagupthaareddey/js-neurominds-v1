/**
 * JS Neurominds V1 — shared/mock-public-content.js
 * Public content lives as editable JSON under /content (see shared/content.js)
 * and is re-exported here so every existing consumer (validators, legacy
 * admin-ui mock API, tests) keeps working. Operational mock data for the
 * archived admin-ui stays inline below.
 */

import {
  CLINIC_CONFIG, NAVIGATION, DOCTORS, CONDITIONS, TREATMENTS, SERVICES,
  LAB_PACKAGES, BLOGS, FAQS, TESTIMONIALS, SOCIAL_LINKS,
  FEATURE_FLAGS, FLOATING_CTA, GOOGLE_REVIEWS, CALLBACK_OPTIONS, SEO, PAGES
} from './content.js';

// Public content is re-exported from shared/content.js (the single source of
// truth, fed by /content/**.json which the git CMS edits).
export {
  CLINIC_CONFIG, NAVIGATION, DOCTORS, CONDITIONS, TREATMENTS, SERVICES,
  LAB_PACKAGES, BLOGS, FAQS, TESTIMONIALS, SOCIAL_LINKS,
  FEATURE_FLAGS, FLOATING_CTA, GOOGLE_REVIEWS, CALLBACK_OPTIONS, SEO, PAGES
};

// ---- Admin-only mock data ----

export const MOCK_CALLBACK_REQUESTS = [
  { callback_id: 'cb_1001', patient_name: 'R. Kumar', mobile_number: '9876543210',
    whatsapp_number: '9876543210', patient_email: '', preferred_call_date: '2026-06-16',
    preferred_call_time_slot: 'Morning (9am–12pm)', consultation_for: 'Myself',
    new_patient_or_followup: 'New patient', preferred_doctor: 'Dr. Jayapriya T',
    generic_concern_category: 'Anxiety/stress support', consultation_mode_interest: 'Clinic visit',
    source_hint: 'google', status: 'new', assigned_to: '', created_at: '2026-06-15 09:12:00' },
  { callback_id: 'cb_1002', patient_name: 'S. Devi', mobile_number: '9988776655',
    whatsapp_number: '9988776655', patient_email: 'sdevi@example.com', preferred_call_date: '2026-06-16',
    preferred_call_time_slot: 'Evening (4pm–8pm)', consultation_for: 'Family member',
    new_patient_or_followup: 'Follow-up', preferred_doctor: 'Dr. Jayapriya T',
    generic_concern_category: 'Follow-up consultation', consultation_mode_interest: 'Online',
    source_hint: 'whatsapp', status: 'contacted', assigned_to: 'jsneurominds5@gmail.com',
    created_at: '2026-06-15 10:45:00' },
  { callback_id: 'cb_1003', patient_name: 'M. Reddy', mobile_number: '9001122334',
    whatsapp_number: '', patient_email: '', preferred_call_date: '2026-06-17',
    preferred_call_time_slot: 'Afternoon (12pm–4pm)', consultation_for: 'Myself',
    new_patient_or_followup: 'New patient', preferred_doctor: 'Dr. Jayapriya T',
    generic_concern_category: 'Sleep concern', consultation_mode_interest: 'Either',
    source_hint: 'instagram', status: 'followup_required', assigned_to: 'jsneurominds5@gmail.com',
    created_at: '2026-06-14 16:20:00' }
];

export const MOCK_CALLBACK_CHECKLIST = [
  { checklist_id: 'chk_1', label: 'Verify patient identity', required: 'YES', order: 1 },
  { checklist_id: 'chk_2', label: 'Understand concern category', required: 'YES', order: 2 },
  { checklist_id: 'chk_3', label: 'Confirm preferred doctor', required: 'NO', order: 3 },
  { checklist_id: 'chk_4', label: 'Explain booking options', required: 'YES', order: 4 },
  { checklist_id: 'chk_5', label: 'Confirm next step', required: 'YES', order: 5 }
];

export const MOCK_CALLBACK_QUESTIONS = {
  ask: [
    'Best time we can reach you?',
    'Is this for yourself or a family member?',
    'Would you prefer a clinic visit or online consultation?',
    'Do you have a preferred doctor?'
  ],
  dont_ask: [
    'Do not ask for diagnosis or detailed symptoms',
    'Do not ask for prescriptions or medication details',
    'Do not record psychiatric history on the form',
    'Do not give clinical advice over the call'
  ]
};

export const MOCK_LAB_REQUESTS = [
  { lab_request_id: 'lab_2001', name: 'P. Sharma', mobile: '9123456780', whatsapp: '9123456780',
    email: '', pickup_area: 'Ramachandra Nagar, near temple', preferred_pickup_date: '2026-06-17',
    preferred_pickup_time: 'Morning', selected_package: 'Basic Wellness Panel',
    status: 'new', created_at: '2026-06-15 08:30:00' },
  { lab_request_id: 'lab_2002', name: 'A. Banu', mobile: '9234567810', whatsapp: '',
    email: 'abanu@example.com', pickup_area: 'Thondavada main road', preferred_pickup_date: '2026-06-18',
    preferred_pickup_time: 'Afternoon', selected_package: 'Thyroid Profile',
    status: 'verified', created_at: '2026-06-14 14:10:00' }
];

export const MOCK_FEEDBACK = [
  { feedback_id: 'fb_1', rating: 5, message: 'Very caring and patient. Felt heard.',
    consent_given: 'YES', status: 'pending', created_at: '2026-06-13 11:00:00' },
  { feedback_id: 'fb_2', rating: 4, message: 'Clean clinic, helpful staff.',
    consent_given: 'YES', status: 'approved', created_at: '2026-06-12 15:30:00' }
];

export const MOCK_GA4_SUMMARY = {
  range: 'Last 7 days (mock)',
  totals: { active_users: 1240, sessions: 1880, engaged_sessions: 1310 },
  events: {
    call_click: 86, whatsapp_click: 142, support_booking_click: 64,
    support_booking_submit: 31, pwens_booking_click: 48,
    condition_view: 420, treatment_view: 165, lab_page_view: 98,
    doctor_profile_view: 210, feedback_submit: 12, faq_expand: 73
  },
  by_source: [
    { source: 'google', sessions: 720 }, { source: 'instagram', sessions: 410 },
    { source: 'whatsapp', sessions: 360 }, { source: 'direct', sessions: 240 },
    { source: 'facebook', sessions: 150 }
  ],
  by_device: [
    { device: 'mobile', sessions: 1480 }, { device: 'desktop', sessions: 320 },
    { device: 'tablet', sessions: 80 }
  ],
  daily_sessions: [210, 245, 268, 252, 290, 305, 310],
  daily_leads: [9, 11, 14, 12, 13, 16, 18]
};

export const MOCK_HEALTH = {
  public_api: 'ok', admin_api: 'ok', email_quota_remaining: 92,
  last_email_failures: 0, last_deploy_status: 'success',
  last_deploy_at: '2026-06-15 07:40:00', error_count_24h: 0
};

export const MOCK_USERS = [
  { email: 'tcgr.8553665381@gmail.com', role_key: 'super_admin', name: 'TCGR Super Admin', status: 'active' },
  { email: 'jsneurominds5@gmail.com', role_key: 'admin', name: 'Clinic Admin', status: 'active' },
  { email: 'jayapriya13@gmail.com', role_key: 'admin', name: 'Dr. Jayapriya', status: 'active' }
];

export const MOCK_PUBLISH_HISTORY = [
  { publish_id: 'pub_1', resource_type: 'condition', resource_id: 'cond_depression',
    action: 'published', actor_email: 'jsneurominds5@gmail.com', created_at: '2026-06-14 12:00:00' },
  { publish_id: 'pub_2', resource_type: 'blog', resource_id: 'blog_sleep',
    action: 'published', actor_email: 'jsneurominds5@gmail.com', created_at: '2026-06-13 09:30:00' }
];

// Convenience grouped export for mock-api consumers.
export const DB = {
  CLINIC_CONFIG, NAVIGATION, DOCTORS, CONDITIONS, TREATMENTS, SERVICES,
  LAB_PACKAGES, BLOGS, FAQS, CALLBACK_OPTIONS,
  MOCK_CALLBACK_REQUESTS, MOCK_CALLBACK_CHECKLIST, MOCK_CALLBACK_QUESTIONS,
  MOCK_LAB_REQUESTS, MOCK_FEEDBACK, MOCK_GA4_SUMMARY, MOCK_HEALTH,
  MOCK_USERS, MOCK_PUBLISH_HISTORY
};
