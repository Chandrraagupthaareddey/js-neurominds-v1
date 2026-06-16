/**
 * JS Neurominds V1 — shared/schemas.js
 * Authoritative schema for the two Google Sheets workbooks. This single
 * definition drives: (1) GAS SetupService tab/header creation, (2) the
 * validate-schemas script, and (3) documentation. Keep column order stable —
 * the GAS layer reads by header name, but humans read by position.
 *
 * Each tab lists its column headers in order. The first column is the natural
 * key unless noted.
 */

export const CONFIG_CONTENT_WORKBOOK = 'JSNM_V1_CONFIG_CONTENT';
export const OPERATIONS_AUDIT_WORKBOOK = 'JSNM_V1_OPERATIONS_AUDIT';

export const CONFIG_CONTENT_TABS = {
  Pages: ['page_id', 'slug', 'title', 'in_nav', 'nav_order', 'status', 'updated_at'],
  Conditions: ['condition_id', 'slug', 'name', 'one_line_summary', 'symptoms', 'when_to_consult', 'treatment_approach', 'related_conditions', 'is_emergency', 'faqs', 'seo_title', 'seo_description', 'status', 'updated_at'],
  Treatments: ['treatment_id', 'slug', 'name', 'one_line_summary', 'overview', 'what_to_expect', 'conditions_treated', 'seo_title', 'seo_description', 'status', 'updated_at'],
  Doctors: ['doctor_id', 'slug', 'full_name', 'qualification', 'specialization', 'experience_years', 'languages', 'consultation_type', 'conditions_handled', 'short_bio', 'profile_photo_link', 'support_booking_enabled', 'direct_booking_enabled', 'online_consultation_enabled', 'clinic_visit_enabled', 'pwens_booking_url', 'status', 'updated_at'],
  Services: ['service_id', 'slug', 'name', 'summary', 'detail', 'icon', 'status', 'updated_at'],
  Lab_Packages: ['lab_package_id', 'slug', 'name', 'summary', 'turnaround', 'includes', 'status', 'updated_at'],
  Lab_Tests: ['lab_test_id', 'lab_package_id', 'name', 'description', 'status', 'updated_at'],
  Locations: ['location_id', 'slug', 'name', 'area', 'pincode', 'maps_url', 'seo_title', 'seo_description', 'status', 'updated_at'],
  Blogs: ['blog_id', 'slug', 'title', 'excerpt', 'body', 'author', 'category', 'cover_image', 'seo_title', 'seo_description', 'status', 'updated_at'],
  FAQs: ['faq_id', 'scope', 'question', 'answer', 'display_order', 'status', 'updated_at'],
  SEO_Metadata: ['seo_id', 'page_type', 'slug', 'meta_title', 'meta_description', 'og_image', 'canonical', 'updated_at'],
  Media_Library: ['media_id', 'file_name', 'drive_file_id', 'drive_url', 'alt_text', 'uploaded_by', 'created_at'],
  Navigation: ['nav_id', 'label', 'route', 'display_order', 'visible', 'updated_at'],
  Promotions: ['promo_id', 'title', 'body', 'start_date', 'end_date', 'active', 'updated_at'],
  Users: ['email', 'role_key', 'name', 'status', 'created_at', 'last_login_at'],
  Roles: ['role_key', 'role_label', 'description'],
  Role_Permissions: ['role_key', 'section_key', 'can_view', 'can_edit', 'can_publish'],
  System_Config: ['config_key', 'config_value', 'description', 'updated_at'],
  Analytics_Config: ['key', 'value', 'description', 'updated_at'],
  Runbook: ['runbook_id', 'mode', 'section', 'title', 'body', 'display_order', 'updated_at'],
  Feature_Flags: ['flag_key', 'enabled', 'description', 'updated_at']
};

export const OPERATIONS_AUDIT_TABS = {
  Callback_Requests: ['callback_id', 'created_at', 'patient_name', 'mobile_number', 'whatsapp_number', 'patient_email', 'preferred_call_date', 'preferred_call_time_slot', 'consultation_for', 'new_patient_or_followup', 'preferred_doctor', 'generic_concern_category', 'consultation_mode_interest', 'short_note', 'source_hint', 'status', 'assigned_to', 'updated_at'],
  Callback_Checklist_Config: ['checklist_id', 'label', 'required', 'display_order', 'active'],
  Callback_Question_Config: ['question_id', 'kind', 'text', 'display_order', 'active'],
  Callback_Staff_Responses: ['response_id', 'callback_id', 'checklist_id', 'answer', 'staff_email', 'created_at'],
  Callback_Status_History: ['history_id', 'callback_id', 'old_status', 'new_status', 'note', 'actor_email', 'created_at'],
  Lab_Requests: ['lab_request_id', 'created_at', 'name', 'mobile', 'whatsapp', 'email', 'pickup_area', 'preferred_pickup_date', 'preferred_pickup_time', 'selected_package', 'status', 'assigned_to', 'updated_at'],
  Feedback: ['feedback_id', 'created_at', 'rating', 'message', 'consent_given', 'source_hint', 'status', 'moderated_by', 'updated_at'],
  Email_Logs: ['email_log_id', 'created_at', 'kind', 'recipient_type', 'related_id', 'status', 'error_message'],
  Admin_Audit: ['audit_id', 'created_at', 'actor_email', 'action', 'resource_type', 'resource_id', 'detail'],
  Backup_Registry: ['backup_id', 'created_at', 'kind', 'drive_file_id', 'drive_url', 'status', 'note'],
  Publish_History: ['publish_id', 'created_at', 'resource_type', 'resource_id', 'action', 'actor_email'],
  Error_Logs: ['error_id', 'created_at', 'source', 'message', 'stack', 'context'],
  Health_Checks: ['check_id', 'created_at', 'check_type', 'status', 'detail'],
  Cloudflare_Deployments: ['deploy_id', 'created_at', 'trigger', 'status', 'response_code', 'note']
};

// Required System_Config keys the setup must seed (non-secret defaults; secrets
// are added manually post-setup per docs/DEPLOYMENT.md).
export const SYSTEM_CONFIG_KEYS = [
  'clinic_name', 'clinic_short', 'display_phone', 'cta_phone', 'whatsapp_link',
  'call_link', 'maps_url', 'address', 'footer', 'support_email',
  'pwens_booking_url', 'domain',
  'CLOUDFLARE_DEPLOY_HOOK_URL', 'cloudflare_auto_deploy_enabled',
  'last_cloudflare_deploy_status', 'last_cloudflare_deploy_triggered_at'
];

export const ANALYTICS_CONFIG_KEYS = [
  'GA4_MEASUREMENT_ID', 'GA4_PROPERTY_ID', 'GA4_ACCOUNT_ID', 'GA4_STREAM_ID',
  'BIGQUERY_PROJECT_ID', 'REPORTING_DATASET_ID', 'BIGQUERY_STATUS',
  'BIGQUERY_STREAMING_EXPORT'
];

export function allTabs() {
  return {
    [CONFIG_CONTENT_WORKBOOK]: CONFIG_CONTENT_TABS,
    [OPERATIONS_AUDIT_WORKBOOK]: OPERATIONS_AUDIT_TABS
  };
}
