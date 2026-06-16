/**
 * JS Neurominds V1 — gas-public-api/Config.gs
 * Central config for the Public API. Secrets and workbook IDs are read from
 * Script Properties (set during setup / per docs/DEPLOYMENT.md). Nothing secret
 * is hardcoded here.
 */

var CONFIG = {
  CACHE_TTL_SECONDS: 300,          // public content cache duration
  MAX_PAGE_SIZE: 50,               // pagination cap for list endpoints
  RATE_LIMIT_PER_MIN: 30,          // per-IP-ish soft limit via cache counters
  PROP_KEYS: {
    CONFIG_CONTENT_ID: 'CONFIG_CONTENT_WORKBOOK_ID',
    OPERATIONS_AUDIT_ID: 'OPERATIONS_AUDIT_WORKBOOK_ID'
  }
};

function getProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function getConfigContentId_() {
  var id = getProp_(CONFIG.PROP_KEYS.CONFIG_CONTENT_ID);
  if (!id) throw new Error('CONFIG_CONTENT_WORKBOOK_ID not set in Script Properties. Run admin setup first.');
  return id;
}

function getOperationsAuditId_() {
  var id = getProp_(CONFIG.PROP_KEYS.OPERATIONS_AUDIT_ID);
  if (!id) throw new Error('OPERATIONS_AUDIT_WORKBOOK_ID not set in Script Properties. Run admin setup first.');
  return id;
}

/** Read a System_Config value (cached) — used to expose editable clinic config. */
function getSystemConfig_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('system_config');
  if (cached) return JSON.parse(cached);
  var rows = SheetService.readAll(getConfigContentId_(), 'System_Config');
  var out = {};
  rows.forEach(function (r) { out[r.config_key] = r.config_value; });
  cache.put('system_config', JSON.stringify(out), CONFIG.CACHE_TTL_SECONDS);
  return out;
}
