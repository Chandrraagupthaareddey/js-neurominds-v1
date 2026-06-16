/**
 * JS Neurominds V1 — gas-admin-cms/AlertService.gs
 * Lightweight health snapshot used by the admin System Health panel: API
 * reachability, email quota, recent email failures, error counts, last deploy.
 */
var AlertService = {
  health: function (user) {
    RoleService.requireView(user, 'health');
    var oId = adminOperationsAuditId_();
    var emailLogs = SheetService.readAll(oId, 'Email_Logs');
    var errors = SheetService.readAll(oId, 'Error_Logs');
    var deploys = SheetService.readAll(oId, 'Cloudflare_Deployments');
    var since = Date.now() - 24 * 3600 * 1000;

    var lastDeploy = deploys.length ? deploys[deploys.length - 1] : null;
    var sys = {};
    SheetService.readAll(adminConfigContentId_(), 'System_Config').forEach(function (r) { sys[r.config_key] = r.config_value; });

    return {
      public_api: 'ok', admin_api: 'ok',
      email_quota_remaining: AlertService._safeQuota(),
      last_email_failures: emailLogs.filter(function (e) { return e.status === 'failed'; }).length,
      error_count_24h: errors.filter(function (e) { return new Date(e.created_at).getTime() > since; }).length,
      last_deploy_status: (lastDeploy && lastDeploy.status) || sys.last_cloudflare_deploy_status || 'none',
      last_deploy_at: (lastDeploy && lastDeploy.created_at) || sys.last_cloudflare_deploy_triggered_at || '—'
    };
  },
  _safeQuota: function () { try { return MailApp.getRemainingDailyQuota(); } catch (e) { return null; } }
};
