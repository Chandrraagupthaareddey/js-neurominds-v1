/**
 * JS Neurominds V1 — gas-admin-cms/ContentAdminService.gs
 * Read all content (any status) for review, and publish drafts. Publishing is
 * RBAC-checked and recorded. Feedback moderation lives here too.
 */
var ContentAdminService = {
  all: function (user) {
    RoleService.requireView(user, 'content');
    var c = adminConfigContentId_();
    return {
      conditions: SheetService.readAll(c, 'Conditions'),
      treatments: SheetService.readAll(c, 'Treatments'),
      services: SheetService.readAll(c, 'Services'),
      lab_packages: SheetService.readAll(c, 'Lab_Packages'),
      blogs: SheetService.readAll(c, 'Blogs'),
      faqs: SheetService.readAll(c, 'FAQs')
    };
  },
  // Save edits to a private draft (draft_json). Live columns are untouched, so
  // the public site is unaffected until an authorized user publishes.
  saveDraft: function (user, tab, keyCol, keyVal, fields) {
    RoleService.requireEdit(user, 'content');
    var clean = {};
    Object.keys(fields || {}).forEach(function (k) { if (k !== keyCol && k !== 'status' && k !== 'draft_json') clean[k] = fields[k]; });
    var ok = SheetService.update(adminConfigContentId_(), tab, keyCol, keyVal, {
      draft_json: JSON.stringify(clean), status: 'draft',
      updated_by: user.email, updated_at: Utils.nowIso()
    });
    if (ok) AuditService.log(user.email, 'content_save_draft', tab, keyVal, '');
    return { success: ok };
  },
  submitForReview: function (user, tab, keyCol, keyVal) {
    RoleService.requireEdit(user, 'content');
    var ok = SheetService.update(adminConfigContentId_(), tab, keyCol, keyVal, { status: 'pending', updated_at: Utils.nowIso() });
    if (ok) AuditService.log(user.email, 'content_submit_review', tab, keyVal, '');
    return { success: ok };
  },
  requestChanges: function (user, tab, keyCol, keyVal) {
    RoleService.requireEdit(user, 'content');
    if (!RoleService.canPublish(user.role, 'content')) throw new Error('FORBIDDEN_PUBLISH');
    var ok = SheetService.update(adminConfigContentId_(), tab, keyCol, keyVal, { status: 'draft', updated_at: Utils.nowIso() });
    if (ok) AuditService.log(user.email, 'content_request_changes', tab, keyVal, '');
    return { success: ok };
  },
  publish: function (user, tab, keyCol, keyVal) {
    RoleService.requireEdit(user, 'content');
    if (!RoleService.canPublish(user.role, 'content')) throw new Error('FORBIDDEN_PUBLISH');
    // Apply any pending draft_json onto the live columns, then clear it.
    var patch = { status: 'published', updated_by: user.email, updated_at: Utils.nowIso() };
    var rows = SheetService.readAll(adminConfigContentId_(), tab);
    var row = null;
    for (var i = 0; i < rows.length; i++) { if (String(rows[i][keyCol]) === String(keyVal)) { row = rows[i]; break; } }
    if (row && row.draft_json) {
      try {
        var draft = JSON.parse(row.draft_json);
        Object.keys(draft).forEach(function (k) { if (k !== keyCol && k !== 'status') patch[k] = draft[k]; });
      } catch (e) { /* malformed draft ignored; publishes current live values */ }
      patch.draft_json = '';
    }
    var ok = SheetService.update(adminConfigContentId_(), tab, keyCol, keyVal, patch);
    if (ok) { AuditService.publish(user.email, tab, keyVal, 'publish'); }
    return { success: ok };
  },
  feedback: function (user) {
    RoleService.requireView(user, 'feedback');
    return SheetService.readAll(adminOperationsAuditId_(), 'Feedback')
      .sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  },
  moderateFeedback: function (user, feedbackId, status) {
    RoleService.requireEdit(user, 'feedback');
    var ok = SheetService.update(adminOperationsAuditId_(), 'Feedback', 'feedback_id', feedbackId, { status: status, moderated_by: user.email, updated_at: Utils.nowIso() });
    if (ok) AuditService.log(user.email, 'feedback_moderate', 'feedback', feedbackId, status);
    return { success: ok };
  }
};
