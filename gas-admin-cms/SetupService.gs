/**
 * JS Neurominds V1 — gas-admin-cms/SetupService.gs
 * One-time provisioning. Run runSetup() ONCE from the Apps Script editor.
 *
 * Creates:
 *   - Drive folder  JSNM_V1_DATABASE
 *   - Workbook 1    JSNM_V1_CONFIG_CONTENT   (21 tabs)
 *   - Workbook 2    JSNM_V1_OPERATIONS_AUDIT (14 tabs)
 *   - All tab headers
 *   - Seed: users, roles, role permissions, system config, analytics config,
 *           callback checklist + questions, 60 condition rows, service/lab
 *           drafts, runbook content, base pages/navigation
 *   - Script Properties: folder + both workbook IDs, GA4 + BigQuery config
 *
 * Idempotency: if Script Properties already hold workbook IDs, runSetup() will
 * refuse to run again (to avoid duplicates). Use resetSetupProperties() if you
 * truly need to re-provision into fresh workbooks.
 *
 * NOTE: schema definitions are duplicated here (GAS has no ES module import).
 * They MUST stay in sync with shared/schemas.js — validate-schemas.js guards
 * the JS copy; keep this one matching when columns change.
 */

/* ---------------- Tab + column definitions (mirror shared/schemas.js) ---------------- */
var SCHEMA = {
  CONFIG_CONTENT: 'JSNM_V1_CONFIG_CONTENT',
  OPERATIONS_AUDIT: 'JSNM_V1_OPERATIONS_AUDIT',
  CONFIG_CONTENT_TABS: {
    Pages: ['page_id','slug','title','in_nav','nav_order','status','updated_at'],
    Conditions: ['condition_id','slug','name','one_line_summary','symptoms','when_to_consult','treatment_approach','related_conditions','is_emergency','faqs','seo_title','seo_description','status','updated_at'],
    Treatments: ['treatment_id','slug','name','one_line_summary','overview','what_to_expect','conditions_treated','seo_title','seo_description','status','updated_at'],
    Doctors: ['doctor_id','slug','full_name','qualification','specialization','experience_years','languages','consultation_type','conditions_handled','short_bio','profile_photo_link','support_booking_enabled','direct_booking_enabled','online_consultation_enabled','clinic_visit_enabled','pwens_booking_url','status','updated_at'],
    Services: ['service_id','slug','name','summary','detail','icon','status','updated_at'],
    Lab_Packages: ['lab_package_id','slug','name','summary','turnaround','includes','status','updated_at'],
    Lab_Tests: ['lab_test_id','lab_package_id','name','description','status','updated_at'],
    Locations: ['location_id','slug','name','area','pincode','maps_url','seo_title','seo_description','status','updated_at'],
    Blogs: ['blog_id','slug','title','excerpt','body','author','category','cover_image','seo_title','seo_description','status','updated_at'],
    FAQs: ['faq_id','scope','question','answer','display_order','status','updated_at'],
    SEO_Metadata: ['seo_id','page_type','slug','meta_title','meta_description','og_image','canonical','updated_at'],
    Media_Library: ['media_id','file_name','drive_file_id','drive_url','alt_text','uploaded_by','created_at'],
    Navigation: ['nav_id','label','route','display_order','visible','updated_at'],
    Promotions: ['promo_id','title','body','start_date','end_date','active','updated_at'],
    Users: ['email','role_key','name','status','created_at','last_login_at'],
    Roles: ['role_key','role_label','description'],
    Role_Permissions: ['role_key','section_key','can_view','can_edit','can_publish'],
    System_Config: ['config_key','config_value','description','updated_at'],
    Analytics_Config: ['key','value','description','updated_at'],
    Runbook: ['runbook_id','mode','section','title','body','display_order','updated_at'],
    Feature_Flags: ['flag_key','enabled','description','updated_at']
  },
  OPERATIONS_AUDIT_TABS: {
    Callback_Requests: ['callback_id','created_at','patient_name','mobile_number','whatsapp_number','patient_email','preferred_call_date','preferred_call_time_slot','consultation_for','new_patient_or_followup','preferred_doctor','generic_concern_category','consultation_mode_interest','short_note','source_hint','status','assigned_to','updated_at'],
    Callback_Checklist_Config: ['checklist_id','label','required','display_order','active'],
    Callback_Question_Config: ['question_id','kind','text','display_order','active'],
    Callback_Staff_Responses: ['response_id','callback_id','checklist_id','answer','staff_email','created_at'],
    Callback_Status_History: ['history_id','callback_id','old_status','new_status','note','actor_email','created_at'],
    Lab_Requests: ['lab_request_id','created_at','name','mobile','whatsapp','email','pickup_area','preferred_pickup_date','preferred_pickup_time','selected_package','status','assigned_to','updated_at'],
    Feedback: ['feedback_id','created_at','rating','message','consent_given','source_hint','status','moderated_by','updated_at'],
    Email_Logs: ['email_log_id','created_at','kind','recipient_type','related_id','status','error_message'],
    Admin_Audit: ['audit_id','created_at','actor_email','action','resource_type','resource_id','detail'],
    Backup_Registry: ['backup_id','created_at','kind','drive_file_id','drive_url','status','note'],
    Publish_History: ['publish_id','created_at','resource_type','resource_id','action','actor_email'],
    Error_Logs: ['error_id','created_at','source','message','stack','context'],
    Health_Checks: ['check_id','created_at','check_type','status','detail'],
    Cloudflare_Deployments: ['deploy_id','created_at','trigger','status','response_code','note']
  }
};

/* ---------------- Public entry point ---------------- */
function runSetup() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(ADMIN_CONFIG.PROP_KEYS.CONFIG_CONTENT_ID)) {
    throw new Error('Setup already completed. To re-provision, call resetSetupProperties() first (this does NOT delete old data).');
  }

  var now = Utils.nowIso();

  // 1) Drive folder
  var folder = DriveApp.createFolder('JSNM_V1_DATABASE');
  var folderId = folder.getId();

  // 2) Two workbooks, moved into the folder
  var configSS = SpreadsheetApp.create(SCHEMA.CONFIG_CONTENT);
  var opsSS = SpreadsheetApp.create(SCHEMA.OPERATIONS_AUDIT);
  DriveApp.getFileById(configSS.getId()).moveTo(folder);
  DriveApp.getFileById(opsSS.getId()).moveTo(folder);

  // 3) Tabs + headers
  _createTabs_(configSS, SCHEMA.CONFIG_CONTENT_TABS);
  _createTabs_(opsSS, SCHEMA.OPERATIONS_AUDIT_TABS);

  // 4) Store Script Properties early so seed writers can resolve IDs
  props.setProperty(ADMIN_CONFIG.PROP_KEYS.DB_FOLDER_ID, folderId);
  props.setProperty(ADMIN_CONFIG.PROP_KEYS.CONFIG_CONTENT_ID, configSS.getId());
  props.setProperty(ADMIN_CONFIG.PROP_KEYS.OPERATIONS_AUDIT_ID, opsSS.getId());
  props.setProperty(ADMIN_CONFIG.PROP_KEYS.GA4_PROPERTY_ID, ADMIN_CONFIG.GA4.PROPERTY_ID);
  props.setProperty(ADMIN_CONFIG.PROP_KEYS.BIGQUERY_PROJECT_ID, ADMIN_CONFIG.BIGQUERY.PROJECT_ID);

  // 5) Seed everything
  var cId = configSS.getId();
  var oId = opsSS.getId();
  _seedRoles_(cId, now);
  _seedUsers_(cId, now);
  _seedRolePermissions_(cId);
  _seedSystemConfig_(cId, now);
  _seedAnalyticsConfig_(cId, now);
  _seedNavigation_(cId, now);
  _seedPages_(cId, now);
  _seedConditions_(cId, now);     // 60 rows
  _seedTreatments_(cId, now);
  _seedServices_(cId, now);
  _seedLab_(cId, now);
  _seedFaqs_(cId, now);
  _seedRunbook_(cId, now);
  _seedCallbackChecklist_(oId);
  _seedCallbackQuestions_(oId);

  Logger.log('runSetup complete.');
  Logger.log('Folder: ' + folderId);
  Logger.log('CONFIG_CONTENT: ' + cId);
  Logger.log('OPERATIONS_AUDIT: ' + oId);
  return { folderId: folderId, configContentId: cId, operationsAuditId: oId };
}

/** Clears the setup Script Properties so runSetup() can run again (old workbooks remain in Drive). */
function resetSetupProperties() {
  var props = PropertiesService.getScriptProperties();
  [ADMIN_CONFIG.PROP_KEYS.DB_FOLDER_ID, ADMIN_CONFIG.PROP_KEYS.CONFIG_CONTENT_ID, ADMIN_CONFIG.PROP_KEYS.OPERATIONS_AUDIT_ID]
    .forEach(function (k) { props.deleteProperty(k); });
  Logger.log('Setup properties cleared.');
}

/* ---------------- Helpers ---------------- */
function _createTabs_(ss, tabs) {
  var first = true;
  Object.keys(tabs).forEach(function (tabName) {
    var sheet;
    if (first) { sheet = ss.getSheets()[0]; sheet.setName(tabName); first = false; }
    else { sheet = ss.insertSheet(tabName); }
    var headers = tabs[tabName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });
}

function _seedRoles_(cId, now) {
  SheetService.appendMany(cId, 'Roles', [
    { role_key: 'super_admin', role_label: 'Super Admin', description: 'Full access including users, settings, backups.' },
    { role_key: 'admin', role_label: 'Admin', description: 'Operations + content; no user/settings/backup management.' },
    { role_key: 'lab_team', role_label: 'Lab Team', description: 'Lab requests + dashboard + runbook only.' },
    { role_key: 'content_editor', role_label: 'Content Editor', description: 'Content editing + dashboard + runbook.' },
    { role_key: 'marketing', role_label: 'Marketing', description: 'Marketing analytics + dashboard + runbook.' }
  ]);
}

function _seedUsers_(cId, now) {
  SheetService.appendMany(cId, 'Users', [
    { email: 'tcgr.8553665381@gmail.com', role_key: 'super_admin', name: 'TCGR Super Admin', status: 'active', created_at: now, last_login_at: '' },
    { email: 'jsneurominds5@gmail.com', role_key: 'admin', name: 'Clinic Admin', status: 'active', created_at: now, last_login_at: '' },
    { email: 'jayapriya13@gmail.com', role_key: 'admin', name: 'Dr. Jayapriya', status: 'active', created_at: now, last_login_at: '' }
  ]);
}

function _seedRolePermissions_(cId) {
  var sections = ['dashboard','booking','callback','lab','marketing','seo','content','doctors','services','media','feedback','health','backup','settings','runbook'];
  var matrix = {
    super_admin: { view: sections, edit: sections, publish: ['content','doctors','services','seo'] },
    admin: { view: ['dashboard','booking','callback','lab','seo','content','doctors','services','media','feedback','health','runbook'], edit: ['callback','lab','content','doctors','services','feedback','seo'], publish: ['content','doctors','services','seo'] },
    lab_team: { view: ['dashboard','lab','runbook'], edit: ['lab'], publish: [] },
    content_editor: { view: ['dashboard','content','runbook'], edit: ['content'], publish: [] },
    marketing: { view: ['dashboard','marketing','runbook'], edit: [], publish: [] }
  };
  var rows = [];
  Object.keys(matrix).forEach(function (role) {
    var m = matrix[role];
    m.view.forEach(function (sec) {
      rows.push({ role_key: role, section_key: sec, can_view: 'YES', can_edit: m.edit.indexOf(sec) > -1 ? 'YES' : 'NO', can_publish: m.publish.indexOf(sec) > -1 ? 'YES' : 'NO' });
    });
  });
  SheetService.appendMany(cId, 'Role_Permissions', rows);
}

function _seedSystemConfig_(cId, now) {
  var cfg = {
    clinic_name: 'JS Neurominds and Diagnostic Center', clinic_short: 'JS Neurominds',
    display_phone: '085198 43626', cta_phone: '+91 8553665381',
    whatsapp_link: 'https://wa.me/918553665381', call_link: 'tel:+918553665381',
    maps_url: 'https://share.google/FINrIJ0bVg0GX5D08',
    address: 'Beside Suzuki showroom, Hero PVR Motors Building, 10-1060, Ramachandra Nagar, Chandragiri, Thondavada, Andhra Pradesh 517101',
    footer: 'Built and maintained by TCGR Technologies / tcgr.in',
    support_email: 'jsneurominds5@gmail.com', pwens_booking_url: 'https://jsneurominds.pwens.com/',
    domain: 'https://neurominds.in',
    cloudflare_auto_deploy_enabled: 'NO', last_cloudflare_deploy_status: '', last_cloudflare_deploy_triggered_at: ''
    // CLOUDFLARE_DEPLOY_HOOK_URL is intentionally NOT seeded here — it is a secret,
    // stored only in Script Properties, set manually post-setup.
  };
  var rows = Object.keys(cfg).map(function (k) { return { config_key: k, config_value: cfg[k], description: '', updated_at: now }; });
  SheetService.appendMany(cId, 'System_Config', rows);
}

function _seedAnalyticsConfig_(cId, now) {
  var cfg = {
    GA4_MEASUREMENT_ID: ADMIN_CONFIG.GA4.MEASUREMENT_ID, GA4_PROPERTY_ID: ADMIN_CONFIG.GA4.PROPERTY_ID,
    GA4_ACCOUNT_ID: ADMIN_CONFIG.GA4.ACCOUNT_ID, GA4_STREAM_ID: ADMIN_CONFIG.GA4.STREAM_ID,
    BIGQUERY_PROJECT_ID: ADMIN_CONFIG.BIGQUERY.PROJECT_ID, REPORTING_DATASET_ID: ADMIN_CONFIG.BIGQUERY.REPORTING_DATASET_ID,
    BIGQUERY_STATUS: ADMIN_CONFIG.BIGQUERY.STATUS, BIGQUERY_STREAMING_EXPORT: ADMIN_CONFIG.BIGQUERY.STREAMING_EXPORT
  };
  var rows = Object.keys(cfg).map(function (k) { return { key: k, value: cfg[k], description: '', updated_at: now }; });
  SheetService.appendMany(cId, 'Analytics_Config', rows);
}

function _seedNavigation_(cId, now) {
  var nav = [
    ['About','/about',1],['Doctors','/doctors',2],['Conditions','/conditions',3],
    ['Treatments','/treatments',4],['Services','/services',5],['Lab Tests','/lab',6],
    ['Blog','/blog',7],['FAQ','/faq',8],['Contact','/contact',9]
  ];
  SheetService.appendMany(cId, 'Navigation', nav.map(function (n) {
    return { nav_id: Utils.genId('NAV'), label: n[0], route: n[1], display_order: n[2], visible: 'YES', updated_at: now };
  }));
}

function _seedPages_(cId, now) {
  var pages = ['home','about','doctors','conditions','treatments','services','lab','booking','blog','faq','contact','privacy','terms','medical-disclaimer','emergency'];
  SheetService.appendMany(cId, 'Pages', pages.map(function (p, i) {
    return { page_id: Utils.genId('PG'), slug: p === 'home' ? '' : p, title: p.charAt(0).toUpperCase() + p.slice(1), in_nav: 'NO', nav_order: i + 1, status: 'published', updated_at: now };
  }));
}

function _seedTreatments_(cId, now) {
  var t = [
    ['counselling-psychotherapy','Counselling & Psychotherapy','Talk-based therapy tailored to your needs.','Structured, confidential sessions to work through thoughts, emotions, and behaviour patterns.','You and your therapist set goals and meet regularly to track progress.','Anxiety;Depression;Stress'],
    ['medication-management','Medication Management','Careful, monitored medication when appropriate.','Evidence-based prescribing with regular review for safety and effectiveness.','Initial assessment, prescription if needed, and scheduled follow-ups.','Depression;Anxiety;Sleep problems'],
    ['de-addiction-support','De-addiction Support','Compassionate help to overcome dependence.','A supportive, non-judgemental programme combining counselling and medical care.','Assessment, a personalised plan, and ongoing support.','Addiction']
  ];
  SheetService.appendMany(cId, 'Treatments', t.map(function (x) {
    return { treatment_id: Utils.genId('TRT'), slug: x[0], name: x[1], one_line_summary: x[2], overview: x[3], what_to_expect: x[4], conditions_treated: x[5], seo_title: x[1] + ' | JS Neurominds', seo_description: x[2], status: 'published', updated_at: now };
  }));
}

function _seedServices_(cId, now) {
  var s = [
    ['psychiatry-consultation','Psychiatry Consultation','Expert assessment and care planning.','Comprehensive psychiatric evaluation and personalised treatment.','🩺'],
    ['online-consultation','Online Consultation','Care from the comfort of home.','Secure video consultations for follow-ups and new concerns.','💻'],
    ['general-medicine-walkin','General Medicine Walk-in','Everyday health support.','Walk-in consultations for common health concerns.','🚶'],
    ['first-aid-support','First Aid Support','Immediate basic care.','On-site first aid for minor issues.','➕']
  ];
  SheetService.appendMany(cId, 'Services', s.map(function (x) {
    return { service_id: Utils.genId('SVC'), slug: x[0], name: x[1], summary: x[2], detail: x[3], icon: x[4], status: 'published', updated_at: now };
  }));
}

function _seedLab_(cId, now) {
  var packs = [
    ['basic-wellness','Basic Wellness Panel','Essential health markers in one simple test.','Within 24 hours','CBC;Blood sugar;Lipid profile'],
    ['thyroid-profile','Thyroid Profile','Complete thyroid function assessment.','Within 24 hours','TSH;T3;T4'],
    ['mental-wellness-screen','Mental Wellness Screen','Supportive screening relevant to mental wellbeing.','Within 48 hours','Vitamin D;Vitamin B12;Thyroid;CBC']
  ];
  SheetService.appendMany(cId, 'Lab_Packages', packs.map(function (x) {
    return { lab_package_id: Utils.genId('LAB'), slug: x[0], name: x[1], summary: x[2], turnaround: x[3], includes: x[4], status: 'published', updated_at: now };
  }));
}

function _seedFaqs_(cId, now) {
  var faqs = [
    ['general','Is my visit confidential?','Yes. Your privacy is central to our care. Conversations and records are kept strictly confidential.'],
    ['general','Do I need a referral?','No referral is needed. You can request a call back or book a consultation directly.'],
    ['booking','What is a private call back?','It is a request for our team to call you at a preferred time. It is not a confirmed appointment.'],
    ['booking','How do I book a confirmed appointment?','Use the "Book confirmed appointment" option, which takes you to our secure booking partner, PWeNS.'],
    ['general','Do you offer online consultations?','Yes, we offer secure online video consultations alongside in-clinic visits.'],
    ['lab','Where is home sample collection available?','Around Chandragiri, typically within about 10 km. Our team confirms availability before pickup.']
  ];
  SheetService.appendMany(cId, 'FAQs', faqs.map(function (f, i) {
    return { faq_id: Utils.genId('FAQ'), scope: f[0], question: f[1], answer: f[2], display_order: i + 1, status: 'published', updated_at: now };
  }));
}

function _seedRunbook_(cId, now) {
  var rows = [
    ['staff','operations','Handle a callback request','Open Callback Desk, pick the request, verify the patient, confirm preferred time, and call.',1],
    ['staff','operations','What to ask / not ask','Ask logistical questions only. Never ask for diagnosis, symptoms, or medication on the call.',2],
    ['admin','architecture','Architecture overview','Cloudflare Pages + two GAS web apps + two Sheets workbooks + GA4. BigQuery is sandbox-only.',1],
    ['admin','deploy','Cloudflare deploy hook flow','Approve content → Sync → GAS calls the Deploy Hook → Cloudflare rebuilds stubs + sitemap.',2]
  ];
  SheetService.appendMany(cId, 'Runbook', rows.map(function (r) {
    return { runbook_id: Utils.genId('RB'), mode: r[0], section: r[1], title: r[2], body: r[3], display_order: r[4], updated_at: now };
  }));
}

function _seedCallbackChecklist_(oId) {
  var items = [
    ['Confirmed patient identity', 'YES', 1], ['Confirmed preferred call time', 'YES', 2],
    ['Explained clinic vs online options', 'NO', 3], ['Shared next steps to book', 'YES', 4],
    ['Noted any accessibility needs', 'NO', 5]
  ];
  SheetService.appendMany(oId, 'Callback_Checklist_Config', items.map(function (it) {
    return { checklist_id: Utils.genId('CHK'), label: it[0], required: it[1], display_order: it[2], active: 'YES' };
  }));
}

function _seedCallbackQuestions_(oId) {
  var ask = [
    'When is the best time to reach you?',
    'Is this consultation for yourself or a family member?',
    'Would you prefer an in-clinic or online consultation?',
    'Do you have a preferred doctor or time?'
  ];
  var dont = [
    'Do not ask for a diagnosis or symptoms in detail.',
    'Do not ask about current medications.',
    'Do not ask for psychiatric history.',
    'Do not offer clinical advice on the call.'
  ];
  var rows = [];
  ask.forEach(function (q, i) { rows.push({ question_id: Utils.genId('Q'), kind: 'ask', text: q, display_order: i + 1, active: 'YES' }); });
  dont.forEach(function (q, i) { rows.push({ question_id: Utils.genId('Q'), kind: 'dont_ask', text: q, display_order: i + 1, active: 'YES' }); });
  SheetService.appendMany(oId, 'Callback_Question_Config', rows);
}

/**
 * Seed 60 condition rows. We start from a curated set of real psychiatry
 * conditions and ensure exactly 60 published rows with unique slugs. The first
 * entries carry full, patient-safe copy; the remainder are valid published
 * stubs the clinic can expand later from the CMS.
 */
function _seedConditions_(cId, now) {
  var curated = [
    ['depression','Depression','Persistent low mood that affects daily life — and is treatable.','Low mood;Loss of interest;Fatigue;Sleep changes;Difficulty concentrating','When low mood lasts more than two weeks or affects work, study, or relationships.','A combination of therapy, lifestyle support, and medication where appropriate.','NO'],
    ['anxiety','Anxiety','Excessive worry or fear that feels hard to control.','Restlessness;Racing thoughts;Rapid heartbeat;Difficulty sleeping','When worry is frequent, intense, or interferes with daily activities.','Talking therapies, coping strategies, and medication if needed.','NO'],
    ['sleep-problems','Sleep Problems','Trouble falling or staying asleep that affects your day.','Difficulty falling asleep;Waking frequently;Daytime tiredness','When poor sleep persists and affects mood, focus, or health.','Sleep assessment, behavioural strategies, and treatment of underlying causes.','NO'],
    ['addiction','Addiction','Dependence on substances or behaviours — recovery is possible.','Strong urges;Loss of control;Continued use despite harm','When substance or behaviour use feels out of control or causes harm.','A compassionate, structured programme of counselling and medical support.','NO'],
    ['child-teen-concerns','Child & Teen Concerns','Emotional and behavioural support for young people.','Mood changes;Withdrawal;School difficulties;Behaviour changes','When a child or teen shows lasting changes in mood, behaviour, or functioning.','Age-appropriate assessment and family-centred support.','NO'],
    ['self-harm-thoughts','Thoughts of Self-Harm','If you are struggling, urgent caring help is available.','Thoughts of self-harm;Hopelessness;Feeling trapped','If you have thoughts of harming yourself, please seek urgent help now.','Immediate safety support and compassionate ongoing care.','YES'],
    ['stress','Stress & Burnout','Feeling overwhelmed by pressure at work or home.','Tension;Irritability;Exhaustion;Trouble switching off','When stress feels constant or affects health and relationships.','Stress-management strategies, counselling, and lifestyle support.','NO'],
    ['ocd','Obsessive-Compulsive Concerns','Intrusive thoughts and repetitive behaviours that disrupt life.','Unwanted thoughts;Repetitive behaviours;Need for reassurance','When obsessions or compulsions take up time or cause distress.','Specialised therapy and medication where helpful.','NO'],
    ['bipolar','Mood Swings & Bipolar Concerns','Significant shifts in mood, energy, and activity.','Periods of high energy;Periods of low mood;Sleep changes','When mood shifts are extreme or disrupt daily life.','Careful assessment, mood stabilisation, and ongoing review.','NO'],
    ['memory-concerns','Memory & Focus Concerns','Changes in memory or concentration affecting daily life.','Forgetfulness;Difficulty concentrating;Confusion','When memory or focus changes are noticeable or worsening.','Assessment to understand causes and a supportive care plan.','NO'],
    ['relationship-stress','Relationship & Family Stress','Support through difficult relationship or family situations.','Conflict;Communication difficulties;Emotional strain','When relationship stress affects wellbeing or daily functioning.','Counselling and practical strategies for individuals and families.','NO'],
    ['grief','Grief & Loss','Compassionate support through bereavement and loss.','Sadness;Difficulty coping;Sleep or appetite changes','When grief feels overwhelming or persists in a way that affects daily life.','Supportive counselling at your own pace.','NO']
  ];

  var rows = curated.map(function (c) {
    return {
      condition_id: Utils.genId('CND'), slug: c[0], name: c[1], one_line_summary: c[2],
      symptoms: c[3], when_to_consult: c[4], treatment_approach: c[5], related_conditions: '',
      is_emergency: c[6], faqs: '', seo_title: c[1] + ' Treatment in Tirupati | JS Neurominds',
      seo_description: c[2], status: 'published', updated_at: now
    };
  });

  // Expand to exactly 60 published rows with additional valid, patient-safe topics.
  var extra = ['panic-attacks','social-anxiety','phobias','ptsd','postnatal-depression','perinatal-anxiety','adult-adhd','autism-support','anger-management','low-self-esteem','exam-stress','workplace-stress','smoking-cessation','alcohol-dependence','internet-overuse','gaming-overuse','eating-concerns','body-image-concerns','chronic-pain-coping','health-anxiety','adjustment-difficulties','loneliness','caregiver-stress','menopause-mood','andropause-mood','sexual-wellbeing-concerns','psychosomatic-concerns','tic-concerns','nail-biting','bedwetting-support','learning-difficulties','school-refusal','teen-mood-concerns','sleep-in-children','elderly-depression','elderly-anxiety','dementia-support','post-stroke-mood','thyroid-related-mood','vitamin-deficiency-mood','migraine-and-mood','irritability','mood-and-diabetes','postpartum-support','marital-counselling','divorce-coping','financial-stress','bereavement-support'];
  var idx = 0;
  while (rows.length < 60 && idx < extra.length) {
    var slug = extra[idx++];
    var name = slug.replace(/-/g, ' ').replace(/\b\w/g, function (m) { return m.toUpperCase(); });
    rows.push({
      condition_id: Utils.genId('CND'), slug: slug, name: name,
      one_line_summary: 'Compassionate, evidence-based support for ' + name.toLowerCase() + '.',
      symptoms: '', when_to_consult: 'When it affects your daily life or wellbeing, our team can help.',
      treatment_approach: 'A personalised, supportive plan tailored to you.',
      related_conditions: '', is_emergency: 'NO', faqs: '',
      seo_title: name + ' | JS Neurominds', seo_description: 'Support for ' + name.toLowerCase() + ' in Tirupati and Chandragiri.',
      status: 'published', updated_at: now
    });
  }

  SheetService.appendMany(cId, 'Conditions', rows);
  Logger.log('Seeded ' + rows.length + ' conditions.');
}
