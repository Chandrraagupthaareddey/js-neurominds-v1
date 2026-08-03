/**
 * JS Neurominds V1 — shared/mock-public-content.js
 * Public content (conditions, treatments, doctors, FAQs, etc.) now lives as
 * editable JSON under /content and is re-exported here unchanged, so every
 * existing consumer (build-stubs, validators, mock APIs) keeps working while
 * the git-CMS edits the JSON directly. Operational mock data stays inline below.
 */

import CLINIC_CONFIG_JSON from '../content/clinic.json' with { type: 'json' };
import NAVIGATION_JSON from '../content/navigation.json' with { type: 'json' };
import DOCTORS_JSON from '../content/doctors.json' with { type: 'json' };
import CONDITIONS_JSON from '../content/conditions.json' with { type: 'json' };
import TREATMENTS_JSON from '../content/treatments.json' with { type: 'json' };
import SERVICES_JSON from '../content/services.json' with { type: 'json' };
import LAB_PACKAGES_JSON from '../content/lab_packages.json' with { type: 'json' };
import BLOGS_JSON from '../content/blogs.json' with { type: 'json' };
import FAQS_JSON from '../content/faqs.json' with { type: 'json' };
import TESTIMONIALS_JSON from '../content/testimonials.json' with { type: 'json' };
import SOCIAL_LINKS_JSON from '../content/social_links.json' with { type: 'json' };

export const CLINIC_CONFIG = CLINIC_CONFIG_JSON;
export const NAVIGATION = NAVIGATION_JSON;
export const DOCTORS = DOCTORS_JSON;
export const CONDITIONS = CONDITIONS_JSON;
export const TREATMENTS = TREATMENTS_JSON;
export const SERVICES = SERVICES_JSON;
export const LAB_PACKAGES = LAB_PACKAGES_JSON;
export const BLOGS = BLOGS_JSON;
export const FAQS = FAQS_JSON;
export const TESTIMONIALS = TESTIMONIALS_JSON;
export const SOCIAL_LINKS = SOCIAL_LINKS_JSON;

export const FEATURE_FLAGS = {
  public_lab_tests_enabled: false,
  public_callback_enabled: false,   // Clinic Callback intentionally hidden (booking-first). Backend code preserved.
  public_testimonials_enabled: true,
  public_reviews_enabled: true,
  public_knowledge_enabled: true,
  public_announcements_enabled: false,
  floating_cta_enabled: true
};

// Floating CTA config (admin-editable). WhatsApp number/text configurable;
// defaults to the locked clinic WhatsApp. device_visibility: all|desktop|mobile.
export const FLOATING_CTA = [
  { cta_id: 'fab_call', kind: 'call', label: 'Call Clinic', value: 'tel:+918553665381', is_enabled: 'YES', display_order: 1, device_visibility: 'all' },
  { cta_id: 'fab_whatsapp', kind: 'whatsapp', label: 'WhatsApp Clinic', value: 'https://wa.me/9986559998', whatsapp_text: 'Hi, I would like to know more about JS Neurominds.', is_enabled: 'YES', display_order: 2, device_visibility: 'all' },
  { cta_id: 'fab_enquire', kind: 'feedback', label: 'Enquire Now', value: '', is_enabled: 'YES', display_order: 3, device_visibility: 'all' }
];

// Google reviews (manually curated in Sheets; only status === 'approved' shows).
// review_url links back to the clinic's Google profile.
export const GOOGLE_REVIEWS = {
  summary: {
    rating: 4.9,
    review_count: 60,
    profile_url: 'https://share.google/FINrIJ0bVg0GX5D08',
    write_review_url: 'https://share.google/FINrIJ0bVg0GX5D08'
  },
  reviews: [
    { review_id: 'gr_1', author_display: 'Praveen K', rating: 5, relative_time: 'a month ago',
      text: 'Very professional and caring. The doctor took time to understand our concerns and guided us patiently.',
      review_url: 'https://share.google/FINrIJ0bVg0GX5D08', status: 'approved' },
    { review_id: 'gr_2', author_display: 'Lakshmi N', rating: 5, relative_time: '2 months ago',
      text: 'Compassionate and trustworthy clinic. Highly recommend for mental health support in Tirupati.',
      review_url: 'https://share.google/FINrIJ0bVg0GX5D08', status: 'approved' },
    { review_id: 'gr_3', author_display: 'Suresh B', rating: 5, relative_time: '3 months ago',
      text: 'Smooth booking, friendly staff, and the home sample collection was right on time.',
      review_url: 'https://share.google/FINrIJ0bVg0GX5D08', status: 'approved' }
  ]
};


// Admin-configurable dropdown options for the callback form.
export const CALLBACK_OPTIONS = {
  time_slots: ['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)'],
  consultation_for: ['Myself', 'Family member', 'Someone I care for'],
  patient_type: ['New patient', 'Follow-up'],
  consultation_mode: ['Clinic visit', 'Online', 'Either'],
  concern_categories: [
    'Appointment booking', 'Anxiety/stress support', 'Sleep concern',
    'Child/teen concern', 'Addiction support', 'Follow-up consultation',
    'Online consultation', 'Lab/home collection enquiry', 'General enquiry',
    'Prefer to discuss on call'
  ]
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
