/**
 * JS Neurominds V1 — gas-admin-cms/CloudflareDeployService.gs
 * Triggers a Cloudflare Pages rebuild via the Deploy Hook. The hook URL is a
 * SECRET and lives ONLY in Script Properties (CLOUDFLARE_DEPLOY_HOOK_URL) —
 * never in code, the frontend, or any committed file. Each trigger is recorded
 * to Cloudflare_Deployments and System_Config.
 */
var CloudflareDeployService = {
  triggerRebuild: function (user, triggerLabel) {
    RoleService.requireEdit(user, 'content');
    var hook = cloudflareDeployHookUrl_();
    var now = Utils.nowIso();
    if (!hook) {
      CloudflareDeployService._record('skipped_no_hook', '', triggerLabel, 'Deploy hook URL not configured in Script Properties.');
      return { success: false, error: 'deploy_hook_not_configured' };
    }
    try {
      var res = UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true });
      var code = res.getResponseCode();
      var status = (code >= 200 && code < 300) ? 'triggered' : 'failed';
      CloudflareDeployService._record(status, code, triggerLabel, '');
      try {
        SheetService.update(adminConfigContentId_(), 'System_Config', 'config_key', 'last_cloudflare_deploy_status', { config_value: status, updated_at: now });
        SheetService.update(adminConfigContentId_(), 'System_Config', 'config_key', 'last_cloudflare_deploy_triggered_at', { config_value: now, updated_at: now });
      } catch (e) { /* config rows optional */ }
      AuditService.log(user.email, 'cloudflare_deploy', 'deploy', '', status + ' (' + code + ')');
      return { success: status === 'triggered', data: { deploy_status: status, at: now, code: code } };
    } catch (e) {
      CloudflareDeployService._record('error', '', triggerLabel, String(e && e.message).slice(0, 160));
      return { success: false, error: 'deploy_request_failed' };
    }
  },
  _record: function (status, code, trigger, note) {
    try {
      SheetService.append(adminOperationsAuditId_(), 'Cloudflare_Deployments', {
        deploy_id: Utils.genId('DEP'), created_at: Utils.nowIso(), trigger: trigger || 'manual',
        status: status, response_code: code, note: note || ''
      });
    } catch (e) { /* non-fatal */ }
  }
};
