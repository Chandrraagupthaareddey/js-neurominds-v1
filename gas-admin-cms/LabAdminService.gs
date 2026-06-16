/**
 * JS Neurominds V1 — gas-admin-cms/LabAdminService.gs
 * Read + manage lab requests. Logistics only.
 */
var LabAdminService = {
  list: function (user) {
    RoleService.requireView(user, 'lab');
    return SheetService.readAll(adminOperationsAuditId_(), 'Lab_Requests')
      .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  },
  updateStatus: function (user, labId, newStatus) {
    RoleService.requireEdit(user, 'lab');
    var ok = SheetService.update(adminOperationsAuditId_(), 'Lab_Requests', 'lab_request_id', labId, { status: newStatus, updated_at: Utils.nowIso(), assigned_to: user.email });
    if (ok) AuditService.log(user.email, 'lab_status', 'lab', labId, newStatus);
    return { success: ok };
  }
};
