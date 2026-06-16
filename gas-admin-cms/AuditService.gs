/**
 * JS Neurominds V1 — gas-admin-cms/AuditService.gs
 * Append-only audit trail for admin actions. Every write/publish/status change
 * records who did what, when. Logging failures never block the action.
 */
var AuditService = {
  log: function (actorEmail, action, resourceType, resourceId, detail) {
    try {
      SheetService.append(adminOperationsAuditId_(), 'Admin_Audit', {
        audit_id: Utils.genId('AUD'), created_at: Utils.nowIso(),
        actor_email: actorEmail || 'unknown', action: action,
        resource_type: resourceType || '', resource_id: resourceId || '',
        detail: Utils.sanitizeText(detail || '', 300)
      });
    } catch (e) { /* non-fatal */ }
  },
  publish: function (actorEmail, resourceType, resourceId, action) {
    try {
      SheetService.append(adminOperationsAuditId_(), 'Publish_History', {
        publish_id: Utils.genId('PUB'), created_at: Utils.nowIso(),
        resource_type: resourceType, resource_id: resourceId, action: action || 'publish', actor_email: actorEmail
      });
    } catch (e) { /* non-fatal */ }
  }
};
