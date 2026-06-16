/**
 * JS Neurominds V1 — gas-admin-cms/RunbookService.gs
 * Serves runbook content (staff + admin modes) from the Runbook tab so the
 * clinic can edit guidance without code changes.
 */
var RunbookService = {
  get: function (user, mode) {
    RoleService.requireView(user, 'runbook');
    var rows = SheetService.readAll(adminConfigContentId_(), 'Runbook');
    if (mode) rows = rows.filter(function (r) { return r.mode === mode; });
    return rows.sort(function (a, b) { return Number(a.display_order) - Number(b.display_order); });
  }
};
