/**
 * JS Neurominds V1 — gas-admin-cms/CallbackDeskService.gs
 * Read + manage callback requests. Status changes are RBAC-checked, locked,
 * and recorded to status history + audit.
 */
var CallbackDeskService = {
  list: function (user) {
    RoleService.requireView(user, 'callback');
    return SheetService.readAll(adminOperationsAuditId_(), 'Callback_Requests')
      .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  },
  checklist: function (user) {
    RoleService.requireView(user, 'callback');
    return SheetService.readWhere(adminOperationsAuditId_(), 'Callback_Checklist_Config', 'active', 'YES');
  },
  questions: function (user) {
    RoleService.requireView(user, 'callback');
    var rows = SheetService.readWhere(adminOperationsAuditId_(), 'Callback_Question_Config', 'active', 'YES');
    return {
      ask: rows.filter(function (r) { return r.kind === 'ask'; }).map(function (r) { return r.text; }),
      dont_ask: rows.filter(function (r) { return r.kind === 'dont_ask'; }).map(function (r) { return r.text; })
    };
  },
  history: function (user, callbackId) {
    RoleService.requireView(user, 'callback');
    return SheetService.readWhere(adminOperationsAuditId_(), 'Callback_Status_History', 'callback_id', callbackId)
      .map(function (h) { return { status: h.new_status, note: h.note, at: h.created_at }; });
  },
  updateStatus: function (user, callbackId, newStatus, note) {
    RoleService.requireEdit(user, 'callback');
    var oId = adminOperationsAuditId_();
    var current = SheetService.findOne(oId, 'Callback_Requests', 'callback_id', callbackId);
    if (!current) return { success: false, error: 'not_found' };
    var now = Utils.nowIso();
    SheetService.update(oId, 'Callback_Requests', 'callback_id', callbackId, { status: newStatus, updated_at: now, assigned_to: user.email });
    SheetService.append(oId, 'Callback_Status_History', {
      history_id: Utils.genId('HIS'), callback_id: callbackId, old_status: current.status, new_status: newStatus,
      note: Utils.sanitizeText(note, 300), actor_email: user.email, created_at: now
    });
    AuditService.log(user.email, 'callback_status', 'callback', callbackId, current.status + '→' + newStatus);
    return { success: true };
  }
};
