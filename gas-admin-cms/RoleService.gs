/**
 * JS Neurominds V1 — gas-admin-cms/RoleService.gs
 * Authoritative server-side RBAC. The admin UI gates the same way for UX, but
 * THIS is the source of truth. Permissions are read from Role_Permissions so
 * they can be changed without code edits.
 */
var RoleService = {
  _permsCache: null,
  _loadPerms: function () {
    if (RoleService._permsCache) return RoleService._permsCache;
    var rows = SheetService.readAll(adminConfigContentId_(), 'Role_Permissions');
    var map = {};
    rows.forEach(function (r) {
      map[r.role_key] = map[r.role_key] || {};
      map[r.role_key][r.section_key] = {
        view: String(r.can_view).toUpperCase() === 'YES',
        edit: String(r.can_edit).toUpperCase() === 'YES',
        publish: String(r.can_publish).toUpperCase() === 'YES'
      };
    });
    RoleService._permsCache = map;
    return map;
  },

  canView: function (role, section) {
    var p = RoleService._loadPerms()[role];
    return !!(p && p[section] && p[section].view);
  },
  canEdit: function (role, section) {
    var p = RoleService._loadPerms()[role];
    return !!(p && p[section] && p[section].edit);
  },
  canPublish: function (role, section) {
    var p = RoleService._loadPerms()[role];
    return !!(p && p[section] && p[section].publish);
  },

  /** Throw unless the role can view the section. */
  requireView: function (user, section) {
    if (!RoleService.canView(user.role, section)) throw new Error('FORBIDDEN:' + section);
  },
  requireEdit: function (user, section) {
    if (!RoleService.canEdit(user.role, section)) throw new Error('FORBIDDEN_EDIT:' + section);
  }
};
