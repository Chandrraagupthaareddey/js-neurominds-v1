/**
 * JS Neurominds V1 — gas-admin-cms/BackupService.gs
 * Creates dated copies of both workbooks into a backup subfolder in Drive and
 * records each backup in Backup_Registry. Super Admin only.
 */
var BackupService = {
  run: function (user) {
    if (user.role !== 'super_admin') throw new Error('FORBIDDEN_BACKUP');
    var now = Utils.nowIso();
    var stamp = Utils.today();
    var dbFolderId = adminProp_(ADMIN_CONFIG.PROP_KEYS.DB_FOLDER_ID);
    var root = DriveApp.getFolderById(dbFolderId);
    var backups = BackupService._ensureSubfolder(root, 'backups');
    var dated = backups.createFolder('backup_' + stamp + '_' + Utilities.getUuid().slice(0, 6));

    var made = [];
    [adminConfigContentId_(), adminOperationsAuditId_()].forEach(function (id) {
      var file = DriveApp.getFileById(id);
      var copy = file.makeCopy(file.getName() + '_' + stamp, dated);
      made.push(copy);
      SheetService.append(adminOperationsAuditId_(), 'Backup_Registry', {
        backup_id: Utils.genId('BAK'), created_at: now, kind: 'sheets_copy',
        drive_file_id: copy.getId(), drive_url: copy.getUrl(), status: 'success', note: file.getName()
      });
    });
    AuditService.log(user.email, 'backup_run', 'backup', dated.getId(), made.length + ' files');
    return { success: true, data: { folder_id: dated.getId(), files: made.length } };
  },
  list: function (user) {
    RoleService.requireView(user, 'backup');
    return SheetService.readAll(adminOperationsAuditId_(), 'Backup_Registry')
      .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  },
  _ensureSubfolder: function (parent, name) {
    var it = parent.getFoldersByName(name);
    return it.hasNext() ? it.next() : parent.createFolder(name);
  }
};
