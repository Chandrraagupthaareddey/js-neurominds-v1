/**
 * JS Neurominds V1 — gas-admin-cms/Config.gs
 * Central config for the Admin CMS. Workbook IDs, the Cloudflare Deploy Hook
 * URL, and any keys live in Script Properties — NEVER in code, NEVER in the
 * frontend. Set during runSetup() or manually per docs/DEPLOYMENT.md.
 */

var ADMIN_CONFIG = {
  CACHE_TTL_SECONDS: 120,
  PROP_KEYS: {
    DB_FOLDER_ID: 'JSNM_V1_DATABASE_FOLDER_ID',
    CONFIG_CONTENT_ID: 'CONFIG_CONTENT_WORKBOOK_ID',
    OPERATIONS_AUDIT_ID: 'OPERATIONS_AUDIT_WORKBOOK_ID',
    CLOUDFLARE_DEPLOY_HOOK: 'CLOUDFLARE_DEPLOY_HOOK_URL',
    GA4_PROPERTY_ID: 'GA4_PROPERTY_ID',
    BIGQUERY_PROJECT_ID: 'BIGQUERY_PROJECT_ID'
  },
  // Non-secret defaults seeded into Analytics_Config (the real GA4 IDs are
  // public identifiers; BigQuery is sandbox/optional).
  GA4: {
    MEASUREMENT_ID: 'G-WKLHEDHC5D', PROPERTY_ID: '541725914',
    ACCOUNT_ID: '398033815', STREAM_ID: '15078146542'
  },
  BIGQUERY: {
    PROJECT_ID: 'jsnm-analytics', REPORTING_DATASET_ID: 'jsnm_reporting',
    LOCATION: 'US', STATUS: 'sandbox_v1_optional', STREAMING_EXPORT: 'false'
  }
};

function adminProp_(key) { return PropertiesService.getScriptProperties().getProperty(key); }
function setAdminProp_(key, val) { PropertiesService.getScriptProperties().setProperty(key, val); }

function adminConfigContentId_() {
  var id = adminProp_(ADMIN_CONFIG.PROP_KEYS.CONFIG_CONTENT_ID);
  if (!id) throw new Error('CONFIG_CONTENT_WORKBOOK_ID not set. Run runSetup() first.');
  return id;
}
function adminOperationsAuditId_() {
  var id = adminProp_(ADMIN_CONFIG.PROP_KEYS.OPERATIONS_AUDIT_ID);
  if (!id) throw new Error('OPERATIONS_AUDIT_WORKBOOK_ID not set. Run runSetup() first.');
  return id;
}
function cloudflareDeployHookUrl_() {
  // Returns null if not configured — callers degrade gracefully.
  return adminProp_(ADMIN_CONFIG.PROP_KEYS.CLOUDFLARE_DEPLOY_HOOK) || null;
}
function ga4PropertyId_() {
  return adminProp_(ADMIN_CONFIG.PROP_KEYS.GA4_PROPERTY_ID) || ADMIN_CONFIG.GA4.PROPERTY_ID;
}
function bigQueryProjectId_() {
  return adminProp_(ADMIN_CONFIG.PROP_KEYS.BIGQUERY_PROJECT_ID) || ADMIN_CONFIG.BIGQUERY.PROJECT_ID;
}
