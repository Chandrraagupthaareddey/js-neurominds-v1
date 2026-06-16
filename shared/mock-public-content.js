/**
 * JS Neurominds V1 — shared/mock-data.js
 * SINGLE SOURCE OF TRUTH for local development mock APIs.
 *
 * Both public-site and admin-ui import this. Shapes mirror what the GAS
 * Public API and Admin CMS return, so local testing reflects production.
 *
 * No real patient data. No clinical data. Illustrative content only.
 */

export const CLINIC_CONFIG = {
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
  pwens_booking_url: 'https://jsneurominds.pwens.com/',
  ga4_measurement_id: 'G-WKLHEDHC5D',
  email_support: 'jsneurominds5@gmail.com'
};

export const NAVIGATION = [
  { label: 'Home', route: '/', order: 1 },
  { label: 'About', route: '/about', order: 2 },
  { label: 'Doctors', route: '/doctors', order: 3 },
  { label: 'Conditions', route: '/conditions', order: 4 },
  { label: 'Treatments', route: '/treatments', order: 5 },
  { label: 'Services', route: '/services', order: 6 },
  { label: 'Lab Tests', route: '/lab', order: 7 },
  { label: 'Blog', route: '/blog', order: 8 },
  { label: 'FAQ', route: '/faq', order: 9 },
  { label: 'Contact', route: '/contact', order: 10 }
];

export const DOCTORS = [
  {
    doctor_id: 'doc_jayapriya',
    slug: 'dr-jayapriya-t',
    full_name: 'Dr. Jayapriya T',
    qualification: 'MBBS, MD (Psychiatry)',
    specialization: 'Psychiatry · Adult, Child & Geriatric Mental Health',
    experience_years: 10,
    languages: 'Telugu, Tamil, English, Hindi',
    consultation_type: 'Clinic visit, Online',
    conditions_handled: 'Depression, Anxiety, Sleep disorders, Addiction, Child & teen concerns',
    short_bio: 'Dr. Jayapriya T is a consultant psychiatrist providing compassionate, evidence-based mental health care for individuals and families across Tirupati and Chandragiri.',
    profile_photo_link: '',
    support_booking_enabled: 'YES',
    direct_booking_enabled: 'YES',
    online_consultation_enabled: 'YES',
    clinic_visit_enabled: 'YES',
    pwens_booking_url: 'https://jsneurominds.pwens.com/',
    status: 'published'
  }
];

export const CONDITIONS = [
  { condition_id: 'cond_depression', slug: 'depression', name: 'Depression',
    one_line_summary: 'Persistent low mood and loss of interest that affects daily life.',
    symptoms: 'Low mood;Loss of interest;Fatigue;Sleep changes;Poor concentration',
    when_to_consult: 'If low mood lasts more than two weeks or affects work, sleep, or relationships.',
    treatment_approach: 'Evidence-based therapy, lifestyle support, and medication when needed, personalised to severity.',
    related_conditions: 'Anxiety;Bipolar Disorder', is_emergency: 'NO',
    faqs: 'What is depression?|Persistent low mood and loss of interest.||Is depression treatable?|Yes, most people improve with the right care.',
    status: 'published', seo_title: 'Depression Treatment in Tirupati | JS Neurominds',
    seo_description: 'Compassionate, evidence-based depression care in Tirupati and Chandragiri.' },
  { condition_id: 'cond_anxiety', slug: 'anxiety', name: 'Anxiety',
    one_line_summary: 'Excessive worry or fear that is hard to control and interferes with daily life.',
    symptoms: 'Constant worry;Restlessness;Racing heart;Tense muscles;Sleep trouble',
    when_to_consult: 'When worry feels uncontrollable or causes physical symptoms or avoidance.',
    treatment_approach: 'Cognitive behavioural therapy, relaxation techniques, and medication where appropriate.',
    related_conditions: 'Panic Disorder;Social Anxiety', is_emergency: 'NO',
    faqs: 'What is anxiety?|Excessive worry that interferes with daily life.||Is anxiety treatable?|Yes, with therapy and support most people improve.',
    status: 'published', seo_title: 'Anxiety Treatment in Tirupati | JS Neurominds',
    seo_description: 'Calm, supportive anxiety care in Tirupati and Chandragiri.' },
  { condition_id: 'cond_sleep', slug: 'sleep-problems', name: 'Sleep Problems',
    one_line_summary: 'Ongoing difficulty falling or staying asleep.',
    symptoms: 'Trouble falling asleep;Waking at night;Daytime tiredness',
    when_to_consult: 'When sleep problems persist and affect daytime functioning.',
    treatment_approach: 'Sleep-focused guidance, routine changes, and short-term medical support if needed.',
    related_conditions: 'Anxiety;Depression', is_emergency: 'NO',
    faqs: 'Why can I not sleep?|Many causes exist, from stress to routine.||Can it be treated?|Yes, sleep difficulties usually improve with care.',
    status: 'published', seo_title: 'Sleep Problem Treatment in Tirupati | JS Neurominds',
    seo_description: 'Help for insomnia and sleep difficulties in Tirupati.' },
  { condition_id: 'cond_addiction', slug: 'addiction', name: 'Addiction',
    one_line_summary: 'Loss of control over a substance or behaviour despite harm.',
    symptoms: 'Cravings;Loss of control;Neglecting responsibilities;Withdrawal',
    when_to_consult: 'When use continues despite harm to health, work, or relationships.',
    treatment_approach: 'Structured de-addiction support, counselling, and relapse prevention.',
    related_conditions: 'Alcohol Dependence;Anxiety', is_emergency: 'NO',
    faqs: 'Is addiction a medical condition?|Yes, and it responds to treatment.||Is support confidential?|Yes, your privacy is respected.',
    status: 'published', seo_title: 'Addiction Support in Tirupati | JS Neurominds',
    seo_description: 'Confidential de-addiction support in Tirupati and Chandragiri.' },
  { condition_id: 'cond_child', slug: 'child-teen-concerns', name: 'Child & Teen Concerns',
    one_line_summary: 'Emotional, behavioural, and developmental support for children and teenagers.',
    symptoms: 'Behaviour difficulty;Emotional distress;School concerns;Withdrawal',
    when_to_consult: 'When a child shows ongoing emotional, behavioural, or developmental concerns.',
    treatment_approach: 'Child-focused assessment and family-centred support.',
    related_conditions: 'ADHD;Teenage Depression', is_emergency: 'NO',
    faqs: 'When should I bring my child?|When concerns persist or affect daily life.||Will the child be comfortable?|Care is gentle and age-appropriate.',
    status: 'published', seo_title: 'Child & Teen Mental Health in Tirupati | JS Neurominds',
    seo_description: 'Supportive child and adolescent mental health care in Tirupati.' },
  { condition_id: 'cond_selfharm', slug: 'self-harm-thoughts', name: 'Self-Harm Thoughts',
    one_line_summary: 'Thoughts of hurting oneself that need caring support.',
    symptoms: 'Thoughts of self-harm;Distress;Withdrawal',
    when_to_consult: 'Reach out promptly for support; you do not have to cope alone.',
    treatment_approach: 'If you are in immediate danger, use the Emergency Help page now. Compassionate assessment and a safety-focused support plan.',
    related_conditions: 'Depression;Anxiety', is_emergency: 'YES',
    faqs: 'I am having these thoughts, what now?|Please reach out for help right away.||Is support available?|Yes, caring help is available.',
    status: 'published', seo_title: 'Mental Health Crisis Support in Tirupati | JS Neurominds',
    seo_description: 'Caring support for distress. If in danger now, see Emergency Help.' }
];

export const TREATMENTS = [
  { treatment_id: 'tx_therapy', slug: 'counselling-psychotherapy', name: 'Counselling & Psychotherapy',
    one_line_summary: 'Talk-based therapy to understand and manage emotional difficulties.',
    overview: 'Structured, confidential sessions tailored to your needs and goals.',
    what_to_expect: 'A calm conversation, assessment, and a personalised plan.',
    conditions_treated: 'Depression;Anxiety;Stress', status: 'published',
    seo_title: 'Counselling & Psychotherapy in Tirupati | JS Neurominds',
    seo_description: 'Confidential counselling and psychotherapy in Tirupati.' },
  { treatment_id: 'tx_medication', slug: 'medication-management', name: 'Medication Management',
    one_line_summary: 'Careful, monitored use of medication when clinically appropriate.',
    overview: 'Medication is considered thoughtfully and reviewed regularly.',
    what_to_expect: 'Assessment, discussion of options, and ongoing follow-up.',
    conditions_treated: 'Depression;Bipolar Disorder;Anxiety', status: 'published',
    seo_title: 'Psychiatric Medication Management in Tirupati | JS Neurominds',
    seo_description: 'Safe, monitored psychiatric medication management in Tirupati.' },
  { treatment_id: 'tx_deaddiction', slug: 'de-addiction-support', name: 'De-Addiction Support',
    one_line_summary: 'Structured support to overcome substance or behavioural dependence.',
    overview: 'A supportive, judgement-free programme with relapse prevention.',
    what_to_expect: 'Confidential assessment and a step-by-step support plan.',
    conditions_treated: 'Addiction;Alcohol Dependence', status: 'published',
    seo_title: 'De-Addiction Support in Tirupati | JS Neurominds',
    seo_description: 'Confidential de-addiction support in Tirupati and Chandragiri.' }
];

export const SERVICES = [
  { service_id: 'svc_psychiatry', slug: 'psychiatry-consultation', name: 'Psychiatry Consultation',
    summary: 'Comprehensive mental health assessment and care for adults, children, and seniors.',
    status: 'published' },
  { service_id: 'svc_online', slug: 'online-consultation', name: 'Online Consultation',
    summary: 'Consult from home with a secure online appointment.', status: 'published' },
  { service_id: 'svc_walkin', slug: 'general-medicine-walkin', name: 'General Medicine / Walk-in Support',
    summary: 'Walk-in support for general health concerns alongside mental health care.',
    status: 'published' },
  { service_id: 'svc_firstaid', slug: 'first-aid-support', name: 'First Aid Support',
    summary: 'Basic first aid support at the clinic. Not an emergency service.',
    status: 'published' }
];

export const LAB_PACKAGES = [
  { lab_package_id: 'lab_basic', slug: 'basic-wellness', name: 'Basic Wellness Panel',
    summary: 'A general wellness screening package. Home sample collection available.',
    turnaround: 'Reports usually within 24 hours, subject to test and lab availability.',
    status: 'published' },
  { lab_package_id: 'lab_mental', slug: 'mental-wellness-screen', name: 'Mental Wellness Screening Support',
    summary: 'Supportive screening relevant to mental wellbeing, guided by your clinician.',
    turnaround: 'Reports usually within 24 hours, subject to test and lab availability.',
    status: 'published' },
  { lab_package_id: 'lab_thyroid', slug: 'thyroid-profile', name: 'Thyroid Profile',
    summary: 'Thyroid function screening with convenient home sample collection.',
    turnaround: 'Reports usually within 24 hours, subject to test and lab availability.',
    status: 'published' }
];

export const BLOGS = [
  { blog_id: 'blog_sleep', slug: 'better-sleep-habits', title: 'Five Gentle Habits for Better Sleep',
    excerpt: 'Small, practical changes that can help you rest more easily.',
    author: 'JS Neurominds', category: 'Wellbeing', status: 'published',
    body: 'Good sleep supports mental health. Here are five gentle habits to try...',
    seo_title: 'Five Gentle Habits for Better Sleep | JS Neurominds',
    seo_description: 'Practical, gentle tips for better sleep from JS Neurominds, Tirupati.' },
  { blog_id: 'blog_anxiety', slug: 'understanding-everyday-anxiety', title: 'Understanding Everyday Anxiety',
    excerpt: 'When is worry normal, and when is it worth talking to someone?',
    author: 'JS Neurominds', category: 'Mental Health', status: 'published',
    body: 'Anxiety is a normal human experience. This article explains when to seek support...',
    seo_title: 'Understanding Everyday Anxiety | JS Neurominds',
    seo_description: 'A calm guide to everyday anxiety and when to seek support.' }
];

export const FAQS = [
  { faq_id: 'faq_1', scope: 'general', question: 'Do I need a referral to book?',
    answer: 'No referral is needed. You can request a private call back or book directly.', order: 1, status: 'published' },
  { faq_id: 'faq_2', scope: 'general', question: 'Is my information kept private?',
    answer: 'Yes. Your privacy is respected and protected at every step.', order: 2, status: 'published' },
  { faq_id: 'faq_3', scope: 'general', question: 'Do you offer online consultations?',
    answer: 'Yes, secure online consultations are available alongside clinic visits.', order: 3, status: 'published' },
  { faq_id: 'faq_4', scope: 'booking', question: 'What happens after I request a call back?',
    answer: 'Our clinic team will call you at your preferred time to guide you. A call back is not a confirmed appointment.', order: 4, status: 'published' }
];

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
