/**
 * JS Neurominds V1 — gas-admin-cms/DoctorAdminService.gs
 * Read doctors for the admin (any status). Editing endpoints can be added here.
 */
var DoctorAdminService = {
  list: function (user) {
    RoleService.requireView(user, 'doctors');
    return SheetService.readAll(adminConfigContentId_(), 'Doctors');
  }
};
