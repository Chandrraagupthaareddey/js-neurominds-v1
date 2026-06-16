/**
 * JS Neurominds V1 — gas-public-api/HealthService.gs
 * Lightweight health check for the Public API. Confirms Script Properties are
 * set and both workbooks are reachable. Used by uptime checks and the admin
 * System Health panel.
 */

var HealthService = {
  check: function () {
    var result = { public_api: 'ok', config_content: 'unknown', operations_audit: 'unknown', email_quota_remaining: null, at: Utils.nowIso() };
    try {
      var cId = getConfigContentId_();
      SpreadsheetApp.openById(cId).getName();
      result.config_content = 'ok';
    } catch (e) { result.config_content = 'error'; result.public_api = 'attention'; }
    try {
      var oId = getOperationsAuditId_();
      SpreadsheetApp.openById(oId).getName();
      result.operations_audit = 'ok';
    } catch (e) { result.operations_audit = 'error'; result.public_api = 'attention'; }
    try { result.email_quota_remaining = MailApp.getRemainingDailyQuota(); } catch (e) { result.email_quota_remaining = null; }
    return result;
  }
};
